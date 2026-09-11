import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { verifyMagicLoginToken } from "./magic-link";
import { authUserFromRecord } from "./webauthn/session-user";
import { verifyWebAuthnLoginToken } from "./webauthn/tokens";

function getNextAuthSecret(): string | undefined {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") {
    return "dev-nextauth-secret-not-for-production";
  }
  return undefined;
}

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") === true;

function authDebug(...args: unknown[]) {
  if (process.env.NEXTAUTH_DEBUG === "true") {
    console.log(...args);
  }
}

export const authOptions: NextAuthOptions = {
  // Note: Don't use adapter with credentials provider - it causes session issues
  // adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        magicToken: { label: "Magic Token", type: "text" },
        webauthnToken: { label: "WebAuthn Token", type: "text" },
      },
      async authorize(credentials) {
        authDebug("[Auth] Authorize called with email:", credentials?.email);

        if (credentials?.webauthnToken) {
          try {
            const payload = verifyWebAuthnLoginToken(credentials.webauthnToken);
            const user = await prisma.user.findUnique({
              where: { id: payload.userId },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                gender: true,
                image: true,
                dateOfBirth: true,
                passkeysEnabled: true,
              },
            });
            if (
              user &&
              user.email.toLowerCase() === payload.email.toLowerCase() &&
              user.passkeysEnabled
            ) {
              return authUserFromRecord(user);
            }
          } catch {
            throw new Error("Face ID sign-in expired. Please try again.");
          }
          throw new Error("Face ID sign-in expired. Please try again.");
        }

        // Magic link sign-in (valid token, no password required)
        if (credentials?.magicToken) {
          try {
            const payload = verifyMagicLoginToken(credentials.magicToken);
            const user = await prisma.user.findUnique({
              where: { id: payload.userId },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                gender: true,
                image: true,
                dateOfBirth: true,
              },
            });

            if (
              user &&
              user.email.toLowerCase() === payload.email.toLowerCase() &&
              payload.purpose === "magic_login"
            ) {
              return authUserFromRecord(user);
            }
          } catch {
            throw new Error("Invalid or expired link");
          }
          throw new Error("Invalid or expired link");
        }

        if (!credentials?.email || !credentials?.password) {
          authDebug("[Auth] Missing credentials");
          throw new Error("Email and password are required");
        }

        const email = credentials.email.toLowerCase().trim();

        // Prefer unique lookup on normalised email; fall back for legacy mixed-case rows.
        const authSelect = {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          gender: true,
          image: true,
          dateOfBirth: true,
          passwordHash: true,
          password: true,
          passkeysEnabled: true,
        } as const;

        let user = await prisma.user.findUnique({
          where: { email },
          select: authSelect,
        });
        if (!user) {
          user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: authSelect,
          });
        }

        const storedHash = user?.passwordHash || user?.password;

        if (user && storedHash) {
          authDebug("[Auth] User found:", user.email, user.role);
          const isValid = await bcrypt.compare(credentials.password, storedHash);

          if (isValid) {
            authDebug("[Auth] User password valid, returning user");
            return authUserFromRecord(user);
          }

          // Member exists but password is wrong — do not fall through to clinic lookup.
          authDebug("[Auth] User password invalid");
          throw new Error("Invalid email or password");
        }

        // If not a user, try to find a Clinic (GP)
        const clinic = await prisma.clinic.findUnique({
          where: { leadGpEmail: email },
          select: {
            id: true,
            name: true,
            leadGpEmail: true,
            leadGpName: true,
            passwordHash: true,
            status: true,
          },
        });

        if (clinic && clinic.passwordHash) {
          authDebug("[Auth] Clinic found:", clinic.name, clinic.leadGpName);
          const isValid = await bcrypt.compare(credentials.password, clinic.passwordHash);

          if (isValid) {
            if (clinic.status !== "ACTIVE") {
              throw new Error("This clinic account is not active");
            }

            authDebug("[Auth] Clinic password valid, returning GP user");
            return {
              id: clinic.id,
              email: clinic.leadGpEmail,
              name: clinic.leadGpName,
              firstName: clinic.leadGpName.split(" ")[0] || clinic.leadGpName,
              lastName: clinic.leadGpName.split(" ").slice(1).join(" ") || "",
              role: "GP",
              gender: "OTHER",
              image: null,
              dateOfBirth: null,
              clinicName: clinic.name,
              clinicId: clinic.id,
            };
          }
        }

        authDebug("[Auth] No valid user or clinic found");
        throw new Error("Invalid email or password");
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      authDebug("[Auth] JWT callback, user present:", !!user, "trigger:", trigger);

      try {
        // Initial sign in - set token from user object
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: string }).role || "MEMBER";
          token.firstName = (user as { firstName?: string }).firstName || "";
          token.lastName = (user as { lastName?: string }).lastName || "";
          token.gender = (user as { gender?: string }).gender || "OTHER";
          token.dateOfBirth = (user as { dateOfBirth?: string | null }).dateOfBirth || null;
          // GP-specific fields
          token.clinicName = (user as { clinicName?: string }).clinicName || null;
          token.clinicId = (user as { clinicId?: string }).clinicId || null;
        }

        // Session update triggered - fetch fresh data from database
        if (trigger === "update" && token.id && token.role !== "GP") {
          authDebug("[Auth] Refreshing user data from database...");
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              firstName: true,
              lastName: true,
              role: true,
              gender: true,
              dateOfBirth: true,
            },
          });

          if (freshUser) {
            authDebug("[Auth] Updated user data:", freshUser.firstName, freshUser.lastName);
            token.firstName = freshUser.firstName;
            token.lastName = freshUser.lastName;
            token.role = freshUser.role;
            token.gender = freshUser.gender;
            token.dateOfBirth = freshUser.dateOfBirth?.toISOString() || null;
          }
        }
      } catch (error) {
        console.error("[Auth] JWT callback failed:", error);
      }

      return token;
    },
    async session({ session, token }) {
      authDebug("[Auth] Session callback, token id:", token.id);
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.firstName = token.firstName as string;
          session.user.lastName = token.lastName as string;
          session.user.gender = token.gender as string;
          session.user.dateOfBirth = token.dateOfBirth as string | null;
          // GP-specific fields
          session.user.clinicName = token.clinicName as string | null;
          session.user.clinicId = token.clinicId as string | null;
        }
      } catch (error) {
        console.error("[Auth] Session callback failed:", error);
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: getNextAuthSecret(),
  debug: process.env.NEXTAUTH_DEBUG === "true",
  // Secure cookies only when served over HTTPS (iframe / cross-site embeds)
  ...(useSecureCookies
    ? {
        cookies: {
          sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: "none" as const,
              path: "/",
              secure: true,
            },
          },
          csrfToken: {
            name: `__Host-next-auth.csrf-token`,
            options: {
              httpOnly: true,
              sameSite: "none" as const,
              path: "/",
              secure: true,
            },
          },
          callbackUrl: {
            name: `__Secure-next-auth.callback-url`,
            options: {
              httpOnly: true,
              sameSite: "none" as const,
              path: "/",
              secure: true,
            },
          },
        },
      }
    : {}),
};

// Types for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth: string | null;
      image?: string | null;
      // GP-specific fields
      clinicName?: string | null;
      clinicId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string | null;
  }
}

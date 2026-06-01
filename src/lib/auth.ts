import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  // Note: Don't use adapter with credentials provider - it causes session issues
  // adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] Authorize called with email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials");
          throw new Error("Email and password are required");
        }

        const email = credentials.email.toLowerCase();

        // First, try to find a User
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (user && user.passwordHash) {
          console.log("[Auth] User found:", user.email, user.role);
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (isValid) {
            console.log("[Auth] User password valid, returning user");
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              gender: user.gender,
              image: user.image,
              dateOfBirth: user.dateOfBirth?.toISOString() || null,
            };
          }
        }

        // If not a user, try to find a Clinic (GP)
        const clinic = await prisma.clinic.findUnique({
          where: { leadGpEmail: email },
        });

        if (clinic && clinic.passwordHash) {
          console.log("[Auth] Clinic found:", clinic.name, clinic.leadGpName);
          const isValid = await bcrypt.compare(credentials.password, clinic.passwordHash);

          if (isValid) {
            if (clinic.status !== "ACTIVE") {
              throw new Error("This clinic account is not active");
            }

            console.log("[Auth] Clinic password valid, returning GP user");
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

        console.log("[Auth] No valid user or clinic found");
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
      console.log("[Auth] JWT callback, user present:", !!user, "trigger:", trigger);

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
      if (trigger === "update" && token.id) {
        console.log("[Auth] Refreshing user data from database...");
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
          console.log("[Auth] Updated user data:", freshUser.firstName, freshUser.lastName);
          token.firstName = freshUser.firstName;
          token.lastName = freshUser.lastName;
          token.role = freshUser.role;
          token.gender = freshUser.gender;
          token.dateOfBirth = freshUser.dateOfBirth?.toISOString() || null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log("[Auth] Session callback, token id:", token.id);
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
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug for troubleshooting
  // Use secure cookies in production (HTTPS) for iframe compatibility
  // In development (HTTP), use lax cookies
  ...(process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https")
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

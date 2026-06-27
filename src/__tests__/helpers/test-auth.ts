const BASE_URL = process.env.SECURITY_TEST_BASE_URL ?? "http://localhost:3000";

function parseCookieHeader(setCookie: string): { name: string; value: string } {
  const [pair] = setCookie.split(";");
  const eq = pair.indexOf("=");
  return {
    name: pair.slice(0, eq),
    value: pair.slice(eq + 1),
  };
}

function mergeCookies(existing: Map<string, string>, response: Response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  for (const raw of setCookies) {
    const { name, value } = parseCookieHeader(raw);
    existing.set(name, value);
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/** Sign in via NextAuth credentials and return a Cookie header string. */
export async function signInAs(email: string, password: string): Promise<string> {
  const jar = new Map<string, string>();

  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  mergeCookies(jar, csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: "true",
    }),
    redirect: "manual",
  });
  mergeCookies(jar, loginRes);

  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  mergeCookies(jar, sessionRes);

  const session = (await sessionRes.json()) as { user?: { email?: string } };
  if (!session.user?.email) {
    throw new Error(`Sign-in failed for ${email}`);
  }

  return cookieHeader(jar);
}

export async function authedFetch(
  path: string,
  cookies: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Cookie: cookies,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

export { BASE_URL };

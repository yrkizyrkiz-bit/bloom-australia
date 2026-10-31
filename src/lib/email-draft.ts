import { randomBytes } from "node:crypto";
import tls from "node:tls";
import { google } from "googleapis";
import { isProductionRuntime } from "@/lib/security/jwt-secret";
import type { EmailProcessKey } from "@/lib/email-process";
import {
  alignFromWithGoogleSmtpUser,
  formatFromHeader,
  resolveEmailIdentity,
} from "@/lib/email-identity";

export type CreateEmailDraftOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  process?: EmailProcessKey;
};

export type EmailDraftMethod = "gmail_api" | "imap" | "mock";

export type CreateEmailDraftResult = {
  success: boolean;
  method?: EmailDraftMethod;
  draftId?: string;
  mailbox?: string;
  error?: string;
};

const IMAP_TIMEOUT_MS = 15_000;

export function imapDraftConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SMTP_USER && process.env.GOOGLE_SMTP_PASS);
}

export function gmailApiDraftConfigured(): boolean {
  return Boolean(gmailServiceAccountJson() && gmailImpersonateUser());
}

export function mailboxDraftConfigured(): boolean {
  return imapDraftConfigured() || gmailApiDraftConfigured();
}

function gmailServiceAccountJson(): string | undefined {
  return process.env.GOOGLE_GMAIL_CREDENTIALS || process.env.GOOGLE_CALENDAR_CREDENTIALS;
}

function gmailImpersonateUser(): string {
  return (process.env.GOOGLE_GMAIL_USER || process.env.GOOGLE_SMTP_USER || "").trim();
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function encodeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/** Build a CRLF RFC822 message suitable for Gmail drafts.create or IMAP APPEND. */
export function buildDraftRfc822(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): string {
  const boundary = `sanative_${randomBytes(8).toString("hex")}`;
  const headers = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${encodeHeader(options.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `X-Sanative-Draft: organ-quiz`,
  ];
  if (options.replyTo) headers.push(`Reply-To: ${options.replyTo}`);

  const textPart = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(options.text, "utf8").toString("base64"),
  ].join("\r\n");

  const htmlPart = [
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(options.html, "utf8").toString("base64"),
  ].join("\r\n");

  return `${headers.join("\r\n")}\r\n\r\n${textPart}\r\n${htmlPart}\r\n--${boundary}--\r\n`;
}

export function quoteImapString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Prefer the mailbox that advertises \\Drafts; otherwise common Gmail names. */
export function pickDraftsMailbox(listResponse: string): string {
  const lines = listResponse.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\* LIST \((.*)\) (?:NIL|"[^"]*") (.+)\s*$/i);
    if (!match) continue;
    const attrs = match[1];
    if (!/(?:^|\s)\\Drafts(?:\s|$)/i.test(attrs)) continue;
    return unquoteImapMailbox(match[2].trim());
  }
  return "[Gmail]/Drafts";
}

function unquoteImapMailbox(token: string): string {
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return token;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function resolveDraftIdentity(options: CreateEmailDraftOptions) {
  const identity = await resolveEmailIdentity(options.process);
  if (!identity.enabled) {
    return { ok: false as const, error: "Email process is disabled" };
  }
  const requestedFrom =
    options.from || formatFromHeader(identity.fromName, identity.fromEmail);
  const mailboxUser = gmailImpersonateUser() || process.env.GOOGLE_SMTP_USER;
  const from = alignFromWithGoogleSmtpUser(requestedFrom, mailboxUser);
  const text = options.text?.trim() || htmlToPlainText(options.html);
  const replyTo = options.replyTo || identity.replyTo;
  return { ok: true as const, from, text, replyTo };
}

export async function createEmailDraft(
  options: CreateEmailDraftOptions
): Promise<CreateEmailDraftResult> {
  const identity = await resolveDraftIdentity(options);
  if (!identity.ok) {
    return { success: false, error: identity.error };
  }

  const rfc822 = buildDraftRfc822({
    from: identity.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: identity.text,
    replyTo: identity.replyTo,
  });

  if (imapDraftConfigured()) {
    const imapResult = await createImapDraft(rfc822);
    if (imapResult.success) return imapResult;
    console.warn("[Email draft] IMAP failed, trying next method", imapResult.error);
    if (gmailApiDraftConfigured()) {
      const apiResult = await createGmailApiDraft(rfc822);
      if (apiResult.success) return apiResult;
      console.warn("[Email draft] Gmail API failed", apiResult.error);
    }
    return imapResult;
  }

  if (gmailApiDraftConfigured()) {
    const apiResult = await createGmailApiDraft(rfc822);
    if (apiResult.success) return apiResult;
    console.warn("[Email draft] Gmail API failed", apiResult.error);
    return apiResult;
  }

  if (!isProductionRuntime()) {
    console.log(`[Email draft] Would save draft to ${options.to}: ${options.subject}`);
    return { success: true, method: "mock", draftId: "dev-mode-no-draft" };
  }

  return { success: false, error: "No mailbox draft transport is configured" };
}

async function createGmailApiDraft(rfc822: string): Promise<CreateEmailDraftResult> {
  const encoded = gmailServiceAccountJson();
  const user = gmailImpersonateUser();
  if (!encoded || !user) {
    return { success: false, error: "Gmail API draft credentials are not configured" };
  }

  try {
    const credentials = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as {
      client_email?: string;
      private_key?: string;
    };
    if (!credentials.client_email || !credentials.private_key) {
      return { success: false, error: "Gmail service account JSON is missing client_email or private_key" };
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/gmail.compose"],
      subject: user,
    });
    const gmail = google.gmail({ version: "v1", auth });
    const created = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: { raw: toBase64Url(rfc822) },
      },
    });
    const draftId = created.data.id || undefined;
    console.log(`[Email draft] Saved via Gmail API for ${user} (${draftId ?? "no-id"})`);
    return { success: true, method: "gmail_api", draftId, mailbox: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gmail API draft failed",
    };
  }
}

async function createImapDraft(rfc822: string): Promise<CreateEmailDraftResult> {
  const user = process.env.GOOGLE_SMTP_USER || "";
  const pass = process.env.GOOGLE_SMTP_PASS || "";
  const host = process.env.GOOGLE_IMAP_HOST || "imap.gmail.com";
  const port = Number(process.env.GOOGLE_IMAP_PORT || 993);
  const raw = Buffer.from(rfc822, "utf8");

  let socket: tls.TLSSocket | null = null;
  try {
    socket = await connectImap(host, port);
    const session = attachImapReader(socket);
    await session.readUntil((text) => /^\* OK/im.test(text));

    const login = await session.command(`LOGIN ${quoteImapString(user)} ${quoteImapString(pass)}`);
    if (!taggedOk(login, session.lastTag)) {
      return { success: false, error: "IMAP login failed" };
    }

    const listed = await session.command('LIST "" "*"');
    if (!taggedOk(listed, session.lastTag)) {
      return { success: false, error: "IMAP LIST failed" };
    }
    const mailbox = pickDraftsMailbox(listed);

    const appendTag = session.nextTag();
    socket.write(`${appendTag} APPEND ${quoteImapString(mailbox)} (\\Draft) {${raw.length}}\r\n`);
    const ready = await session.readUntil(
      (text) => text.includes("+") || text.includes(`${appendTag} `)
    );
    if (!ready.includes("+")) {
      return { success: false, error: `IMAP APPEND rejected: ${ready.trim()}` };
    }
    socket.write(raw);
    const appended = await session.readUntil((text) => text.includes(`${appendTag} `));
    if (!taggedOk(appended, appendTag)) {
      return { success: false, error: `IMAP APPEND failed: ${appended.trim()}` };
    }

    await session.command("LOGOUT").catch(() => undefined);
    console.log(`[Email draft] Saved via IMAP to ${mailbox} as ${user}`);
    return { success: true, method: "imap", mailbox, draftId: mailbox };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "IMAP draft failed",
    };
  } finally {
    socket?.destroy();
  }
}

function taggedOk(response: string, tag: string): boolean {
  return new RegExp(`^${tag} OK\\b`, "im").test(response);
}

function connectImap(host: string, port: number): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port, servername: host, timeout: IMAP_TIMEOUT_MS },
      () => resolve(socket)
    );
    socket.once("error", reject);
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("IMAP connection timeout"));
    });
  });
}

function attachImapReader(socket: tls.TLSSocket) {
  let buffer = "";
  let seq = 0;
  let lastTag = "A0";
  const waiters: Array<() => void> = [];

  socket.setEncoding("utf8");
  socket.on("data", (chunk: string) => {
    buffer += chunk;
    const pending = waiters.splice(0);
    for (const wake of pending) wake();
  });

  async function readUntil(predicate: (text: string) => boolean): Promise<string> {
    const started = Date.now();
    while (!predicate(buffer)) {
      if (Date.now() - started > IMAP_TIMEOUT_MS) {
        throw new Error("IMAP timeout");
      }
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("IMAP timeout")), IMAP_TIMEOUT_MS);
        waiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    const text = buffer;
    buffer = "";
    return text;
  }

  function nextTag() {
    seq += 1;
    lastTag = `A${seq}`;
    return lastTag;
  }

  async function command(line: string): Promise<string> {
    const tag = nextTag();
    socket.write(`${tag} ${line}\r\n`);
    return readUntil((text) => text.includes(`${tag} `));
  }

  return { readUntil, command, nextTag, get lastTag() { return lastTag; } };
}

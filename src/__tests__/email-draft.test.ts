import { describe, expect, it } from "vitest";
import { buildDraftRfc822, pickDraftsMailbox, quoteImapString } from "@/lib/email-draft";

describe("email draft helpers", () => {
  it("builds a visitor-facing RFC822 draft with To/Subject/body", () => {
    const raw = buildDraftRfc822({
      from: "Sanative <info@sanative.com.au>",
      to: "alex@example.com",
      subject: "Alex, your Sanative liver check",
      html: "<p>Hi Alex,</p><p>A few things are worth checking.</p>",
      text: "Hi Alex,\n\nA few things are worth checking.",
    });

    expect(raw).toContain("From: Sanative <info@sanative.com.au>");
    expect(raw).toContain("To: alex@example.com");
    expect(raw).toContain("Subject: Alex, your Sanative liver check");
    expect(raw).toContain("X-Sanative-Draft: organ-quiz");
    expect(raw).toContain("Content-Type: multipart/alternative");
    expect(raw).toContain(Buffer.from("Hi Alex,\n\nA few things are worth checking.", "utf8").toString("base64"));
  });

  it("picks the Gmail Drafts mailbox from LIST output", () => {
    const listed = [
      '* LIST (\\HasNoChildren) "/" "INBOX"',
      '* LIST (\\HasNoChildren \\Drafts) "/" "[Gmail]/Drafts"',
      '* LIST (\\HasNoChildren \\Sent) "/" "[Gmail]/Sent Mail"',
      "A2 OK Success",
    ].join("\r\n");

    expect(pickDraftsMailbox(listed)).toBe("[Gmail]/Drafts");
  });

  it("falls back to [Gmail]/Drafts when LIST has no Drafts flag", () => {
    expect(pickDraftsMailbox('* LIST (\\HasNoChildren) "/" "INBOX"\r\nA2 OK')).toBe("[Gmail]/Drafts");
  });

  it("quotes IMAP strings used for login and mailbox names", () => {
    expect(quoteImapString("info@sanative.com.au")).toBe('"info@sanative.com.au"');
    expect(quoteImapString("[Gmail]/Drafts")).toBe('"[Gmail]/Drafts"');
    expect(quoteImapString('say "hi"')).toBe('"say \\"hi\\""');
  });
});

/** Match bell / push notifications to an open care-support thread or live chat. */

export function notificationMatchesThread(
  actionUrl: string | null | undefined,
  threadId: string
): boolean {
  if (!actionUrl || !threadId) return false;
  try {
    const url = new URL(actionUrl, "https://sanative.local");
    return url.searchParams.get("thread") === threadId;
  } catch {
    return actionUrl.includes(`thread=${threadId}`);
  }
}

export function notificationMatchesLiveChat(
  actionUrl: string | null | undefined
): boolean {
  if (!actionUrl) return false;
  try {
    const url = new URL(actionUrl, "https://sanative.local");
    return url.searchParams.get("chat") === "1";
  } catch {
    return actionUrl.includes("chat=1");
  }
}

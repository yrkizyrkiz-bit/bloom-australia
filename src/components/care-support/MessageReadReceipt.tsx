import { cn } from "@/lib/utils";

type Props = {
  /** True when the other party has seen this message */
  read: boolean;
  /** Align under outgoing bubbles */
  align?: "start" | "end";
  className?: string;
  /** Light text on dark (member green) bubbles */
  onDark?: boolean;
};

/** Compact read/unread label for the sender under their own message. */
export function MessageReadReceipt({
  read,
  align = "end",
  className,
  onDark = false,
}: Props) {
  return (
    <p
      className={cn(
        "mt-1 text-[10px]",
        align === "end" ? "text-right" : "text-left",
        onDark
          ? read
            ? "text-white/80"
            : "text-white/55"
          : read
            ? "text-emerald-700"
            : "text-muted-foreground",
        className
      )}
    >
      {read ? "Read" : "Unread"}
    </p>
  );
}

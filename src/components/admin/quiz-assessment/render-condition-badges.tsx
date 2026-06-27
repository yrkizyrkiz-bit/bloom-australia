import { Badge } from "@/components/ui/badge";

export function renderConditionBadges(
  conditions: string[] | undefined,
  colorClass: string
) {
  if (!conditions || conditions.length === 0) {
    return <span className="text-sm text-muted-foreground">None reported</span>;
  }
  const filtered = conditions.filter((c) => c && !c.toLowerCase().includes("none"));
  if (filtered.length === 0) {
    return <span className="text-sm text-muted-foreground">None reported</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {filtered.map((condition, i) => (
        <Badge key={i} variant="secondary" className={colorClass}>
          {condition}
        </Badge>
      ))}
    </div>
  );
}

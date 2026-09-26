import { Badge } from "@/components/ui/badge";
import {
  enrolledProgramBadgeClass,
  type EnrolledProgram,
} from "@/lib/triage/enrolled-programs";

export function EnrolledProgramBadges({
  programs,
  empty,
}: {
  programs?: EnrolledProgram[];
  empty?: string;
}) {
  if (!programs?.length) {
    if (!empty) return null;
    return <span className="text-muted-foreground text-sm">{empty}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {programs.map((program) => (
        <Badge
          key={program.key}
          variant="outline"
          className={`text-xs font-medium ${enrolledProgramBadgeClass(program.key)}`}
        >
          {program.label}
        </Badge>
      ))}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  status: "uploaded" | "verified" | "tokenized" | "funded" | "repaid" | "paid";
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge
      className={cn(
        "text-xs font-medium capitalize border-0 shadow-sm",
        status === "uploaded" && "bg-muted text-muted-foreground",
        status === "verified" && "bg-blue-500/20 text-blue-500",
        status === "tokenized" && "bg-stellar-purple/20 text-stellar-purple",
        status === "funded" && "bg-stellar-pink/20 text-stellar-pink",
        status === "repaid" && "bg-amber-500/20 text-amber-500",
        status === "paid" && "bg-stellar-teal/20 text-stellar-teal"
      )}
    >
      {status}
    </Badge>
  );
}

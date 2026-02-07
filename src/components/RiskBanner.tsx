import { AlertTriangle } from "lucide-react";

export function RiskBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center relative z-50">
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-500">
        <AlertTriangle className="h-3 w-3" />
        <span>TESTNET ONLY – No real value at risk. Do not send real funds.</span>
      </div>
    </div>
  );
}

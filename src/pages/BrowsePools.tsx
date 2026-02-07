import { useState, useEffect } from "react";
import { mockInvoices, formatINR, formatUSDC } from "@/lib/mock-data";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, TrendingUp, CheckCircle2, Rocket, Shield, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { deployLendingPool, investInPool, getPoolYield, CURRENT_POOL_CONTRACT_ID } from "@/lib/soroban";

export default function BrowsePools() {
  const { userRole } = useAuth();
  const { isConnected, publicKey } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const allPools = mockInvoices.filter((i) => i.status === "tokenized" || i.status === "funded");
  const pools = allPools.filter(pool => {
    const matchesSearch = pool.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pool.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || pool.risk_score === riskFilter;
    return matchesSearch && matchesRisk;
  });
  
  const [poolYields, setPoolYields] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchYields = async () => {
      const yields: Record<string, number> = {};
      for (const pool of pools) {
        // In a real app, each pool would have its own contract ID
        // Here we use the shared ID + risk score fallback
        const numericRisk = pool.risk_score === "low" ? 10 : pool.risk_score === "medium" ? 40 : 70;
        yields[pool.id] = await getPoolYield(CURRENT_POOL_CONTRACT_ID, numericRisk);
      }
      setPoolYields(yields);
    };
    fetchYields();
    // Refresh every 30s to simulate "Live" data
    const interval = setInterval(fetchYields, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const [investDialog, setInvestDialog] = useState<typeof pools[0] | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [tranche, setTranche] = useState<"Senior" | "Junior">("Senior");
  const [investing, setInvesting] = useState(false);
  const [deploying, setDeploying] = useState<string | null>(null);

  const handleInvest = async () => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your Stellar wallet first");
      return;
    }
    
    setInvesting(true);
    try {
      const result = await investInPool(publicKey, Number(investAmount), tranche);
      if (result.success) {
        toast.success(`Investment submitted via Soroban!`, {
          description: `Tx Hash: ${result.hash.substring(0, 10)}...`
        });
        setInvestDialog(null);
        setInvestAmount("");
      }
    } catch (error) {
      console.error(error);
      toast.error("Investment failed");
    } finally {
      setInvesting(false);
    }
  };

  const handleCreatePool = async (poolId: string) => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your Stellar wallet first");
      return;
    }

    setDeploying(poolId);
    const toastId = toast.loading("Deploying Soroban Contract...");
    
    try {
      const contractId = await deployLendingPool(publicKey);
      toast.success("Pool Contract Deployed!", { 
        id: toastId,
        description: `Contract ID: ${contractId.substring(0, 8)}...`
      });
      // In a real app, we'd update the pool status in DB here
    } catch (error) {
      console.error(error);
      toast.error("Deployment failed", { id: toastId });
    } finally {
      setDeploying(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text w-fit">Lending Pools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse tokenized invoices and invest via Stellar smart contracts.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search pools..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pools.map((pool) => (
          <div key={pool.id} className="glass-card rounded-xl p-6 space-y-4 hover-glow transition-all duration-300 group border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground group-hover:text-primary transition-colors">{pool.id}</p>
                <h3 className="font-display font-semibold text-lg mt-1 text-foreground">{pool.buyer_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{pool.description}</p>
              </div>
              <StatusBadge status={pool.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <p className="text-muted-foreground text-xs">Value</p>
                <p className="font-bold">{formatINR(pool.amount_inr)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Token Value</p>
                <p className="font-bold text-emerald-600">{formatUSDC(pool.token_value!)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">APR</p>
                <div className="flex items-center gap-1">
                   <p className="font-bold text-primary">{poolYields[pool.id] || pool.interest_rate}%</p>
                   {poolYields[pool.id] && <span className="text-[10px] bg-green-500/10 text-green-500 px-1 rounded animate-pulse">LIVE</span>}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Risk</p>
                <RiskBadge risk={pool.risk_score} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Due: {pool.due_date}</span>
              <div className="flex gap-2">
                {userRole === "business" && pool.status === "tokenized" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-primary text-primary hover:bg-primary/10"
                    onClick={() => handleCreatePool(pool.id)}
                    disabled={!!deploying}
                  >
                    {deploying === pool.id ? (
                      <Rocket className="mr-1 h-3 w-3 animate-pulse" />
                    ) : (
                      <Rocket className="mr-1 h-3 w-3" />
                    )}
                    {deploying === pool.id ? "Deploying..." : "Create Pool"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={pool.status === "funded" ? "secondary" : "default"}
                    className={pool.status === "funded" ? "" : "shadow-sm"}
                    onClick={() => setInvestDialog(pool)}
                    disabled={pool.status === "funded"}
                  >
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {pool.status === "funded" ? "Fully Funded" : "Invest"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-display text-lg">No pools available yet</p>
          <p className="text-sm mt-1">Tokenized invoices will appear here.</p>
        </div>
      )}

      {/* Invest Dialog */}
      <Dialog open={!!investDialog} onOpenChange={() => setInvestDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Invest in Pool</DialogTitle>
            <DialogDescription>
              Invest in {investDialog?.buyer_name} via Soroban smart contract.
            </DialogDescription>
          </DialogHeader>
          {investDialog && (
            <div className="space-y-4 mt-2">
              <div className="glass-card rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pool</span><span className="font-medium">{investDialog.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Base APR</span><span className="text-primary font-medium">{poolYields[investDialog.id] || investDialog.interest_rate}%</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Risk</span><RiskBadge risk={investDialog.risk_score} /></div>
              </div>

              <div className="space-y-2">
                <Label>Select Tranche</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${tranche === "Senior" ? "bg-blue-500/10 border-blue-500" : "border-border hover:border-primary/50"}`}
                    onClick={() => setTranche("Senior")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Senior</span>
                    </div>
                    <p className="text-xs text-muted-foreground">First priority.</p>
                    <p className="text-sm font-bold text-blue-500 mt-1">
                      {((poolYields[investDialog.id] || investDialog.interest_rate) - 2).toFixed(2)}% APY
                    </p>
                  </div>
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${tranche === "Junior" ? "bg-amber-500/10 border-amber-500" : "border-border hover:border-amber-500/50"}`}
                    onClick={() => setTranche("Junior")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">Junior</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Higher yield.</p>
                    <p className="text-sm font-bold text-amber-500 mt-1">
                      {((poolYields[investDialog.id] || investDialog.interest_rate) + 4).toFixed(2)}% APY
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Investment Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatINR(Number(investAmount || 0) * 83.5)} equivalent
                </p>
              </div>

              <Button
                className="w-full gradient-stellar text-primary-foreground"
                onClick={handleInvest}
                disabled={!investAmount || investing}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {investing ? "Processing on Soroban..." : `Confirm ${tranche} Investment`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

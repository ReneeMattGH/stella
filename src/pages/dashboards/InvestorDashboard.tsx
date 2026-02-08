import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, DollarSign, TrendingUp, PieChart } from "lucide-react";
import { toast } from "sonner";
import { NFTGallery } from "@/components/NFTGallery";
import { useInvestments } from "@/hooks/useRealtimeData";
import { Invoice } from "@/types/app-types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YieldChart } from "@/components/YieldChart";
import { InvestmentHeatmap } from "@/components/InvestmentHeatmap";
import { SectorDistribution } from "@/components/SectorDistribution";
import { withdraw, CURRENT_POOL_CONTRACT_ID } from "@/lib/soroban";

export function InvestorDashboard() {
  const { isConnected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const { investments, loading } = useInvestments();

  const totalInvested = investments.reduce((acc, inv) => acc + (inv.amount_usdc || 0), 0);
  const totalEarned = investments.reduce((acc, inv) => acc + (inv.yield_earned || 0), 0);

  // Calculate Weighted APY
  const weightedApy = totalInvested > 0 
    ? investments.reduce((acc, inv) => acc + (inv.amount_usdc || 0) * (inv.apy || 0), 0) / totalInvested 
    : 0;

  // Generate projection data for chart
  const generateChartData = () => {
    // If we have investments, use their real APY to project
    // Otherwise fallback to simulated
    const baseApy = weightedApy > 0 ? weightedApy : 12.5;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    let currentBalance = totalInvested > 0 ? totalInvested : 10000; // Show hypothetical 10k if empty
    const monthlyRate = baseApy / 100 / 12;
    
    return months.map(month => {
      // Add some realistic fluctuation based on "market conditions"
      const fluctuation = (Math.random() * 0.4) - 0.2; 
      const effectiveRate = monthlyRate + (fluctuation / 100);
      const interest = currentBalance * effectiveRate;
      currentBalance += interest;
      
      return {
        month,
        yield: Number((baseApy + fluctuation).toFixed(2)),
        balance: Math.round(currentBalance)
      };
    });
  };

  const chartData = generateChartData();

  const handleWithdraw = async (id: string) => {
    if (!isConnected || !publicKey) {
      toast.error("Connect wallet to withdraw");
      return;
    }
    
    const investment = investments.find(inv => inv.id === id);
    if (!investment) {
      toast.error("Investment not found");
      return;
    }

    try {
      // Use the specific pool contract ID if available, otherwise fallback
      const contractId = investment.invoices?.contract_id || CURRENT_POOL_CONTRACT_ID;
      const result = await withdraw(contractId, publicKey);
      if (result) {
        toast.success("Withdrawal Successful!", {
          description: "Funds have been sent to your Stellar wallet."
        });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Withdrawal failed");
    }
  };

  // Transform investments to NFT assets for display
  // We map the investment data to the Invoice interface to reuse the NFTGallery component
  const nftAssets: Invoice[] = investments.map(inv => {
    const invoice = inv.invoices;
    // Estimate INR value for display purposes (assuming 1 USDC = 83.5 INR)
    const estimatedInr = (inv.amount_usdc || 0) * 83.5;
    
    return {
      id: inv.id, // Use investment ID for the key
      invoice_number: invoice?.invoice_number || "Unknown",
      buyer_name: invoice?.buyer_name || "Unknown Asset",
      description: invoice?.description || `Investment in pool`,
      amount_inr: estimatedInr, 
      due_date: invoice?.due_date || new Date().toISOString(),
      status: "funded", // Investments are effectively "funded" shares
      risk_score: invoice?.risk_score || "low",
      interest_rate: inv.apy || invoice?.interest_rate || 0,
      token_value: inv.amount_usdc,
      created_at: inv.created_at || new Date().toISOString(),
      stellar_tx_hash: inv.stellar_tx_hash || invoice?.stellar_tx_hash,
      // Required fields from Invoice type that might be null
      user_id: invoice?.user_id || "",
      updated_at: invoice?.updated_at || "",
      file_url: invoice?.file_url || null,
      ocr_extracted: invoice?.ocr_extracted || null,
      ocr_status: invoice?.ocr_status || null,
      file_hash: invoice?.file_hash || null,
      justification: invoice?.justification || null
    } as Invoice;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Investor Dashboard</h1>
          <p className="text-muted-foreground">Track your portfolio and discover new yields.</p>
        </div>
        <Button asChild size="lg" className="gap-2 shadow-lg">
          <Link to="/pools">
            <Layers className="h-4 w-4" />
            Browse All Pools
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments">My Investments</TabsTrigger>
          <TabsTrigger value="nfts">My NFT Assets</TabsTrigger>
          <TabsTrigger value="yields">Yield Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Total Invested"
              value={`$${totalInvested.toLocaleString()}`}
              icon={<DollarSign className="h-5 w-5" />}
              subtitle="Active capital"
            />
            <StatsCard
              title="Total Earnings"
              value={`$${totalEarned.toLocaleString()}`}
              icon={<TrendingUp className="h-5 w-5" />}
              subtitle="Interest accrued"
            />
            <StatsCard
              title="Weighted APY"
              value={`${weightedApy.toFixed(2)}%`}
              icon={<PieChart className="h-5 w-5" />}
              subtitle="Across all pools"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Yield Performance</CardTitle>
                  <CardDescription>
                    {totalInvested > 0 
                      ? `Projected growth based on your ${weightedApy.toFixed(2)}% APY portfolio` 
                      : "Hypothetical projection for a $10k investment"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <YieldChart data={chartData} />
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <InvestmentHeatmap />
                 <SectorDistribution />
              </div>
            </div>

            <Card className="lg:col-span-3 h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                   {investments.slice(0, 8).map((inv) => (
                     <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                       <div>
                         <p className="font-medium text-sm">Investment in {inv.invoices?.invoice_number || "Pool"}</p>
                         <p className="text-xs text-muted-foreground">{new Date(inv.created_at || Date.now()).toLocaleDateString()}</p>
                       </div>
                       <div className="text-right">
                         <p className="font-medium text-sm">+${(inv.amount_usdc || 0).toLocaleString()}</p>
                         <p className="text-xs text-green-500">{inv.status || "Active"}</p>
                       </div>
                     </div>
                   ))}
                   {investments.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                       <p>No recent activity</p>
                       <p className="text-xs mt-1">Invest in pools to see transactions here</p>
                     </div>
                   )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments">
          <Card>
            <CardHeader>
              <CardTitle>My Investments</CardTitle>
              <CardDescription>Manage your active positions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investment ID</TableHead>
                    <TableHead>Pool ID</TableHead>
                    <TableHead>Amount (USDC)</TableHead>
                    <TableHead>APY</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.id.substring(0, 8)}...</TableCell>
                      <TableCell>{inv.invoices?.invoice_number || "Unknown"}</TableCell>
                      <TableCell>${(inv.amount_usdc || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-green-500 font-medium">{inv.apy || 0}%</TableCell>
                      <TableCell>${(inv.yield_earned || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleWithdraw(inv.id)}>
                          Withdraw
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {investments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No active investments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfts">
           <NFTGallery items={nftAssets} title="My Portfolio NFTs" />
        </TabsContent>

        <TabsContent value="yields">
          <Card>
             <CardHeader>
               <CardTitle>Historical Yields</CardTitle>
             </CardHeader>
             <CardContent>
               <YieldChart />
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

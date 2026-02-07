import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useStellarAccount, useStellarTransactions, useXLMToINR } from "@/hooks/useStellarData";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { mockInvoices, formatINR, Invoice } from "@/lib/mock-data";
import { useState } from "react";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
  Wallet,
  Loader2,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FAB } from "@/components/FAB";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { tokenizeInvoice } from "@/lib/stellar-issuance";
import { repayPool } from "@/lib/soroban";

import { checkOverdueInvoices, OverdueInvoice } from "@/lib/early-warning";
import { TradeDialog } from "@/components/TradeDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { useEffect } from "react";

import { YieldChart } from "@/components/YieldChart";

export default function Dashboard() {
  const { userRole, user } = useAuth();
  const { isConnected, publicKey } = useWallet();
  const { data: account, isLoading: isLoadingAccount } = useStellarAccount(publicKey);
  const { data: transactions, isLoading: isLoadingTx } = useStellarTransactions(publicKey);
  const { convert } = useXLMToINR();
  
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);

  useEffect(() => {
    checkOverdueInvoices(invoices).then(setOverdueInvoices);
  }, [invoices]);

  const isBusiness = userRole === "business";

  const handleWithdrawUPI = () => {
    if (!isConnected) return toast.error("Connect wallet first");
    toast.success("Withdrawal initiated via UPI", {
      description: "Funds will be settled to your linked bank account within 24 hours.",
    });
  };

  // ... (handlers)

  const renderActions = (invoice: Invoice) => {
    if (invoice.status === "tokenized" && isBusiness) {
      return (
        <div className="flex gap-2">
           <TradeDialog 
             assetCode={`INV${invoice.invoice_number?.slice(-4) || '0000'}`} 
             assetIssuer={publicKey || ""}
           />
           <Button variant="ghost" size="sm" onClick={() => window.open(`https://stellar.expert/explorer/testnet/asset/INV${invoice.invoice_number?.slice(-4)}-${publicKey}`, '_blank')}>
             <Info className="h-4 w-4" />
           </Button>
        </div>
      );
    }
    return null;
  };

  const handleTokenize = async (invoice: Invoice) => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your Stellar wallet first");
      return;
    }

    const toastId = toast.loading("Tokenizing invoice on Stellar Testnet...");
    try {
      const result = await tokenizeInvoice(
        publicKey,
        invoice.id,
        invoice.amount_inr, 
        invoice.invoice_number || invoice.id.replace("INV-", "")
      );

      if (result.success) {
        setInvoices(prev => prev.map(inv => 
          inv.id === invoice.id ? { ...inv, status: "tokenized", stellar_tx_hash: result.hash } : inv
        ));

        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'tokenized',
            stellar_tx_hash: result.hash,
          })
          .eq('id', invoice.id);

        if (error) console.error("Supabase update failed:", error);

        toast.success(`Tokenized! Asset: ${result.assetCode}`, {
          id: toastId,
          description: "View on Stellar Expert",
          action: {
            label: "View",
            onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.hash}`, '_blank')
          }
        });
      }
    } catch (error) {
      toast.error("Tokenization failed", { id: toastId });
      console.error(error);
    }
  };

  const handleRepay = async (invoice: Invoice) => {
    if (!isConnected || !publicKey) {
      toast.error("Please connect your Stellar wallet first");
      return;
    }

    const toastId = toast.loading("Processing repayment via Soroban...");
    try {
      const result = await repayPool(publicKey, invoice.amount_inr);
      
      if (result?.success) {
        setInvoices(prev => prev.map(inv => 
          inv.id === invoice.id ? { ...inv, status: "repaid" } : inv
        ));

        await supabase
          .from('invoices')
          .update({ status: 'repaid' })
          .eq('id', invoice.id);

        toast.success("Repayment successful!", { 
          id: toastId,
          description: `Funds released. Tx: ${result.hash.substring(0,8)}...` 
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Repayment failed", { id: toastId });
    }
  };

  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((s, i) => s + i.amount_inr, 0);
  const funded = invoices.filter((i) => ["funded", "paid"].includes(i.status));
  const tokenized = invoices.filter((i) => i.status === "tokenized");

  const nativeBalance = account?.balances.find((b: { asset_type: string; balance: string }) => b.asset_type === 'native')?.balance || "0";
  const balanceInr = convert(nativeBalance);

  return (
    <div className="space-y-6 max-w-7xl animate-slide-up pb-20">
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text w-fit">
          {isBusiness ? "Business Dashboard" : "Investor Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.email}
        </p>
      </div>

      {overdueInvoices.length > 0 && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            You have {overdueInvoices.length} overdue invoice(s). Please review them immediately.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 glass-card border-primary/20 bg-primary/5 hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Stellar Wallet (Testnet)</CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingAccount ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{parseFloat(nativeBalance).toFixed(2)} XLM</div>
                  <p className="text-sm text-muted-foreground mt-1">≈ {formatINR(balanceInr)}</p>
                  <Button variant="outline" size="sm" className="w-full mt-4 text-xs border-primary/50" onClick={handleWithdrawUPI}>
                    Withdraw to UPI
                  </Button>
                  {!account && <p className="text-xs text-amber-500 mt-2">Account not funded on Testnet</p>}
                </>
              )}
            </CardContent>
          </Card>

          {/* Yield Chart for Investors, or Activity for Business */}
          {!isBusiness ? (
            <YieldChart />
          ) : (
            <Card className="md:col-span-2 glass-card hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingTx ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">{tx.hash.substring(0, 12)}...</span>
                        <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className={`font-medium ${tx.successful ? 'text-emerald-500' : 'text-destructive'}`}>
                        {tx.successful ? 'Success' : 'Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No recent transactions found</p>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={isBusiness ? "Total Invoices" : "Available Pools"}
          value={String(totalInvoices)}
          icon={<FileText className="h-6 w-6" />}
        />
        <StatsCard
          title={isBusiness ? "Total Value" : "Pool Value"}
          value={formatINR(totalValue)}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Funded"
          value={String(funded.length)}
          subtitle={formatINR(funded.reduce((s, i) => s + i.amount_inr, 0))}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Awaiting"
          value={String(tokenized.length)}
          subtitle="Ready for investment"
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Invoice/Pool List */}
      <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
          <h2 className="font-display font-semibold text-lg">
            {isBusiness ? "My Invoices" : "Top Pools"}
          </h2>
          <Link to={isBusiness ? "/upload" : "/pools"}>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              {isBusiness ? "Upload New" : "View All"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Buyer</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-center p-4 font-medium">Risk</th>
                <th className="text-center p-4 font-medium">Rate</th>
                <th className="text-center p-4 font-medium">Status</th>
                {isBusiness && <th className="text-center p-4 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border hover:bg-muted/20 transition-colors group">
                  <td className="p-4 font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">{inv.id}</td>
                  <td className="p-4 font-medium">{inv.buyer_name}</td>
                  <td className="p-4 text-right font-bold text-foreground">{formatINR(inv.amount_inr)}</td>
                  <td className="p-4 text-center"><RiskBadge risk={inv.risk_score} /></td>
                  <td className="p-4 text-center text-primary font-bold">{inv.interest_rate}%</td>
                  <td className="p-4 text-center"><StatusBadge status={inv.status} /></td>
                  {isBusiness && (
                    <td className="p-4 text-center">
                      {inv.status === "uploaded" || inv.status === "verified" ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleTokenize(inv)}
                        >
                          Tokenize
                        </Button>
                      ) : inv.status === "funded" ? (
                        <Button 
                          size="sm" 
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
                          onClick={() => handleRepay(inv)}
                        >
                          Repay
                        </Button>
                      ) : inv.stellar_tx_hash ? (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-xs text-emerald-600 hover:text-emerald-700"
                          onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${inv.stellar_tx_hash}`, '_blank')}
                        >
                          View Chain
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isBusiness && <FAB />}
    </div>
  );
}

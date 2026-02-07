import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RiskBadge } from "@/components/RiskBadge";
import { formatINR } from "@/lib/mock-data";
import { calculateRealRiskScore } from "@/lib/risk-scoring";
import { useWallet } from "@/hooks/useWallet";
import { Upload, FileText, Zap, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function UploadInvoice() {
  const { publicKey } = useWallet();
  const [step, setStep] = useState<"upload" | "tokenize" | "done">("upload");
  const [form, setForm] = useState({
    buyerName: "",
    description: "",
    amountInr: "",
    dueDate: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [rate, setRate] = useState(10);
  const [riskReason, setRiskReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (Number(form.amountInr) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (form.dueDate < today) {
      toast.error("Due date cannot be in the past");
      return;
    }

    setLoading(true);
    try {
      const { score, recommendedRate, reason } = await calculateRealRiskScore(
        Number(form.amountInr), 
        form.dueDate,
        publicKey || undefined
      );
      
      setRisk(score);
      setRate(recommendedRate);
      setRiskReason(reason);
      setStep("tokenize");
      toast.success("Invoice analyzed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error analyzing invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenize = () => {
    setLoading(true);
    // Simulate Soroban smart contract call
    setTimeout(() => {
      setLoading(false);
      setStep("done");
      toast.success("Invoice tokenized on Soroban! 🚀");
    }, 2000);
  };

  const mockHash = "SOROBAN_TX_" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const tokenValue = Math.round(Number(form.amountInr) / 83.5);

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-bold">Invoice Tokenized!</h2>
        <div className="glass-card rounded-xl p-5 text-left space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Buyer</span><span className="font-medium">{form.buyerName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatINR(Number(form.amountInr))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Token Value</span><span className="font-medium text-primary">{tokenValue} USDC</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Interest Rate</span><span className="font-medium text-primary">{rate}%</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Risk</span><RiskBadge risk={risk} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Soroban TX</span><span className="font-mono text-xs text-accent">{mockHash}</span></div>
        </div>
        <Button onClick={() => { setStep("upload"); setForm({ buyerName: "", description: "", amountInr: "", dueDate: "" }); setFile(null); }} variant="outline">
          Upload Another Invoice
        </Button>
      </div>
    );
  }

  if (step === "tokenize") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h2 className="font-display text-2xl font-bold">Tokenize Invoice</h2>
        <p className="text-muted-foreground text-sm">Review the risk assessment and tokenize this invoice on Soroban.</p>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice Amount</span>
            <span className="font-medium">{formatINR(Number(form.amountInr))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Token Value</span>
            <span className="font-medium text-primary">{tokenValue} USDC</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Risk Score
              {riskReason && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">{riskReason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
            <RiskBadge risk={risk} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dynamic Interest Rate</span>
            <span className="font-medium text-primary">{rate}% APR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date</span>
            <span>{form.dueDate}</span>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">⚡ Soroban Smart Contract</p>
          <p>This will deploy a Soroban token contract representing fractional ownership of this invoice on the Stellar network.</p>
        </div>

        <Button
          className="w-full"
          onClick={handleTokenize}
          disabled={loading}
        >
          <Zap className="mr-2 h-4 w-4" />
          {loading ? "Deploying to Soroban..." : "Tokenize on Stellar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Upload Invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your invoice to tokenize it on the Stellar blockchain via Soroban.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <Label>Buyer Name</Label>
          <Input
            placeholder="e.g. Tata Consultancy Services"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="Brief description of the invoice"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Amount (₹ INR)</Label>
            <Input
              type="number"
              placeholder="500000"
              value={form.amountInr}
              onChange={(e) => setForm({ ...form, amountInr: e.target.value })}
              required
              min={1}
            />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label>Invoice File (PDF/Image)</Label>
          <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              id="invoice-file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <label htmlFor="invoice-file" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload PDF or image</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          <Upload className="mr-2 h-4 w-4" />
          {loading ? "Analyzing Risk..." : "Upload & Analyze"}
        </Button>
      </form>
    </div>
  );
}

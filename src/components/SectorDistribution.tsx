
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Loader2, PieChart as PieChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SectorData {
  name: string;
  value: number; // Volume in INR
  count: number;
  color: string;
}

const COLORS = [
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#14b8a6", // Teal
];

// Heuristic keyword mapping for sectors
const SECTOR_KEYWORDS: Record<string, string[]> = {
  "Technology": ["tech", "soft", "sys", "data", "cyber", "net", "app", "cloud", "ai", "digital"],
  "Retail": ["retail", "store", "shop", "mart", "fashion", "cloth", "super"],
  "Infrastructure": ["infra", "build", "construct", "real", "estate", "road", "power", "energy"],
  "Healthcare": ["health", "med", "pharma", "care", "hosp", "clinic", "bio", "life"],
  "Logistics": ["logic", "trans", "ship", "freight", "cargo", "supply", "chain", "move"],
  "Manufacturing": ["manuf", "indust", "factory", "prod", "maker", "eng"],
  "Finance": ["fin", "bank", "invest", "capital", "fund", "wealth", "insur"],
};

const getSector = (name: string, description?: string | null): string => {
  const text = `${name} ${description || ""}`.toLowerCase();
  
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) {
      return sector;
    }
  }
  return "General";
};

export function SectorDistribution() {
  const [data, setData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: investments, error } = await supabase
          .from("investments")
          .select("amount_usdc, invoices(buyer_name, description)");

        if (error) throw error;

        if (investments) {
          const sectorMap: Record<string, SectorData> = {};
          let total = 0;

          investments.forEach((inv) => {
            const amount = (inv.amount_usdc || 0) * 83.5; // Convert to INR
            // @ts-ignore - Join query type inference limitation
            const invoice = inv.invoices;
            const sectorName = getSector(invoice?.buyer_name || "", invoice?.description);

            if (!sectorMap[sectorName]) {
              sectorMap[sectorName] = {
                name: sectorName,
                value: 0,
                count: 0,
                color: COLORS[Object.keys(sectorMap).length % COLORS.length]
              };
            }

            sectorMap[sectorName].value += amount;
            sectorMap[sectorName].count += 1;
            total += amount;
          });

          const sortedData = Object.values(sectorMap)
            .sort((a, b) => b.value - a.value);

          if (sortedData.length > 0) {
            setData(sortedData);
          } else {
            setDemoData();
          }
        } else {
           setDemoData();
        }
      } catch (error) {
        console.error("Error fetching sector data:", error);
        setDemoData();
      } finally {
        setLoading(false);
      }
    };

    const setDemoData = () => {
      setData([
        { name: "Technology", value: 12500000, count: 15, color: COLORS[0] },
        { name: "Healthcare", value: 8500000, count: 8, color: COLORS[1] },
        { name: "Infrastructure", value: 6200000, count: 5, color: COLORS[2] },
        { name: "Retail", value: 4100000, count: 4, color: COLORS[3] },
      ]);
    };

    fetchData();

    const channel = supabase
      .channel("sector_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investments" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Sector Allocation
            </CardTitle>
            <CardDescription>Capital distribution by industry</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            Real-time
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-md text-xs">
                        <p className="font-bold">{d.name}</p>
                        <p>{formatCurrency(d.value)} ({d.count} deals)</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

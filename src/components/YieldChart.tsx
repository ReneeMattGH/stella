import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: "Jan", yield: 4.2, balance: 1000 },
  { month: "Feb", yield: 4.5, balance: 1200 },
  { month: "Mar", yield: 4.8, balance: 1150 },
  { month: "Apr", yield: 5.1, balance: 1400 },
  { month: "May", yield: 5.4, balance: 1600 },
  { month: "Jun", yield: 5.8, balance: 1900 },
];

export function YieldChart() {
  return (
    <Card className="glass-card hover-glow col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Yield Performance</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <Area type="monotone" dataKey="yield" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorYield)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

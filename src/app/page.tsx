'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';

// Just defining what our API returns so TypeScript doesn't yell at us
interface StockData {
  id: number;
  name: string;
  ticker: string;
  sector: string;
  buyPrice: number;
  qty: number;
  cmp: number;
  pe: number;
  investment: number;
  presentValue: number;
  gainLoss: number;
  portfolioPercent: string;
}

// Nice color palette for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const refreshData = async () => {
    try {
      // Calling our own internal API route. 
      // This hides the actual external API keys/logic from the browser.
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      
      setPortfolio(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error("Client fetch error - maybe the internet is down?");
    }
  };

  useEffect(() => {
    // Initial load
    refreshData();

    // Auto-refresh every 15 seconds so we feel like day traders
    const timer = setInterval(refreshData, 15000); 
    return () => clearInterval(timer);
  }, []);

  // Calculate the total once so we can use it for percentages later
  const totalValue = portfolio.reduce((sum, item) => sum + item.presentValue, 0);

  // Grouping data for the Sector Pie Chart
  // Basically summing up value per sector
  const sectorMap = portfolio.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = { name: stock.sector, value: 0, invested: 0, pl: 0 };
    }
    acc[stock.sector].value += stock.presentValue;
    acc[stock.sector].invested += stock.investment;
    acc[stock.sector].pl += stock.gainLoss;
    return acc;
  }, {} as Record<string, any>);

  const sectorData = Object.values(sectorMap);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-xl font-medium text-slate-500">
      Fetching market data...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">My Portfolio</h1>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            Last Updated: <span className="font-mono font-semibold text-slate-700">{lastUpdated}</span>
          </div>
        </header>

        {/* Top Cards: Sector Breakdown */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {sectorData.map((s, i) => {
            const isGreen = s.pl >= 0;
            return (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-3">{s.name}</h2>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Invested</p>
                    <p className="text-lg font-semibold">₹{s.invested.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">P&L</p>
                    <p className={`text-xl font-bold ${isGreen ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isGreen ? '+' : ''}₹{s.pl.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Charts Area */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-slate-700">Allocation by Sector</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-slate-700">Performance vs Cost</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolio}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  
                  {/* CHANGED: Added 'hide' prop here to remove overlapping text */}
                  <XAxis dataKey="ticker" hide />
                  
                  <YAxis hide />
                  <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="investment" name="Invested" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="presentValue" name="Current Value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-5 font-semibold">Stock</th>
                  <th className="p-5 text-right font-semibold">Qty</th>
                  <th className="p-5 text-right font-semibold">LTP</th>
                  <th className="p-5 text-right font-semibold">Inv. Value</th>
                  <th className="p-5 text-right font-semibold">Cur. Value</th>
                  <th className="p-5 text-right font-semibold">P&L</th>
                  <th className="p-5 text-right font-semibold">% Port</th>
                  <th className="p-5 text-right font-semibold">P/E</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolio.map((stock) => {
                  const isProfit = stock.gainLoss >= 0;
                  
                  // Calculate the % of portfolio dynamically
                  const percentage = totalValue > 0 
                    ? ((stock.presentValue / totalValue) * 100).toFixed(2) 
                    : "0.00";

                  return (
                    <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-900">{stock.name}</div>
                        <div className="text-xs text-slate-400">{stock.ticker}</div>
                      </td>
                      <td className="p-5 text-right text-slate-600">{stock.qty}</td>
                      <td className="p-5 text-right font-medium text-blue-600">₹{stock.cmp.toFixed(2)}</td>
                      <td className="p-5 text-right text-slate-600">₹{stock.investment.toLocaleString()}</td>
                      <td className="p-5 text-right font-medium text-slate-800">₹{stock.presentValue.toLocaleString()}</td>
                      <td className={`p-5 text-right font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isProfit ? '+' : ''}₹{Math.round(stock.gainLoss).toLocaleString()}
                      </td>
                      <td className="p-5 text-right text-slate-500">{percentage}%</td>
                      <td className="p-5 text-right text-slate-400 text-sm">{stock.pe ? stock.pe.toFixed(2) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
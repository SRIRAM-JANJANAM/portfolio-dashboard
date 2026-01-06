'use client';
import { useEffect, useState } from 'react';
// NEW IMPORTS FOR GRAPHS
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';

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

interface SectorSummary {
  invested: number;
  current: number;
  pl: number;
}

// COLORS FOR THE PIE CHART
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PortfolioDashboard() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, []);

  const totalPortfolioValue = data.reduce((sum, stock) => sum + stock.presentValue, 0);

  // PREPARE DATA FOR PIE CHART (Sector Wise)
  const sectorDataRaw = data.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = { name: stock.sector, value: 0, invested: 0, pl: 0 };
    }
    acc[stock.sector].value += stock.presentValue; // For Pie Chart
    acc[stock.sector].invested += stock.investment;
    acc[stock.sector].pl += stock.gainLoss;
    return acc;
  }, {} as Record<string, { name: string; value: number; invested: number; pl: number }>);

  const sectorChartData = Object.values(sectorDataRaw);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-600">Loading Market Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Portfolio Dashboard</h1>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            Last Updated: <span className="font-mono font-semibold text-slate-700">{lastUpdated}</span>
          </div>
        </header>

        {/* --- SUMMARY CARDS --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {sectorChartData.map((data, index) => {
            const isProfit = data.pl >= 0;
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-3">{data.name}</h2>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Invested</p>
                    <p className="text-lg font-semibold">₹{data.invested.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">P&L</p>
                    <p className={`text-xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isProfit ? '+' : ''}₹{data.pl.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* --- NEW SECTION: GRAPHS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* CHART 1: Sector Allocation (Pie) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4 text-slate-700">Sector Allocation</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number | undefined) => `₹${value?.toLocaleString()}`} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: Performance (Bar) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 text-slate-700">Stock Performance</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ticker" tick={{fontSize: 10}} interval={0} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number | undefined) => `₹${value?.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="investment" name="Invested" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="presentValue" name="Current Value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                {data.map((stock) => {
                  const isProfit = stock.gainLoss >= 0;
                  const realPercent = totalPortfolioValue > 0 
                    ? ((stock.presentValue / totalPortfolioValue) * 100).toFixed(2) 
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
                      <td className="p-5 text-right text-slate-500">{realPercent}%</td>
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
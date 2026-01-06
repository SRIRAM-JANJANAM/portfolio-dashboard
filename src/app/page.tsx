'use client';
import { useEffect, useState } from 'react';

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

  // 1. CALCULATE GRAND TOTAL (Needed for % Port)
  const totalPortfolioValue = data.reduce((sum, stock) => sum + stock.presentValue, 0);

  // 2. CALCULATE SECTOR TOTALS
  const sectorData = data.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = { invested: 0, current: 0, pl: 0 };
    }
    acc[stock.sector].invested += stock.investment;
    acc[stock.sector].current += stock.presentValue;
    acc[stock.sector].pl += stock.gainLoss;
    return acc;
  }, {} as Record<string, SectorSummary>);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-600">Loading Market Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Portfolio Dashboard</h1>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            Last Updated: <span className="font-mono font-semibold text-slate-700">{lastUpdated}</span>
          </div>
        </header>

        {/* Sector Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {Object.entries(sectorData).map(([sector, data]) => {
            const isProfit = data.pl >= 0;
            return (
              <div key={sector} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-3">{sector}</h2>
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

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-5 font-semibold">Stock Name</th>
                  <th className="p-5 text-right font-semibold">Avg. Price</th>
                  <th className="p-5 text-right font-semibold">Qty</th>
                  <th className="p-5 text-right font-semibold">LTP</th>
                  <th className="p-5 text-right font-semibold">Invested</th>
                  <th className="p-5 text-right font-semibold">Current</th>
                  <th className="p-5 text-right font-semibold">P&L</th>
                  <th className="p-5 text-right font-semibold">% Port</th>
                  <th className="p-5 text-right font-semibold">P/E</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((stock) => {
                  const isProfit = stock.gainLoss >= 0;
                  
                  // --- THE FIX: Calculate Percentage Here ---
                  const realPercent = totalPortfolioValue > 0 
                    ? ((stock.presentValue / totalPortfolioValue) * 100).toFixed(2) 
                    : "0.00";

                  return (
                    <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-900">{stock.name}</div>
                        <div className="text-xs text-slate-400">{stock.ticker}</div>
                      </td>
                      <td className="p-5 text-right text-slate-600">₹{stock.buyPrice}</td>
                      <td className="p-5 text-right text-slate-600">{stock.qty}</td>
                      <td className="p-5 text-right font-medium text-blue-600">
                        ₹{stock.cmp.toFixed(2)}
                      </td>
                      <td className="p-5 text-right text-slate-600">₹{stock.investment.toLocaleString()}</td>
                      <td className="p-5 text-right font-medium text-slate-800">₹{stock.presentValue.toLocaleString()}</td>
                      
                      <td className={`p-5 text-right font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isProfit ? '+' : ''}₹{Math.round(stock.gainLoss).toLocaleString()}
                      </td>

                      {/* Updated Column using calculated 'realPercent' */}
                      <td className="p-5 text-right text-slate-500">{realPercent}%</td>
                      
                      <td className="p-5 text-right text-slate-400 text-sm">
                        {stock.pe ? stock.pe.toFixed(2) : '-'}
                      </td>
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
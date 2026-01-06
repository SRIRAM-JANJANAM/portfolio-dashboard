'use client';

import { useEffect, useState } from 'react';

// Defining what our Stock data looks like so TypeScript doesn't yell at us
interface Stock {
  id: number;
  name: string;
  ticker: string;
  sector: string;
  qty: number;
  buyPrice: number;
  currentPrice: number;
  peRatio: number;
  currentValue: number;
  investmentValue: number;
  gainLoss: number;
}

export default function PortfolioDashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // This function hits our API to get the latest prices
  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setStocks(data);
      // Update the timestamp so the user knows it's fresh
      setLastUpdate(new Date().toLocaleTimeString());
      setIsLoading(false);
    } catch (error) {
      console.error('Something went wrong fetching the dashboard:', error);
    }
  };

  // This hook handles the "Live Update" requirement
  useEffect(() => {
    fetchPortfolio(); // Run it once immediately when the page loads
    
    // Then run it every 15 seconds automatically
    const intervalId = setInterval(fetchPortfolio, 15000);

    // Cleanup: Stop the timer if the user leaves the page
    return () => clearInterval(intervalId);
  }, []);

  // Grouping the stocks by Sector to show the summary cards
  // I used a reduce function to do this efficiently in one pass
  const sectorSummary = stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = { invested: 0, value: 0 };
    }
    acc[stock.sector].invested += stock.investmentValue;
    acc[stock.sector].value += stock.currentValue;
    return acc;
  }, {} as Record<string, { invested: number; value: number }>);

  if (isLoading) return <div className="text-center mt-20 text-xl font-medium text-gray-600">Loading Market Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Portfolio Dashboard</h1>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            Last Updated: <span className="font-mono font-semibold text-slate-700">{lastUpdate}</span>
          </div>
        </header>

        {/* Sector Cards - The "Big Picture" view */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {Object.entries(sectorSummary).map(([sector, data]) => {
            const gain = data.value - data.invested;
            const isProfit = gain >= 0;
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
                      {isProfit ? '+' : ''}₹{gain.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Main Stock Table - The Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-5 font-semibold">Stock Name</th>
                  <th className="p-5 font-semibold">Quantity</th>
                  <th className="p-5 font-semibold">Avg. Price</th>
                  <th className="p-5 font-semibold">LTP</th>
                  <th className="p-5 font-semibold">Invested Value</th>
                  <th className="p-5 font-semibold">Current Value</th>
                  <th className="p-5 font-semibold">P&L</th>
                  <th className="p-5 font-semibold">P/E Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.map((stock) => {
                  const isProfit = stock.gainLoss >= 0;
                  return (
                    <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-900">{stock.name}</div>
                        <div className="text-xs text-slate-400">{stock.ticker}</div>
                      </td>
                      <td className="p-5 text-slate-700">{stock.qty}</td>
                      <td className="p-5 text-slate-700">₹{stock.buyPrice}</td>
                      <td className="p-5 font-medium text-blue-600">
                        ₹{stock.currentPrice.toFixed(2)}
                      </td>
                      <td className="p-5 text-slate-600">₹{stock.investmentValue.toLocaleString()}</td>
                      <td className="p-5 font-medium text-slate-800">₹{stock.currentValue.toLocaleString()}</td>
                      <td className={`p-5 font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isProfit ? '+' : ''}₹{Math.round(stock.gainLoss).toLocaleString()}
                      </td>
                      <td className="p-5 text-slate-400 text-sm">
                        {stock.peRatio ? stock.peRatio.toFixed(2) : '-'}
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
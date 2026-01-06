'use client';
import { useEffect, useState } from 'react';

// REQUIREMENT: Design Data Model [cite: 102]
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

  // REQUIREMENT: API Integration [cite: 104]
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

  // REQUIREMENT: Dynamic Updates (setInterval) [cite: 95, 109]
  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 15000); // 15 seconds refresh
    return () => clearInterval(interval);
  }, []);

  // REQUIREMENT: Sector Grouping [cite: 53, 110]
  // We calculate totals for each sector
  const sectorData = data.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
      acc[stock.sector] = { invested: 0, current: 0, pl: 0 };
    }
    acc[stock.sector].invested += stock.investment;
    acc[stock.sector].current += stock.presentValue;
    acc[stock.sector].pl += stock.gainLoss;
    return acc;
  }, {} as Record<string, SectorSummary>);

  if (loading) return <div className="p-10 text-center">Loading Portfolio...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Portfolio Dashboard</h1>
        <div className="text-sm text-gray-500">Last Updated: <span className="font-mono font-bold">{lastUpdated}</span></div>
      </header>

      {/* SECTOR CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(sectorData).map(([sector, summary]) => (
          <div key={sector} className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-gray-400 uppercase text-xs font-bold tracking-wider mb-2">{sector}</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-500">Total Invested</p>
                <p className="text-lg font-semibold">₹{summary.invested.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total P&L</p>
                {/* REQUIREMENT: Visual Indicators (Green/Red) [cite: 49, 112] */}
                <p className={`text-xl font-bold ${summary.pl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {summary.pl >= 0 ? '+' : ''}₹{summary.pl.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PORTFOLIO TABLE */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="p-4">Stock Name</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right">Qty</th>
              <th className="p-4 text-right">Inv. Value</th>
              <th className="p-4 text-right">CMP</th>
              <th className="p-4 text-right">Cur. Value</th>
              <th className="p-4 text-right">P&L</th>
              <th className="p-4 text-right">% Port.</th>
              <th className="p-4 text-right">P/E</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((stock) => (
              <tr key={stock.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">
                  {stock.name}
                  <div className="text-xs text-gray-400">{stock.ticker}</div>
                </td>
                <td className="p-4 text-right">₹{stock.buyPrice}</td>
                <td className="p-4 text-right">{stock.qty}</td>
                <td className="p-4 text-right">₹{stock.investment.toLocaleString()}</td>
                
                {/* Dynamic CMP */}
                <td className="p-4 text-right font-medium text-blue-600">
                  ₹{stock.cmp.toFixed(2)}
                </td>
                
                <td className="p-4 text-right font-medium">₹{stock.presentValue.toLocaleString()}</td>
                
                {/* REQUIREMENT: Color-code Gain/Loss [cite: 50] */}
                <td className={`p-4 text-right font-bold ${stock.gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {stock.gainLoss >= 0 ? '+' : ''}₹{Math.round(stock.gainLoss).toLocaleString()}
                </td>

                <td className="p-4 text-right">{stock.portfolioPercent}%</td>
                <td className="p-4 text-right">{stock.pe ? stock.pe.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
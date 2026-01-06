import { NextResponse } from 'next/server';
import stocks from '@/data/stocks.json';

// REQUIREMENT: Performance Optimization & Caching [cite: 83]
// We cache data for 60 seconds. This prevents us from hitting Yahoo's "Rate Limit".
export const revalidate = 60;

export async function GET() {
  // 1. "Batching": Combine all tickers into one string (e.g., "HDFCBANK.NS,SBIN.NS")
  // This reduces 8 network requests down to just 1.
  const tickers = stocks.map(s => s.ticker).join(',');

  // 2. "Unofficial API": Use Yahoo's query1 endpoint.
  // We request 'regularMarketPrice' (CMP) and 'trailingPE' (P/E Ratio) as per requirements[cite: 42, 45].
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}`;

  try {
    const response = await fetch(url, {
      headers: {
        // "Scraping Strategy": Pretend to be a real browser so Yahoo doesn't block us [cite: 72]
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) throw new Error("Yahoo API refused connection");

    const data = await response.json();
    const results = data.quoteResponse?.result || [];

    // 3. "Data Transformation": Format the raw API data to match the table schema [cite: 81]
    const portfolioData = stocks.map((stock) => {
      const yahooData = results.find((r: any) => r.symbol === stock.ticker);
      
      // Fallback: If API fails for one stock, use buyPrice so the app doesn't crash 
      const cmp = yahooData?.regularMarketPrice || stock.buyPrice;
      const pe = yahooData?.trailingPE || 0; // P/E from Yahoo/Google

      const investment = stock.buyPrice * stock.qty;
      const presentValue = cmp * stock.qty;
      const gainLoss = presentValue - investment;

      return {
        ...stock,
        cmp,           // CMP (Req: 42)
        pe,            // P/E Ratio (Req: 45)
        investment,    // Investment (Req: 39)
        presentValue,  // Present Value (Req: 43)
        gainLoss,      // Gain/Loss (Req: 44)
        latestEarnings: yahooData?.epsTrailingTwelveMonths || 0 // Extra data for "Latest Earnings" [cite: 46]
      };
    });

    // 4. Calculate "Portfolio (%)" - Proportional weight [cite: 40]
    const totalValue = portfolioData.reduce((sum, s) => sum + s.presentValue, 0);
    const finalData = portfolioData.map(s => ({
      ...s,
      portfolioPercent: totalValue > 0 ? ((s.presentValue / totalValue) * 100).toFixed(2) : "0"
    }));

    return NextResponse.json(finalData);

  } catch (error) {
    console.error("API Error:", error);
    // Error Handling: Return static data if API fails completely 
    return NextResponse.json(stocks.map(s => ({ ...s, cmp: s.buyPrice, pe: 0, investment: s.buyPrice * s.qty, presentValue: s.buyPrice * s.qty, gainLoss: 0, portfolioPercent: "0" })));
  }
}
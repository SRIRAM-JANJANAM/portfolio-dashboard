import { NextResponse } from 'next/server';
import stocks from '@/data/stocks.json';

// CACHING: Cache for 60 seconds to respect rate limits
export const revalidate = 60;

export async function GET() {
  // 1. Prepare the list of tickers (comma separated)
  // Yahoo uses ".NS" for NSE stocks.
  const tickers = stocks.map(s => s.ticker.replace('.BSE', '.NS')).join(',');

  // 2. The "Unofficial" Yahoo Finance API Endpoint
  // This endpoint allows fetching multiple stocks in ONE request.
  // We request 'regularMarketPrice' (LTP) and 'trailingPE' (P/E Ratio).
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}`;

  try {
    const response = await fetch(url, {
      headers: {
        // Essential: Pretend to be a browser to avoid rejection
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 } // Double-check caching
    });

    if (!response.ok) {
      throw new Error("Yahoo API refused connection");
    }

    const data = await response.json();
    const results = data.quoteResponse?.result || [];

    // 3. Map the API results back to our Portfolio structure
    const portfolioData = stocks.map((stock) => {
      // Find the specific result for this stock
      const yahooData = results.find((r: any) => r.symbol === stock.ticker.replace('.BSE', '.NS'));
      
      // Get Price (Fall back to buyPrice if missing)
      const livePrice = yahooData?.regularMarketPrice || stock.buyPrice;
      
      // Get P/E Ratio (Yahoo calls it 'trailingPE')
      const peRatio = yahooData?.trailingPE || 0;

      return {
        ...stock,
        currentPrice: livePrice,
        peRatio: peRatio, 
        currentValue: livePrice * stock.qty,
        investmentValue: stock.buyPrice * stock.qty,
        gainLoss: (livePrice - stock.buyPrice) * stock.qty,
      };
    });

    return NextResponse.json(portfolioData);

  } catch (error) {
    console.error("Batch fetch failed:", error);
    
    // FAILSAFE: If the API completely fails, return safe fallback data
    // so the dashboard never looks broken.
    const fallbackData = stocks.map(stock => ({
        ...stock,
        currentPrice: stock.buyPrice,
        peRatio: 0,
        currentValue: stock.buyPrice * stock.qty,
        investmentValue: stock.buyPrice * stock.qty,
        gainLoss: 0
    }));
    return NextResponse.json(fallbackData);
  }
}
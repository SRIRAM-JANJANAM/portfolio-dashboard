import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import stocks from '@/data/stocks.json';

// This is the function that runs when our frontend asks for data
export async function GET() {
  try {
    // I'm using Promise.all here to fetch everything at once.
    // If we did a loop, it would take forever to load 20+ stocks one by one.
    const promises = stocks.map(async (stock) => {
      try {
        const quote: any = await yahooFinance.quote(stock.ticker);
        
        // Yahoo gives us the "regularMarketPrice" (Live Price).
        // I'm also grabbing the P/E ratio here since scraping Google Finance is risky/unreliable.
        const currentPrice = quote.regularMarketPrice || 0;
        const peRatio = quote.trailingPE || 0;

        // I'm calculating the totals here on the server to keep the frontend simple
        return {
          ...stock,
          currentPrice,
          peRatio,
          currentValue: currentPrice * stock.qty,
          investmentValue: stock.buyPrice * stock.qty,
          gainLoss: (currentPrice - stock.buyPrice) * stock.qty,
        };
      } catch (err) {
        // If one stock fails (like a ticker change), just log it and return 0s.
        // This prevents the whole dashboard from crashing due to one bad apple.
        console.error(`Error fetching data for ${stock.name}`, err);
        return { ...stock, currentPrice: 0, peRatio: 0, currentValue: 0, investmentValue: 0, gainLoss: 0 };
      }
    });

    // Wait for all the data to come back
    const portfolioData = await Promise.all(promises);

    return NextResponse.json(portfolioData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 });
  }
}
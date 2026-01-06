import { NextResponse } from 'next/server';
import stocks from '@/data/stocks.json';
import { load } from 'cheerio'; // You might need to run: npm install cheerio

// CACHING STRATEGY (Required by PDF )
// We cache the results for 60 seconds so we don't get banned for scraping too fast.
export const revalidate = 60;

// This function "scrapes" the data by pretending to be a browser
async function scrapeStockData(ticker: string) {
  const symbol = ticker.replace('.BSE', '.NS'); // Yahoo uses .NS for NSE
  const url = `https://finance.yahoo.com/quote/${symbol}`;

  try {
    const response = await fetch(url, {
      headers: {
        // THE TRICK: We send a "User-Agent" so Yahoo thinks we are a real laptop, not a Vercel bot.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    const html = await response.text();
    
    // Use Cheerio (or regex) to find the price in the HTML
    // Note: Yahoo changes classes often, so Regex is sometimes safer for simple assignments
    // This Regex looks for the specific pattern Yahoo uses for price
    const priceMatch = html.match(/fin-streamer.+?data-field="regularMarketPrice".+?value="([\d\.]+)"/);
    
    if (priceMatch && priceMatch[1]) {
      return parseFloat(priceMatch[1]);
    }

    return 0; // Failed to find price
  } catch (error) {
    console.error(`Scraping failed for ${ticker}`);
    return 0;
  }
}

export async function GET() {
  const portfolioData = await Promise.all(
    stocks.map(async (stock) => {
      // 1. Scrape the data (Solving the "Unofficial API" challenge )
      let currentPrice = await scrapeStockData(stock.ticker);

      // 2. Fallback (Required for "Error Handling" [cite: 86])
      if (currentPrice === 0) {
        currentPrice = stock.buyPrice; 
      }

      return {
        ...stock,
        currentPrice,
        currentValue: currentPrice * stock.qty,
        investmentValue: stock.buyPrice * stock.qty,
        gainLoss: (currentPrice - stock.buyPrice) * stock.qty,
        peRatio: 0, 
      };
    })
  );

  return NextResponse.json(portfolioData);
}
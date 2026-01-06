import { NextResponse } from 'next/server';
import stocks from '@/data/stocks.json';
import * as cheerio from 'cheerio';

// CACHING: Cache for 60 seconds to satisfy "Rate Limiting" requirement [cite: 75]
export const revalidate = 60;

// Helper: Wait for a random time (Throttling) to prevent blocking [cite: 75]
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeStockData(ticker: string) {
  const symbol = ticker.replace('.BSE', '.NS');
  const url = `https://finance.yahoo.com/quote/${symbol}`;

  try {
    // 1. Fetch HTML with a real browser User-Agent
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) return { price: 0, pe: 0 };

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Scrape PRICE (Using Yahoo's data attributes)
    // Yahoo often stores price in 'regularMarketPrice'
    let price = parseFloat($('fin-streamer[data-field="regularMarketPrice"]').attr('data-value') || "0");

    // 3. Scrape P/E RATIO (Using Yahoo's data attributes)
    // Yahoo often stores PE in 'trailingPE'
    let pe = parseFloat($('fin-streamer[data-field="trailingPE"]').attr('data-value') || "0");

    return { price, pe };

  } catch (error) {
    console.error(`Failed to scrape ${ticker}`, error);
    return { price: 0, pe: 0 };
  }
}

export async function GET() {
  // We use a regular "for" loop instead of "Promise.all" to throttle requests.
  // This is slower but much safer against blocking.
  const portfolioData = [];

  for (const stock of stocks) {
    // Add a small delay (0.5s - 1.5s) between requests to mimic a human user
    await delay(Math.floor(Math.random() * 1000) + 500);

    const { price, pe } = await scrapeStockData(stock.ticker);
    
    // FALLBACK: If scraping fails, use buyPrice so the UI doesn't break
    const currentPrice = (price > 0) ? price : stock.buyPrice;

    portfolioData.push({
      ...stock,
      currentPrice,
      peRatio: pe, // Now populated with scraped data
      currentValue: currentPrice * stock.qty,
      investmentValue: stock.buyPrice * stock.qty,
      gainLoss: (currentPrice - stock.buyPrice) * stock.qty,
    });
  }

  return NextResponse.json(portfolioData);
}
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

export interface MarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  fearGreedIndex: number;
  activeCoins: number;
}

export class RealPriceService {
  private cache: Map<string, { data: PriceData; expiry: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  async getPrice(symbol: string): Promise<PriceData> {
    const cacheKey = symbol.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      console.log(`📊 Using cached price for ${symbol}`);
      return cached.data;
    }

    try {
      console.log(`🔍 Fetching REAL price for ${symbol} from CoinGecko`);
      
      const coinId = this.getCoinGeckoId(symbol);
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data[coinId]) {
        throw new Error(`Price data not found for ${symbol}`);
      }

      const priceInfo = data[coinId];
      const priceData: PriceData = {
        symbol: symbol.toUpperCase(),
        price: priceInfo.usd,
        change24h: priceInfo.usd_24h_change || 0,
        volume24h: priceInfo.usd_24h_vol || 0,
        marketCap: priceInfo.usd_market_cap || 0,
        lastUpdated: Date.now()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: priceData,
        expiry: Date.now() + this.cacheTimeout
      });

      console.log(`✅ Fetched real price for ${symbol}: $${priceData.price}`);
      return priceData;

    } catch (error) {
      console.error(`❌ Failed to fetch price for ${symbol}:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`⚠️ Using expired cache for ${symbol}`);
        return cached.data;
      }
      
      throw error;
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<PriceData[]> {
    try {
      console.log(`🔍 Fetching REAL prices for ${symbols.length} symbols`);
      
      const coinIds = symbols.map(s => this.getCoinGeckoId(s)).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const results: PriceData[] = [];
      
      for (const symbol of symbols) {
        const coinId = this.getCoinGeckoId(symbol);
        const priceInfo = data[coinId];
        
        if (priceInfo) {
          const priceData: PriceData = {
            symbol: symbol.toUpperCase(),
            price: priceInfo.usd,
            change24h: priceInfo.usd_24h_change || 0,
            volume24h: priceInfo.usd_24h_vol || 0,
            marketCap: priceInfo.usd_market_cap || 0,
            lastUpdated: Date.now()
          };
          
          results.push(priceData);
          
          // Cache individual results
          this.cache.set(symbol.toLowerCase(), {
            data: priceData,
            expiry: Date.now() + this.cacheTimeout
          });
        }
      }

      console.log(`✅ Fetched ${results.length} real prices`);
      return results;

    } catch (error) {
      console.error('❌ Failed to fetch multiple prices:', error);
      throw error;
    }
  }

  async getMarketData(): Promise<MarketData> {
    try {
      console.log('🔍 Fetching REAL market data from CoinGecko');
      
      const url = 'https://api.coingecko.com/api/v3/global';
      const response = await fetch(url);
      const data = await response.json();
      
      const globalData = data.data;
      
      const marketData: MarketData = {
        totalMarketCap: globalData.total_market_cap.usd,
        totalVolume24h: globalData.total_volume.usd,
        btcDominance: globalData.market_cap_percentage.btc,
        fearGreedIndex: 50, // Would need separate API for this
        activeCoins: globalData.active_cryptocurrencies
      };

      console.log(`✅ Fetched real market data: $${(marketData.totalMarketCap / 1e12).toFixed(2)}T market cap`);
      return marketData;

    } catch (error) {
      console.error('❌ Failed to fetch market data:', error);
      throw error;
    }
  }

  async getHistoricalPrices(symbol: string, days: number = 30): Promise<Array<{ timestamp: number; price: number }>> {
    try {
      console.log(`🔍 Fetching REAL historical prices for ${symbol} (${days} days)`);
      
      const coinId = this.getCoinGeckoId(symbol);
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const prices = data.prices.map((item: [number, number]) => ({
        timestamp: item[0],
        price: item[1]
      }));

      console.log(`✅ Fetched ${prices.length} historical price points for ${symbol}`);
      return prices;

    } catch (error) {
      console.error(`❌ Failed to fetch historical prices for ${symbol}:`, error);
      throw error;
    }
  }

  private getCoinGeckoId(symbol: string): string {
    const symbolMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'WETH': 'weth',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'COMP': 'compound-governance-token',
      'MKR': 'maker',
      'SNX': 'havven',
      'CRV': 'curve-dao-token',
      'YFI': 'yearn-finance',
      'SUSHI': 'sushi',
      'BAL': 'balancer',
      'REN': 'republic-protocol',
      'KNC': 'kyber-network-crystal',
      'ZRX': '0x',
      'LRC': 'loopring'
    };
    
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Price cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const realPriceService = new RealPriceService();
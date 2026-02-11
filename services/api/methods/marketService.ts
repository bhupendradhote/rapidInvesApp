import axios from 'axios';

// --- Types ---

export type AngelQuoteRaw = {
  exchange: string;
  tradingSymbol: string;
  symbolToken: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  netChange: number;
  percentChange: number;
  exchFeedTime?: string;
  depth?: {
    buy: any[];
    sell: any[];
  };
};

export type AngelQuoteResponse = {
  status: boolean;
  message: string;
  data: {
    fetched: AngelQuoteRaw[];
    unfetched?: any[];
  };
};

export type AngelGainerLoserRaw = {
  tradingSymbol: string;
  symbolToken: number | string;
  ltp: number;
  netChange: number;
  percentChange: number;
};

type AngelMoverAPIResponse = {
  status: boolean;
  message: string;
  data: AngelGainerLoserRaw[];
};

export type MarketMoversResult = {
  gainers: AngelGainerLoserRaw[];
  losers: AngelGainerLoserRaw[];
};

export type AngelCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type AngelHistoryResponse = {
  status: boolean;
  message: string;
  data: any[];
};

// NEW: Types for Equity Search
export type EquitySearchResponse = {
  status: boolean;
  data: string[]; // Array of stock names
};

export type EquityTokenData = {
  token: string;
  symbol: string;
  name: string;
  exch_seg: string;
};

export type EquityTokenResponse = {
  status: boolean;
  message?: string;
  data: EquityTokenData | null;
};

// --- API Config ---

const API_BASE = 'https://bharatstockmarketresearch.com/api/angel';

const ENDPOINTS = {
  QUOTE: `${API_BASE}/quote`,
  INDICES: `${API_BASE}/indices`,
  MOVERS: `${API_BASE}/gainers-losers`,
  HISTORY: `${API_BASE}/history`,
  MARQUEE: `${API_BASE}/nifty50-marquee`,
  WEEK_52: `${API_BASE}/52-week-data`,
  // New Equity Routes
  SEARCH_EQUITY: `${API_BASE}/search-equity-names`,
  FIND_EQUITY_TOKEN: `${API_BASE}/find-equity-token`,
};

const DEFAULT_TIMEOUT = 15000; // Increased to 15s to handle backend delays
const JSON_HEADERS = { Accept: 'application/json' };

// --- Methods ---

/**
 * Fetch Market Indices (Nifty 50, Bank Nifty, etc.)
 */
export async function fetchAngelIndices(): Promise<AngelQuoteRaw[]> {
  try {
    const res = await axios.get<AngelQuoteResponse>(ENDPOINTS.INDICES, {
      headers: JSON_HEADERS,
      timeout: DEFAULT_TIMEOUT,
    });

    if (!res.data?.status) {
      console.warn('fetchAngelIndices: Backend returned false status');
      return [];
    }
    return res.data?.data?.fetched ?? [];
  } catch (err: any) {
    // 500 Error Handler: Prevent Red Screen in React Native
    if (err.response?.status === 500) {
      console.warn('fetchAngelIndices: Server Error (500). Check Backend Logs (Angel Login Failed).');
    } else {
      console.error('fetchAngelIndices Error:', err.message);
    }
    return [];
  }
}

/**
 * Fetch Nifty 50 Marquee Stocks (Top 20)
 */
export async function fetchNifty50Marquee(): Promise<any[]> {
  try {
    const res = await axios.get(ENDPOINTS.MARQUEE, {
      headers: JSON_HEADERS,
      timeout: DEFAULT_TIMEOUT,
    });
    return res.data?.status ? res.data.data : [];
  } catch (err) {
    console.warn('fetchNifty50Marquee Failed:', err);
    return [];
  }
}

/**
 * Fetch Top Gainers and Losers
 */
export async function fetchGainersLosers(): Promise<MarketMoversResult> {
  try {
    const config = { headers: JSON_HEADERS, timeout: DEFAULT_TIMEOUT };
    const params = { exchange: 'NSE', expirytype: 'NEAR' };

    // Parallel requests for speed
    const [gainersRes, losersRes] = await Promise.all([
      axios.get<AngelMoverAPIResponse>(ENDPOINTS.MOVERS, { 
        ...config, 
        params: { ...params, datatype: 'GAINERS' } 
      }).catch(() => null), // Return null instead of throwing

      axios.get<AngelMoverAPIResponse>(ENDPOINTS.MOVERS, { 
        ...config, 
        params: { ...params, datatype: 'LOSERS' } 
      }).catch(() => null),
    ]);

    const gainers = gainersRes?.data?.data || [];
    const losers = losersRes?.data?.data || [];

    return { gainers, losers };

  } catch (err) {
    console.error('fetchGainersLosers Critical Error:', err);
    return { gainers: [], losers: [] };
  }
}

/**
 * Fetch Live Quotes for specific tokens
 */
export async function fetchAngelQuotes(symbolTokens?: string[]): Promise<AngelQuoteRaw[]> {
  try {
    if (!symbolTokens || symbolTokens.length === 0) return [];

    // Backend expects comma-separated string in 'symbol' param
    const params = { 
        symbol: symbolTokens.join(','),
        exchange: 'NSE' 
    };

    const res = await axios.get<AngelQuoteResponse>(ENDPOINTS.QUOTE, {
      params,
      headers: JSON_HEADERS,
      timeout: DEFAULT_TIMEOUT,
    });

    const fetched = res.data?.data?.fetched ?? [];
    
    // Ensure we return data in the order requested if possible, or just raw list
    return fetched;
  } catch (err) {
    console.warn('fetchAngelQuotes Error:', err);
    return [];
  }
}

/**
 * Fetch Historical Candle Data
 */
export async function fetchAngelHistory(params: {
  symbolToken: string;
  exchange: 'NSE' | 'BSE';
  interval: string;
  from: string;
  to: string;
}): Promise<AngelCandle[]> {
  try {
    const res = await axios.get<AngelHistoryResponse>(ENDPOINTS.HISTORY, {
      params,
      headers: JSON_HEADERS,
      timeout: DEFAULT_TIMEOUT,
    });

    const data = res.data?.data;
    if (Array.isArray(data)) {
      return data.map((d: any) => {
        // Angel History returns array [time, open, high, low, close, volume]
        if (Array.isArray(d)) {
          return {
            time: d[0],
            open: d[1],
            high: d[2],
            low: d[3],
            close: d[4],
            volume: d[5],
          };
        }
        return d;
      });
    }
    return [];
  } catch (err) {
    return [];
  }
}

// =========================================================
// NEW: Equity Search Integration (Matching Backend Routes)
// =========================================================

/**
 * Search Equity Script Names (Autocomplete)
 * Route: /search-equity-names
 */
export async function searchEquityNames(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  
  try {
    const res = await axios.get<EquitySearchResponse>(ENDPOINTS.SEARCH_EQUITY, {
      params: { query, exchange: 'NSE' },
      headers: JSON_HEADERS,
      timeout: 5000,
    });

    return res.data?.status ? res.data.data : [];
  } catch (err) {
    console.warn('searchEquityNames Error:', err);
    return [];
  }
}


export async function findEquityToken(name: string): Promise<EquityTokenData | null> {
  try {
    const res = await axios.get<EquityTokenResponse>(ENDPOINTS.FIND_EQUITY_TOKEN, {
      params: { name, exchange: 'NSE' },
      headers: JSON_HEADERS,
      timeout: 5000,
    });

    if (res.data?.status && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.warn('findEquityToken Error:', err);
    return null;
  }
}
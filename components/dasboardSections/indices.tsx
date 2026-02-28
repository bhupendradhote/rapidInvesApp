import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fetchAngelIndices, AngelQuoteRaw } from '../../services/api/methods/marketService';

const { width } = Dimensions.get('window');

// New Dimensions for "Carousel" feel
const CARD_WIDTH = width * 0.46;
const CARD_HEIGHT = 180;
const CHART_HEIGHT = 65;

type IndexModel = {
  id: string;
  token: string;
  title: string;
  exchange: string;
  price: string;
  currency: string;
  change: string;
  percent: string;
  up: boolean;
  chart: number[];
};

const SYMBOLS = [
  { id: 'nifty', token: '99926000', title: 'NIFTY 50', exchange: 'NSE' },
  { id: 'sensex', token: '99919000', title: 'SENSEX', exchange: 'BSE' },
  { id: 'banknifty', token: '99926009', title: 'BANK NIFTY', exchange: 'NSE' },
  { id: 'finnifty', token: '99926037', title: 'FIN NIFTY', exchange: 'NSE' },
  { id: 'midcap', token: '99926004', title: 'MIDCAP 50', exchange: 'NSE' },
  { id: 'infra', token: '99926021', title: 'INFRA', exchange: 'NSE' },
  { id: 'energy', token: '99926022', title: 'ENERGY', exchange: 'NSE' },
  { id: 'commodities', token: '99926025', title: 'COMMODITIES', exchange: 'NSE' },
  { id: 'consumption', token: '99926019', title: 'CONSUMPTION', exchange: 'NSE' },
  { id: 'cpse', token: '99926020', title: 'CPSE', exchange: 'NSE' },
];

// --- Sub-Components ---

const SparklineComponent = ({ data, up }: { data: number[]; up: boolean }) => {
  // Full width of card (no padding) for bleed effect
  const chartWidth = CARD_WIDTH;
  const chartHeight = CHART_HEIGHT;

  if (!data || data.length === 0) {
    return <View style={{ height: chartHeight, width: chartWidth }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const diff = max - min;

  const points = data.map((value, index) => {
    const denom = diff === 0 ? 1 : diff;
    const x = (index / (data.length - 1)) * chartWidth;
    // Leave 20px padding at top so line doesn't hit text
    const y = chartHeight - ((value - min) / denom) * (chartHeight - 20); 
    return `${x},${y}`;
  });

  const lineCommand = `M ${points.join(' L ')}`;
  const fillCommand = `${lineCommand} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  // Dynamic Colors based on Trend
  const color = up ? '#10b981' : '#f43f5e'; // Emerald-500 vs Rose-500
  const gradientId = `grad-${up ? 'up' : 'down'}`;

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fillCommand} fill={`url(#${gradientId})`} />
        <Path
          d={lineCommand}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const Sparkline = React.memo(SparklineComponent);
Sparkline.displayName = 'Sparkline';

// --- Utilities ---

function generateInitialGraph(quote: AngelQuoteRaw): number[] {
  const open = Number(quote.open || 0);
  const close = Number(quote.ltp || quote.close || open);
  let high = Number(quote.high || Math.max(open, close));
  let low = Number(quote.low || Math.min(open, close));
  high = Math.max(high, open, close);
  low = Math.min(low, open, close);

  if (open === 0) return [0, 0, 0, 0];
  const steps = 10;
  const path: number[] = new Array(steps).fill(0);
  path[0] = open;
  path[steps - 1] = close;

  const highIndex = Math.floor(Math.random() * (steps - 2)) + 1;
  let lowIndex = Math.floor(Math.random() * (steps - 2)) + 1;
  while (lowIndex === highIndex) lowIndex = Math.floor(Math.random() * (steps - 2)) + 1;

  for (let i = 1; i < steps - 1; i++) {
    if (i === highIndex) path[i] = high;
    else if (i === lowIndex) path[i] = low;
    else {
      const progress = i / (steps - 1);
      const linearPoint = open + (close - open) * progress;
      const range = high - low || (open * 0.01);
      const noise = (Math.random() - 0.5) * range * 0.6;
      let val = linearPoint + noise;
      val = Math.max(low, Math.min(high, val));
      path[i] = val;
    }
  }
  return path;
}

function fmt(n: number) {
  if (!isFinite(n)) return '-';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const findMarketData = (fetchedData: AngelQuoteRaw[], symbol: typeof SYMBOLS[0]) => {
  if (!fetchedData || !Array.isArray(fetchedData)) return undefined;
  const byToken = fetchedData.find((f) => String(f.symbolToken) === String(symbol.token));
  if (byToken) return byToken;
  const byExactName = fetchedData.find((f) => f.tradingSymbol?.toLowerCase() === symbol.title.toLowerCase());
  if (byExactName) return byExactName;
  return fetchedData.find((f) => (f.tradingSymbol?.toLowerCase() || '').includes(symbol.title.toLowerCase()));
};

// --- Main Component ---

const Indices: React.FC = () => {
  const [indices, setIndices] = useState<IndexModel[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const chartCache = useRef<Map<string, number[]>>(new Map());
  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isFetching.current && !isManualRefresh) return;

    try {
      isFetching.current = true;
      const hasData = chartCache.current.size > 0;
      if (!isManualRefresh && !hasData && isMounted.current) setLoading(true);

      const fetched = await fetchAngelIndices();
      if (!isMounted.current) return;

      const mapped: IndexModel[] = SYMBOLS.map((s) => {
        const q = findMarketData(fetched, s);
        if (!q) {
          const cachedChart = chartCache.current.get(s.token) || [];
          const oldIndex = indices?.find(i => i.id === s.id);
          if (oldIndex) return oldIndex;
          return { 
            ...s, 
            price: '-', 
            currency: 'INR', 
            change: '-', 
            percent: '0.00', 
            up: false, 
            chart: cachedChart 
          };
        }

        const currentLTP = Number(q.ltp ?? q.close ?? 0);
        const netChange = Number(q.netChange);
        const percentChange = Number(q.percentChange);
        const up = netChange >= 0;
        const price = fmt(currentLTP);
        const change = `${netChange.toFixed(2)}`;
        const percent = `${percentChange.toFixed(2)}%`;

        let chartData = chartCache.current.get(s.token);
        if (!chartData || chartData.length === 0) {
          chartData = generateInitialGraph(q);
        } else {
          chartData = [...chartData];
          chartData[chartData.length - 1] = currentLTP;
        }
        chartCache.current.set(s.token, chartData);

        return {
          ...s,
          exchange: q.exchange || s.exchange,
          price,
          currency: 'INR',
          change,
          percent,
          up,
          chart: chartData,
        };
      });

      if (isMounted.current) setIndices(mapped);
    } catch (err: any) {
      console.warn('Indices polling failed:', err.message || 'Unknown error');
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [indices]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => fetchData(), 3000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Market Indices</Text>
          <Text style={styles.headerSubtitle}>Live Performance</Text>
        </View>
        <View style={styles.liveBadge}>
           <View style={styles.pulseDot} />
           <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {loading && !indices ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 16} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
        >
          {(indices ?? []).map((idx) => (
            <TouchableOpacity 
              key={idx.id} 
              style={styles.card}
              activeOpacity={0.9}
            >
              {/* Top Row: Title & Exchange */}
              <View style={styles.cardHeader}>
                <View style={styles.titleWrapper}>
                  <Text style={styles.indexTitle} numberOfLines={1}>{idx.title}</Text>
                  <Text style={styles.exchangeTag}>{idx.exchange}</Text>
                </View>
                
                {/* Percent Badge Pill */}
                <View style={[styles.percentBadge, idx.up ? styles.bgUp : styles.bgDown]}>
                   <Text style={[styles.percentText, idx.up ? styles.textUp : styles.textDown]}>
                     {idx.up ? '↑' : '↓'} {idx.percent}
                   </Text>
                </View>
              </View>

              {/* Middle: Big Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{idx.price}</Text>
                <Text style={[styles.changeText, idx.up ? styles.textUp : styles.textDown]}>
                   {idx.up ? '+' : ''}{idx.change}
                </Text>
              </View>

              {/* Bottom: Full Width Chart */}
              <View style={styles.chartWrapper}>
                <Sparkline data={idx.chart} up={idx.up} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  
  // --- CARD STYLES ---
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden', 
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#334155',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  titleWrapper: {
    flex: 1,
  },
  indexTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  exchangeTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  
  // --- PRICE ---
  priceContainer: {
    paddingHorizontal: 16,
    marginBottom: 4, 
    zIndex: 2, 
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // --- CHART ---
  chartWrapper: {
    height: CHART_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: -1,
  },
  chartContainer: {
    width: '100%',
    height: '100%',
  },

  // --- COLORS ---
  bgUp: { backgroundColor: '#ecfdf5' }, // Green-50
  bgDown: { backgroundColor: '#fef2f2' }, // Red-50
  textUp: { color: '#059669' }, // Green-600
  textDown: { color: '#dc2626' }, // Red-600
});

export default Indices;
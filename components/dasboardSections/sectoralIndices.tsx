// components/SectoralIndices.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  fetchAngelIndices,
  AngelQuoteRaw,
} from '../../services/api/methods/marketService';

const { width } = Dimensions.get('window');

const GRAPH_WIDTH = 60;
const GRAPH_HEIGHT = 30;

type IndexModel = {
  id: string;
  token: string;
  title: string;
  exchange: string;
  price: string;
  currency: string;
  change: string;
  percentChange: string;
  up: boolean;
  chart: number[];
};

const SECTORAL_SYMBOLS = [
  { id: 'auto', token: '99926002', title: 'NIFTY AUTO', exchange: 'NSE', searchKey: 'Auto' },
  { id: 'fmcg', token: '99926005', title: 'NIFTY FMCG', exchange: 'NSE', searchKey: 'FMCG' },
  { id: 'it', token: '99926006', title: 'NIFTY IT', exchange: 'NSE', searchKey: 'IT' },
  { id: 'metal', token: '99926008', title: 'NIFTY METAL', exchange: 'NSE', searchKey: 'Metal' },
  { id: 'psu', token: '99926012', title: 'PSU BANK', exchange: 'NSE', searchKey: 'PSU' },
  { id: 'pvtbank', token: '99926011', title: 'PVT BANK', exchange: 'NSE', searchKey: 'Pvt' },
  { id: 'realty', token: '99926013', title: 'NIFTY REALTY', exchange: 'NSE', searchKey: 'Realty' },
  { id: 'consumer', token: '99926016', title: 'CONSUMER', exchange: 'NSE', searchKey: 'Consumer' },
  { id: 'oilgas', token: '99926017', title: 'OIL & GAS', exchange: 'NSE', searchKey: 'Oil' },
  { id: 'healthcare', token: '99926018', title: 'HEALTHCARE', exchange: 'NSE', searchKey: 'Health' },
];

const SparklineBase = ({ data, up }: { data: number[]; up: boolean }) => {
  if (!data || data.length === 0) {
    return <View style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const diff = max - min;

  const points = data.map((value, index) => {
    const denom = diff === 0 ? 1 : diff;
    const x = (index / (data.length - 1)) * GRAPH_WIDTH;
    const y = GRAPH_HEIGHT - ((value - min) / denom) * (GRAPH_HEIGHT - 4);
    return `${x},${y}`;
  });

  const lineCommand = `M ${points.join(' L ')}`;
  const fillCommand = `${lineCommand} L ${GRAPH_WIDTH},${GRAPH_HEIGHT} L 0,${GRAPH_HEIGHT} Z`;

  const color = up ? '#22c55e' : '#ef4444';
  const gradientId = `grad-${up ? 'up' : 'down'}-${Math.random()}`;

  return (
    <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillCommand} fill={`url(#${gradientId})`} />
      <Path
        d={lineCommand}
        fill="none"
        stroke={color}
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
const Sparkline = React.memo(SparklineBase);

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

const findMarketData = (fetchedData: AngelQuoteRaw[], symbol: typeof SECTORAL_SYMBOLS[0]) => {
  if (!fetchedData || !Array.isArray(fetchedData)) return undefined;

  const byToken = fetchedData.find((f) => String(f.symbolToken) === String(symbol.token));
  if (byToken) return byToken;

  const byExactName = fetchedData.find((f) =>
    f.tradingSymbol?.toLowerCase() === symbol.title.toLowerCase()
  );
  if (byExactName) return byExactName;

  if (symbol.searchKey) {
    const byKey = fetchedData.find((f) =>
      f.tradingSymbol?.toLowerCase().includes(symbol.searchKey.toLowerCase())
    );
    if (byKey) return byKey;
  }

  return fetchedData.find((f) => {
    const apiName = f.tradingSymbol?.toLowerCase() || '';
    const searchName = symbol.title.toLowerCase();
    return apiName.includes(searchName);
  });
};

function fmt(n: number) {
  if (!isFinite(n)) return '-';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const SectoralIndices: React.FC = () => {
  const [indices, setIndices] = useState<IndexModel[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const chartCache = useRef<Map<string, number[]>>(new Map());
  const isMounted = useRef(true);
  
  // Guard against overlapping requests
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    // Safety check: Don't start a new fetch if one is already running
    if (isFetching.current && !isManualRefresh) {
        return;
    }

    try {
      isFetching.current = true;
      const hasData = chartCache.current.size > 0;

      if (!isManualRefresh && !hasData && isMounted.current) {
        setLoading(true);
      }

      // 1. Fetch main indices list
      const fetched = await fetchAngelIndices();
      
      if (!isMounted.current) return;

      /* REMOVED: The "backfill" logic block has been removed.
         Fetching quotes for missing index tokens often causes 400 Errors 
         because the Quote API expects Equity tokens, not Index tokens.
      */

      const mapped: IndexModel[] = SECTORAL_SYMBOLS.map((s) => {
        const q = findMarketData(fetched, s);

        if (!q) {
           // Fallback: Try to keep existing data if available
           const cachedChart = chartCache.current.get(s.token) || [];
           const oldIndex = indices?.find(i => i.id === s.id);
           if(oldIndex) return oldIndex;

          return {
            ...s,
            price: '-',
            currency: 'INR',
            change: '-',
            percentChange: '-',
            up: false,
            chart: cachedChart,
          };
        }

        const currentLTP = Number(q.ltp ?? q.close ?? 0);
        const netChange = Number(q.netChange);
        const up = netChange >= 0;
        const price = fmt(currentLTP);
        const change = netChange > 0 ? `+${netChange.toFixed(2)}` : netChange.toFixed(2);
        const percentChange = `${Math.abs(Number(q.percentChange)).toFixed(2)}%`;

        // Chart Logic
        let chartData = chartCache.current.get(s.token);
        if (!chartData || chartData.length === 0) {
          chartData = generateInitialGraph(q);
          chartCache.current.set(s.token, chartData);
        } else {
          const updatedChart = [...chartData];
          updatedChart[updatedChart.length - 1] = currentLTP;
          chartCache.current.set(s.token, updatedChart);
          chartData = updatedChart;
        }

        return {
          ...s,
          exchange: q.exchange || s.exchange,
          price,
          currency: 'INR',
          change,
          percentChange,
          up,
          chart: chartData,
        };
      });

      if (isMounted.current) {
        setIndices(mapped);
      }
    } catch (err: any) {
      console.warn('Sectoral Indices fetch failed:', err.message || 'Unknown');
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [indices]);

  // Initial Load & Polling
  useEffect(() => {
    fetchData(); 

    const intervalId = setInterval(() => {
      fetchData();
    }, 3000); // 3 seconds safer polling

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, { flex: 3 }]}>Index</Text>
      <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>Trend</Text>
      <Text style={[styles.headerText, { flex: 2, textAlign: 'right' }]}>Price</Text>
      <Text style={[styles.headerText, { flex: 2, textAlign: 'right' }]}>Chg %</Text>
    </View>
  );

  const renderItem = ({ item }: { item: IndexModel }) => (
    <View style={styles.row}>
      <View style={styles.nameCol}>
        <Text style={styles.symbolTitle}>{item.title}</Text>
        <Text style={styles.exchangeText}>{item.exchange}</Text>
      </View>

      <View style={styles.chartCol}>
        <Sparkline data={item.chart} up={item.up} />
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>

      <View style={styles.changeCol}>
        <Text style={[styles.changeText, item.up ? styles.textUp : styles.textDown]}>
          {item.percentChange}
        </Text>
        <Text style={[styles.subChangeText, item.up ? styles.textUp : styles.textDown]}>
          {item.change}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sectoral Indices</Text>

      {loading && !indices ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#334155" />
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {renderHeader()}
          <FlatList
            data={indices}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#0f172a',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  // Columns
  nameCol: { flex: 3 },
  chartCol: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  priceCol: { flex: 2, alignItems: 'flex-end' },
  changeCol: { flex: 2, alignItems: 'flex-end' },

  // Text Styles
  symbolTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  exchangeText: { fontSize: 10, fontWeight: '500', color: '#94a3b8', marginTop: 2 },
  priceText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  changeText: { fontSize: 13, fontWeight: '700' },
  subChangeText: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  textUp: { color: '#22c55e' },
  textDown: { color: '#ef4444' },
});

export default SectoralIndices;
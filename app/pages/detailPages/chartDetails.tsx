// app/pages/detailPages/chartDetails.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack as ExpoStack } from 'expo-router';
import { LineChart } from 'react-native-wagmi-charts'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OtherPagesInc from '@/components/includes/otherPagesInc';

import { 
  fetchAngelHistory, 
  findEquityToken 
} from '../../../services/api/methods/marketService';

const screenWidth = Dimensions.get('window').width;
const THEME_COLOR = '#0a7ea4';

// Added new timeframes
type TimeRange = '5M' | '1H' | '1D' | '1W' | '1M' | '6M';

interface ChartDataPoint {
  timestamp: number;
  value: number;
}

interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
//   volume: number;
}

export default function ChartDetails() {
  const params = useLocalSearchParams();
  
  const { symbol, token, price, change, percent } = params;

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCV | null>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>('1D');
  const [resolvedToken, setResolvedToken] = useState<string | null>((token as string) || null);

  const currentPrice = parseFloat(price as string) || 0;
  const netChange = parseFloat(change as string) || 0;
  const percentChange = parseFloat(percent as string) || 0;
  const isUp = percentChange >= 0;

  const trendColor = isUp ? '#10B981' : '#EF4444';

  const formatDateForApi = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const loadChartData = useCallback(async (range: TimeRange, targetToken: string) => {
    setLoading(true);
    try {
      const toDate = new Date();
      const fromDate = new Date();
      let interval = 'ONE_DAY';

      // Map timeframes to API intervals and lookback periods
      switch (range) {
        case '5M':
          fromDate.setDate(toDate.getDate() - 1); // Last 1 Day
          interval = 'FIVE_MINUTE';
          break;
        case '1H':
          fromDate.setDate(toDate.getDate() - 5); // Last 5 Days
          interval = 'ONE_HOUR';
          break;
        case '1D':
          fromDate.setDate(toDate.getDate() - 1); // Intraday/1 Day
          interval = 'FIVE_MINUTE'; 
          break;
        case '1W':
          fromDate.setDate(toDate.getDate() - 7); // Last 1 Week
          interval = 'ONE_HOUR';
          break;
        case '1M':
          fromDate.setMonth(toDate.getMonth() - 1); // Last 1 Month
          interval = 'ONE_DAY';
          break;
        case '6M':
          fromDate.setMonth(toDate.getMonth() - 6); // Last 6 Months
          interval = 'ONE_DAY';
          break;
      }

      const historyParams = {
        symbolToken: targetToken,
        exchange: 'NSE' as const,
        interval,
        from: formatDateForApi(fromDate),
        to: formatDateForApi(toDate),
      };

      const candles = await fetchAngelHistory(historyParams);

      if (candles && Array.isArray(candles) && candles.length > 0) {
        // Extract latest OHLCV data from the last candle
        const latestCandle = candles[candles.length - 1];
        setOhlcv({
          open: Number(latestCandle.open) || 0,
          high: Number(latestCandle.high) || 0,
          low: Number(latestCandle.low) || 0,
          close: Number(latestCandle.close) || 0,
        //   volume: Number(latestCandle.volume) || 0,
        });

        const formattedData: ChartDataPoint[] = candles.map((c: any) => {
          const rawTime = c.time || c.date || c.timestamp || '';
          const timestamp = rawTime ? new Date(rawTime).getTime() : Date.now();
          
          return {
            timestamp,
            value: Number(c.close) || 0,
          };
        });

        if (formattedData.length > 1) {
          setChartData(formattedData);
        } else {
          setChartData([]);
        }
      } else {
        setChartData([]);
        setOhlcv(null);
      }
    } catch (error) {
      console.error('Failed to load chart data', error);
      setChartData([]);
      setOhlcv(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      let activeToken = resolvedToken;
      
      if (!activeToken && symbol) {
        const tokenData = await findEquityToken(symbol as string);
        if (tokenData?.token) {
          activeToken = tokenData.token;
          setResolvedToken(activeToken);
        }
      }

      if (activeToken) {
        loadChartData(activeRange, activeToken);
      } else {
        setLoading(false); 
      }
    };

    initializeData();
  }, [symbol, resolvedToken, activeRange, loadChartData]);

  const renderTimeFilters = () => {
    const ranges: TimeRange[] = ['5M', '1H', '1D', '1W', '1M', '6M'];
    return (
      <View style={styles.filterContainer}>
        {ranges.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterBtn, activeRange === r && styles.activeFilterBtn]}
            onPress={() => setActiveRange(r)}
          >
            <Text style={[styles.filterText, activeRange === r && styles.activeFilterText]}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOHLCV = () => {
    if (!ohlcv) return null;
    
    const formatStat = (val: number) => 
      val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatVol = (val: number) => {
      if (val >= 10000000) return `${(val / 10000000).toFixed(2)}Cr`;
      if (val >= 100000) return `${(val / 100000).toFixed(2)}L`;
      if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
      return val.toString();
    };

    return (
      <View style={styles.ohlcvContainer}>
        <View style={styles.ohlcvRow}>
          <View style={styles.ohlcvItem}>
            <Text style={styles.ohlcvLabel}>Open</Text>
            <Text style={styles.ohlcvValue}>₹{formatStat(ohlcv.open)}</Text>
          </View>
          <View style={styles.ohlcvItem}>
            <Text style={styles.ohlcvLabel}>High</Text>
            <Text style={styles.ohlcvValue}>₹{formatStat(ohlcv.high)}</Text>
          </View>
          <View style={styles.ohlcvItem}>
            <Text style={styles.ohlcvLabel}>Low</Text>
            <Text style={styles.ohlcvValue}>₹{formatStat(ohlcv.low)}</Text>
          </View>
        </View>
        <View style={styles.ohlcvRow}>
          <View style={styles.ohlcvItem}>
            <Text style={styles.ohlcvLabel}>Close</Text>
            <Text style={styles.ohlcvValue}>₹{formatStat(ohlcv.close)}</Text>
          </View>
         
          <View style={styles.ohlcvItem}>
             {/* Empty view for grid alignment */}
          </View>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OtherPagesInc>
        <ExpoStack.Screen options={{ headerShown: false }} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{symbol || 'Unknown Symbol'}</Text>
              <Text style={styles.meta}>NSE Equity</Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.changeText, isUp ? styles.textUp : styles.textDown]}>
                {netChange > 0 ? '+' : ''}{netChange.toFixed(2)} ({isUp ? '+' : ''}{Math.abs(percentChange).toFixed(2)}%)
              </Text>
            </View>

            {renderOHLCV()}

            {renderTimeFilters()}
            
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={THEME_COLOR} />
                <Text style={styles.loadingText}>Loading Chart Data...</Text>
              </View>
            ) : chartData.length > 0 ? (
              <View style={styles.chartWrapper}>
                <LineChart.Provider data={chartData}>
                  <LineChart height={280} width={screenWidth - 48}>
                    <LineChart.Path color={trendColor} width={2.5}>
                      <LineChart.Gradient color={trendColor} />
                    </LineChart.Path>
                    <LineChart.CursorCrosshair color={trendColor}>
                      <LineChart.Tooltip 
                        textStyle={styles.tooltipText}
                        style={styles.tooltipBox}
                      />
                    </LineChart.CursorCrosshair>
                  </LineChart>
                </LineChart.Provider>
              </View>
            ) : (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>No chart data available for this range.</Text>
              </View>
            )}

            <Text style={styles.footerNote}>
              Data is provided for informational purposes only and may be delayed.
            </Text>
          </View>
        </ScrollView>
      </OtherPagesInc>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    minHeight: 500,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    marginBottom:12,
  },
  priceText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  textUp: { color: '#10B981' }, 
  textDown: { color: '#EF4444' }, 

  ohlcvContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ohlcvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  ohlcvItem: {
    flex: 1,
  },
  ohlcvLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  ohlcvValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  
  filterContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  filterBtn: { 
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8, 
    borderRadius: 8,
  },
  activeFilterBtn: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, 
    shadowRadius: 4, 
    elevation: 2 
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#6B7280' 
  },
  activeFilterText: { 
    color: '#111827' 
  },

  chartWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  tooltipBox: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingBox: { 
    height: 280, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: '#6B7280', 
    fontWeight: '600' 
  },
  footerNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
});
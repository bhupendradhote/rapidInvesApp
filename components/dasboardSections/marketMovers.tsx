// components/MarketMovers.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { fetchGainersLosers, AngelGainerLoserRaw } from '../../services/api/methods/marketService';

type TabOption = 'gainers' | 'losers';

const MarketMovers: React.FC = () => {
  const [gainers, setGainers] = useState<AngelGainerLoserRaw[]>([]);
  const [losers, setLosers] = useState<AngelGainerLoserRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabOption>('gainers');

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Robust parser for percentChange values that may be number or strings like "1.23%", "+1.23", "-2.5"
  const parsePercent = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    const cleaned = String(val).replace(/[^\d.\-+]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseNetChange = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    const cleaned = String(val).replace(/[^\d.\-+]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const safeArrayFromResponse = (resp: any): AngelGainerLoserRaw[] => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (resp.gainers && Array.isArray(resp.gainers)) return resp.gainers;
    if (resp.losers && Array.isArray(resp.losers)) return resp.losers;
    if (resp.data && Array.isArray(resp.data)) return resp.data;
    return [];
  };

  const loadData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground && isMounted.current) setLoading(true);

      const resp = await fetchGainersLosers();

      if (!isMounted.current) return;

      // Normalize to combined array
      let combined: any[] = [];
      if (Array.isArray(resp)) combined = resp;
      else if (resp && typeof resp === 'object') {
        if (Array.isArray((resp as any).gainers) || Array.isArray((resp as any).losers)) {
          const g = Array.isArray((resp as any).gainers) ? (resp as any).gainers : [];
          const l = Array.isArray((resp as any).losers) ? (resp as any).losers : [];
          combined = [...g, ...l];
        } else if (Array.isArray((resp as any).data)) {
          combined = (resp as any).data;
        } else {
          combined = safeArrayFromResponse(resp);
        }
      }

      if (!combined || combined.length === 0) {
        if (isMounted.current) {
          setGainers([]);
          setLosers([]);
        }
        return;
      }

      // Normalize numeric values for robust sorting
      const normalized = combined.map((item: any) => {
        const percent = parsePercent(item.percentChange ?? item.percent ?? 0);
        const net = parseNetChange(item.netChange ?? item.change ?? 0);
        return { raw: item, __percent: percent, __net: net };
      });

      // Gainers: percent > 0, sorted descending
      const sortedGainers = normalized
        .filter((it) => Number(it.__percent) > 0)
        .sort((a, b) => b.__percent - a.__percent)
        .slice(0, 10)
        .map((it) => it.raw as AngelGainerLoserRaw);

      // Losers: percent < 0, sorted ascending (most negative first)
      const sortedLosers = normalized
        .filter((it) => Number(it.__percent) < 0)
        .sort((a, b) => a.__percent - b.__percent)
        .slice(0, 10)
        .map((it) => it.raw as AngelGainerLoserRaw);

      if (isMounted.current) {
        setGainers(sortedGainers);
        setLosers(sortedLosers);
      }
    } catch (error) {
      console.error('Failed to load movers', error);
      if (isMounted.current) {
        setGainers((prev) => (prev.length ? prev : []));
        setLosers((prev) => (prev.length ? prev : []));
      }
    } finally {
      if (isMounted.current && !isBackground) {
        setLoading(false);
      }
    }
  }, []);

  // Initial Load + 5 Second Interval
  useEffect(() => {
    loadData(false);

    const intervalId = setInterval(() => {
      loadData(true); // silent update
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadData]);

  const fmtPrice = (price: number | string | undefined) => {
    const n = typeof price === 'number' ? price : parseFloat(String(price ?? '0')) || 0;
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatSymbol = (rawSymbol?: string) => {
    if (!rawSymbol) return '-';
    const match = rawSymbol.match(/^[^\d]+/);
    return (match && match[0].trim()) || rawSymbol;
  };

  const renderItem = ({ item, index }: { item: AngelGainerLoserRaw; index: number }) => {
    const percent = parsePercent((item as any).percentChange ?? (item as any).percent ?? 0);
    const net = parseNetChange((item as any).netChange ?? (item as any).change ?? 0);
    const isUp = percent >= 0;
    const sign = isUp ? '+' : '';
    const colorStyle = isUp ? styles.textUp : styles.textDown;
    const currentList = activeTab === 'gainers' ? gainers : losers;

    const displayName = formatSymbol((item as any).tradingSymbol ?? (item as any).name ?? '');

    return (
      <View style={styles.rowWrapper}>
        <View style={styles.moverRow}>
          <View style={styles.nameCol}>
            <Text style={styles.moverTitle} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.moverSubtitle}>NSE</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.moverPrice}>{fmtPrice((item as any).ltp ?? (item as any).last ?? 0)}</Text>
            <Text style={[styles.moverChange, colorStyle]}>
              {net.toFixed(2)} ({sign}{Math.abs(percent).toFixed(2)}%)
            </Text>
          </View>
        </View>
        {index < currentList.length - 1 && <View style={styles.separator} />}
      </View>
    );
  };

  const listData = activeTab === 'gainers' ? gainers : losers;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Market Movers</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {/* Tab Header */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'gainers' && styles.activeTab]}
            onPress={() => setActiveTab('gainers')}
          >
            <Text style={[styles.tabText, activeTab === 'gainers' ? styles.activeTabText : styles.inactiveTabText]}>
              Top Gainers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'losers' && styles.activeTab]}
            onPress={() => setActiveTab('losers')}
          >
            <Text style={[styles.tabText, activeTab === 'losers' ? styles.activeTabText : styles.inactiveTabText]}>
              Top Losers
            </Text>
          </TouchableOpacity>
        </View>

        {loading && listData.length === 0 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#334155" />
          </View>
        ) : (
          <FlatList
            data={listData}
            extraData={activeTab}
            keyExtractor={(item, index) => `${(item as any).symbolToken ?? (item as any).tradingSymbol ?? index}-${activeTab}`}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'gainers' ? 'No Gainers Found' : 'No Losers Found'}
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => loadData(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 16, marginBottom: 20 },
  centerLoading: { height: 150, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  liveBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#15803d' },
  cardContainer: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 4, elevation: 2 },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, margin: 8, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  tabText: { fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#0f172a', fontWeight: '700' },
  inactiveTabText: { color: '#64748b' },

  // List Rows
  rowWrapper: { paddingHorizontal: 12 },
  moverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  nameCol: { flex: 1 },
  priceCol: { alignItems: 'flex-end' },
  moverTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  moverSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  moverPrice: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  moverChange: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  textUp: { color: '#22c55e' },
  textDown: { color: '#ef4444' },
  separator: { height: 1, backgroundColor: '#f1f5f9' },

  // Empty/Footer
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  viewAllBtn: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 14, alignItems: 'center', backgroundColor: '#fafbfc' },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },
});

export default MarketMovers;

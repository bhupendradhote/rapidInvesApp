import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Search from '@/components/includes/search';
import customerProfileServices from '@/services/api/methods/profileService';

const { width } = Dimensions.get('window');

// --- Types ---
interface MarketCallData {
  id: number | string;
  title: string;
  date: string;
  time: string;
  ltp: string;
  change: string;
  changePercent: string;
  potential: string;
  sl: string;
  entry: string;
  target: string;
  status: string;
  isLocked?: boolean;
  action: 'BUY' | 'SELL';
  tags: string[];
}

// Added 'All' so users aren't locked out of unmapped API segments
const TABS = ['All', 'Intraday', 'Short', 'Long', 'Options', 'Futures'];



// --- Sub-Components ---

const TradeRange = ({ isBuy, isLocked }: { isBuy: boolean; isLocked?: boolean }) => {
  if (isLocked) return null;
  const color = isBuy ? '#10b981' : '#ef4444'; 
  
  return (
    <View style={styles.rangeContainer}>
      <View style={styles.rangeLineBase} />
      <View style={[styles.rangeLineActive, { backgroundColor: color, width: '60%', left: '20%' }]} />
      <View style={[styles.rangeDot, { left: '0%', backgroundColor: '#ef4444' }]} /> 
      <View style={[styles.rangeDot, { left: '20%', backgroundColor: '#f59e0b' }]} /> 
      <View style={[styles.rangeDotRing, { left: '80%', borderColor: color }]}>
        <View style={[styles.rangeDotInner, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

// --- Memoized Card Component ---
interface MarketCardProps {
  data: MarketCallData;
  onPress?: () => void;
  onUpgrade?: () => void;
  style?: object;
}

const MarketCard = React.memo<MarketCardProps>(function MarketCard({ 
  data, 
  onPress, 
  onUpgrade,
  style
}) {
  const isLocked = data.isLocked || false;
  const isBuy = data.action === 'BUY';
  const actionColor = isBuy ? '#10b981' : '#ef4444';
  const actionBg = isBuy ? '#ecfdf5' : '#fef2f2';

  const handlePress = () => {
    if (isLocked && onUpgrade) onUpgrade();
    else if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handlePress}
      style={[styles.card, style]}
    >
      {/* --- PREMIUM LOCK OVERLAY --- */}
      {isLocked && (
        <View style={styles.lockedOverlay}>
          <View style={styles.lockIconContainer}>
             <Ionicons name="lock-closed" size={22} color="#0a7ea4" />
          </View>
          <Text style={styles.lockTitle}>Premium Trade</Text>
          <Text style={styles.lockSubtitle}>Unlock Entry, Target & SL</Text>
          
          <TouchableOpacity onPress={onUpgrade} activeOpacity={0.8}>
             <LinearGradient
                colors={['#0a7ea4', '#0ca5d8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unlockBtn}
              >
              <Text style={styles.unlockBtnText}>Unlock Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* --- CARD CONTENT --- */}
      <View style={[styles.cardContent, isLocked && styles.blurredContent]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconPlaceholder, { backgroundColor: isBuy ? '#dcfce7' : '#fee2e2' }]}>
               <Text style={[styles.iconText, { color: actionColor }]}>{data.title.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.stockTitle} numberOfLines={1}>{data.title}</Text>
              <Text style={styles.dateText}>{data.date} • {data.time}</Text>
            </View>
          </View>
          
          <View style={[styles.actionBadge, { backgroundColor: actionBg }]}>
            <Text style={[styles.actionText, { color: actionColor }]}>{data.action}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.midSection}>
          <View style={styles.ltpContainer}>
             <Text style={styles.labelLtp}>LTP</Text>
             <Text style={[styles.valueLtp, { color: '#0f172a' }]}>{data.ltp}</Text>
             <Text style={[styles.changeText, { color: isBuy ? '#10b981' : '#ef4444' }]}>
               {data.change} {data.changePercent}
             </Text>
          </View>
          
          <View style={styles.rangeWrapper}>
             <TradeRange isBuy={isBuy} isLocked={isLocked} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
             <Text style={styles.statLabel}>Stop Loss</Text>
             <Text style={[styles.statValue, { color: '#ef4444' }]}>{data.sl}</Text>
          </View>
          
          <View style={[styles.statItem, styles.statBorder]}>
             <Text style={styles.statLabel}>Entry</Text>
             <Text style={[styles.statValue, { color: '#f59e0b' }]}>{data.entry}</Text>
          </View>
          
          <View style={styles.statItem}>
             <Text style={styles.statLabel}>Target</Text>
             <Text style={[styles.statValue, { color: '#10b981' }]}>{data.target}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// --- Main Screen Component ---
const MarketCalls = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const [marketCalls, setMarketCalls] = useState<MarketCallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Fetch Logic ---
  const fetchMarketCalls = async () => {
    try {
      const response: any = await customerProfileServices.getAllProfiles();
      const userData = response?.data?.user || response?.user || {};
      const apiTips = userData.tips || [];

      const formattedCalls: MarketCallData[] = apiTips.map((tip: any) => {
        const entry = parseFloat(tip.entry_price || '0');
        const target = parseFloat(tip.target_price || '0');
        const sl = parseFloat(tip.stop_loss || '0');
        const ltp = parseFloat(tip.current_price || tip.cmp_price || '0');
        
        const isBuy = target >= entry;

        const dateObj = new Date(tip.created_at || new Date());
        const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const isLocked = tip.is_premium || tip.status === 'Premium' || false;

        // Smart Tag Extraction: Attempt to read segment/type from API, fallback to Intraday
        const rawSegment = tip.segment || tip.call_type || tip.type || 'Intraday';
        const formattedSegment = rawSegment.charAt(0).toUpperCase() + rawSegment.slice(1).toLowerCase();

        return {
          id: tip.id,
          title: tip.symbol || tip.stock_name || 'UNKNOWN',
          date: date,
          time: time,
          ltp: isLocked ? '****' : ltp.toFixed(2),
          change: isLocked ? '****' : (ltp - entry).toFixed(2),
          changePercent: isLocked ? '(****)' : `(${((ltp - entry) / entry * 100).toFixed(2)}%)`,
          potential: 'High',
          sl: isLocked ? '****' : '₹' + sl.toFixed(2),
          entry: isLocked ? '****' : '₹' + entry.toFixed(2),
          target: isLocked ? '****' : '₹' + target.toFixed(2),
          status: tip.status || 'Live',
          isLocked: isLocked,
          action: isBuy ? 'BUY' : 'SELL',
          tags: isLocked ? ['Premium', formattedSegment] : [formattedSegment]
        };
      });

      const combined = [...formattedCalls.reverse()];
      const uniqueCalls = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      setMarketCalls(uniqueCalls);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMarketCalls(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchMarketCalls(); };
  const handleUpgrade = () => router.push('/pages/settingsInnerPages/pricingPlans');
  
  // --- Filtering Logic (Search + Tabs combined) ---
  const filteredCalls = useMemo(() => {
    return marketCalls.filter(item => {
      // 1. Search filter
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      
      // 2. Tab filter
      const matchesTab = activeTab === 'All' || item.tags.some(tag => tag.toLowerCase() === activeTab.toLowerCase());
      
      return matchesSearch && matchesTab;
    });
  }, [marketCalls, search, activeTab]);

  // Highlights pull from the filtered pool
  const highlights = useMemo(() => filteredCalls.slice(0, 5), [filteredCalls]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        
        {/* --- STICKY HEADER (Prevents Search Focus Loss) --- */}
        <View style={styles.stickyHeader}>
          <View style={styles.searchContainer}>
            <Search value={search} onChangeText={setSearch} />
          </View>

          <View style={styles.tabsSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Market Feed</Text>
            </View>
            <FlatList
              horizontal
              data={TABS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabList}
              renderItem={({ item }) => {
                const isActive = activeTab === item;
                return (
                  <TouchableOpacity
                    onPress={() => setActiveTab(item)}
                    style={[styles.tabPill, isActive && styles.tabPillActive]}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>

        {/* --- MAIN SCROLLABLE FEED --- */}
        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => `call-${item.id}`}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <MarketCard
                data={item}
                onUpgrade={handleUpgrade}
              />
            </View>
          )}
          // Highlights scroll away naturally with the feed
          ListHeaderComponent={
            highlights.length > 0 ? (
              <View style={styles.highlightsSection}>
                <View style={styles.sectionHeader}>
                   <Text style={styles.sectionTitle}>Featured Calls</Text>
                </View>
                <FlatList
                  horizontal
                  data={highlights}
                  keyExtractor={(item) => `highlight-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  snapToInterval={width * 0.82 + 16}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <MarketCard
                      data={item}
                      style={{ width: width * 0.82, marginRight: 16 }}
                      onUpgrade={handleUpgrade}
                    />
                  )}
                />
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5"/>}
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active calls found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, paddingTop: 15 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  /* Sticky Header Areas */
  stickyHeader: {
    backgroundColor: '#F8FAFC',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10,
  },
  searchContainer: { paddingHorizontal: 1, paddingVertical: 12 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 12
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  highlightsSection: { marginBottom: 24, marginTop: 10 },
  
  /* Tabs */
  tabsSection: { marginBottom: 4 },
  tabList: { paddingHorizontal: 16 },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  /* --- CARD STYLES --- */
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#64748b',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 18,
  },
  blurredContent: {
    opacity: 0.1, 
  },

  /* Card Header */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 18, fontWeight: '800' },
  stockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
    maxWidth: 160,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },

  /* Middle: LTP & Range */
  midSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ltpContainer: { flex: 1 },
  labelLtp: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  valueLtp: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  
  /* Range Visual */
  rangeWrapper: {
    width: '45%',
    height: 40,
    justifyContent: 'center',
  },
  rangeContainer: {
    height: 20,
    justifyContent: 'center',
  },
  rangeLineBase: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  rangeLineActive: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  rangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 7,
  },
  rangeDotRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    position: 'absolute',
    top: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  rangeDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Locked State Overlay */
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockTitle: { fontSize: 16, fontWeight: '800', color: '#1e1b4b', marginBottom: 4 },
  lockSubtitle: { fontSize: 12, color: '#00000077', fontWeight: '400', marginBottom: 16 },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  unlockBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});

export default MarketCalls;
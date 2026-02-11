import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import customerProfileServices from '@/services/api/methods/profileService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;
const CARD_HEIGHT = 210;

// --- Types ---
interface HighlightItem {
  id: string | number;
  action: string;
  tags: string[];
  title: string;
  date: string;
  ltp: string;
  change: string;
  changePercent: string;
  sl: string;
  entry: string;
  target: string;
  isBuy: boolean;
  isLocked?: boolean;
}

// --- Dummy Data ---
const LOCKED_HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'locked-1',
    action: 'BUY',
    tags: ['Premium', 'Jackpot'],
    title: 'BANKNIFTY 45000 CE',
    date: 'Today • 09:15 AM',
    ltp: '000.00',
    change: '0.00',
    changePercent: '0.00%',
    sl: '000',
    entry: '000',
    target: '000',
    isBuy: true,
    isLocked: true,
  },
  {
    id: 'locked-2',
    action: 'SELL',
    tags: ['Intraday', 'Sure Shot'],
    title: 'RELIANCE',
    date: 'Today • 10:30 AM',
    ltp: '000.00',
    change: '0.00',
    changePercent: '0.00%',
    sl: '000',
    entry: '000',
    target: '000',
    isBuy: false,
    isLocked: true,
  },
];

// --- Sub-Components ---

const TradeRange = ({ isBuy, isLocked }: { isBuy: boolean; isLocked?: boolean }) => {
  if (isLocked) return null;
  const color = isBuy ? '#10b981' : '#ef4444'; // Emerald vs Red
  
  return (
    <View style={styles.rangeContainer}>
      {/* Background Line */}
      <View style={styles.rangeLineBase} />
      
      {/* Active Range (Simulated for UI) */}
      <View style={[styles.rangeLineActive, { backgroundColor: color, width: '60%', left: '20%' }]} />
      
      {/* Dots */}
      <View style={[styles.rangeDot, { left: '0%', backgroundColor: '#ef4444' }]} /> 
      <View style={[styles.rangeDot, { left: '20%', backgroundColor: '#f59e0b' }]} /> 
      <View style={[styles.rangeDotRing, { left: '80%', borderColor: color }]}>
        <View style={[styles.rangeDotInner, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

const HighlightCard = ({ item, onUpgrade }: { item: HighlightItem; onUpgrade: () => void }) => {
  const isBuy = item.isBuy;
  const isLocked = item.isLocked;
  const actionColor = isBuy ? '#10b981' : '#ef4444';
  const actionBg = isBuy ? '#ecfdf5' : '#fef2f2';

  const handlePress = () => {
    if (isLocked) onUpgrade();
    else {
      // router.push...
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handlePress}
      style={styles.card}
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
        
        {/* Header: Badge & Title */}
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconPlaceholder, { backgroundColor: isBuy ? '#dcfce7' : '#fee2e2' }]}>
               <Text style={[styles.iconText, { color: actionColor }]}>{item.title.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.stockTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </View>
          
          <View style={[styles.actionBadge, { backgroundColor: actionBg }]}>
            <Text style={[styles.actionText, { color: actionColor }]}>{item.action}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Middle: LTP & Range */}
        <View style={styles.midSection}>
          <View style={styles.ltpContainer}>
             <Text style={styles.labelLtp}>LTP</Text>
             <Text style={[styles.valueLtp, { color: isBuy ? '#0f172a' : '#0f172a' }]}>{item.ltp}</Text>
             <Text style={[styles.changeText, { color: isBuy ? '#10b981' : '#ef4444' }]}>
               {item.change} {item.changePercent}
             </Text>
          </View>
          
          <View style={styles.rangeWrapper}>
             <TradeRange isBuy={isBuy} isLocked={isLocked} />
          </View>
        </View>

        {/* Bottom: Stats Grid */}
        <View style={styles.statsGrid}>
          {/* STOP LOSS */}
          <View style={styles.statItem}>
             <Text style={styles.statLabel}>Stop Loss</Text>
             <Text style={[styles.statValue, { color: '#ef4444' }]}>{item.sl}</Text>
          </View>
          
          {/* ENTRY */}
          <View style={[styles.statItem, styles.statBorder]}>
             <Text style={styles.statLabel}>Entry</Text>
             <Text style={[styles.statValue, { color: '#f59e0b' }]}>{item.entry}</Text>
          </View>
          
          {/* TARGET */}
          <View style={styles.statItem}>
             <Text style={styles.statLabel}>Target</Text>
             <Text style={[styles.statValue, { color: '#10b981' }]}>{item.target}</Text>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
};

export default function TodaysMarketHighlights() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketHighlights = async () => {
    try {
      const response: any = await customerProfileServices.getAllProfiles();
      const userData = response?.data?.user || response?.user || {};
      const apiTips = userData.tips || [];

      if (!apiTips || apiTips.length === 0) {
        setHighlights(LOCKED_HIGHLIGHTS);
        return;
      }

      const formattedCalls: HighlightItem[] = apiTips.map((tip: any) => {
        const entry = parseFloat(tip.entry_price || '0');
        const target = parseFloat(tip.target_price || '0');
        const sl = parseFloat(tip.stop_loss || '0');
        const ltp = parseFloat(tip.current_price || tip.cmp_price || '0');
        const isBuy = target >= entry;
        const isLocked = tip.is_premium || tip.status === 'Premium' || false;

        return {
          id: tip.id,
          action: isBuy ? 'BUY' : 'SELL',
          isBuy: isBuy,
          isLocked: isLocked,
          tags: isLocked ? ['Premium'] : ['Intraday'],
          title: tip.symbol || tip.stock_name || 'UNKNOWN',
          date: 'Today', 
          ltp: isLocked ? '****' : ltp.toFixed(2),
          change: isLocked ? '****' : (ltp - entry).toFixed(2),
          changePercent: isLocked ? '(****)' : `(${((ltp - entry) / entry * 100).toFixed(2)}%)`,
          sl: isLocked ? '****' : '₹' + sl.toFixed(2),
          entry: isLocked ? '****' : '₹' + entry.toFixed(2),
          target: isLocked ? '****' : '₹' + target.toFixed(2),
        };
      });

      setHighlights(formattedCalls.reverse().slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch highlights", error);
      setHighlights(LOCKED_HIGHLIGHTS);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMarketHighlights();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
           <Text style={styles.title}>Todays Highlights</Text>
           <Text style={styles.subtitle}>Top performing calls</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/market-calls')}>
           <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 16}
        >
          {highlights.map((item) => (
            <HighlightCard 
              key={item.id} 
              item={item} 
              onUpgrade={() => router.push('/pages/settingsInnerPages/pricingPlans')} 
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  viewAll: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  loader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  // --- CARD STYLES ---
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginRight: 16,
    // Soft Shadow
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
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  blurredContent: {
    opacity: 0.1, // Fade out content when locked
  },

  // --- LOCKED STATE ---
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)', // Glassy white overlay
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
  lockTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  lockSubtitle: {
    fontSize: 12,
    color: '#0f0f1073',
    fontWeight: '400',
    marginBottom: 16,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  unlockBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  // --- HEADER ---
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
  iconText: {
    fontSize: 18,
    fontWeight: '800',
  },
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

  // --- MID SECTION (LTP) ---
  midSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ltpContainer: {
    flex: 1,
  },
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
  
  // --- RANGE VISUAL ---
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

  // --- STATS GRID ---
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
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

import notificationServices from '@/services/api/methods/notificationService';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');

// --- Types ---
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']); // ← Dynamic categories
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to normalize type → nice tab label (keeps your original grouping logic)
  const getCategoryLabel = (type: string): string => {
    const t = (type || '').toLowerCase().trim();
    if (t.includes('trading') || t.includes('buy') || t.includes('sell')) return 'Trading';
    if (t.includes('system') || t.includes('payment') || t.includes('alert') || t.includes('transaction')) return 'System';
    if (t.includes('offer') || t.includes('promo') || t.includes('discount')) return 'Offers';
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Other';
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Auto-reset activeTab when categories change (e.g. after refresh with different data)
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeTab)) {
      setActiveTab('All');
    }
  }, [categories]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationServices.getAllNotifications();
      
      let dataList = [];
      if (Array.isArray(response)) {
        dataList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        dataList = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        dataList = response.data.data;
      } else if (response?.notifications && Array.isArray(response.notifications)) {
        dataList = response.notifications;
      }

      const mappedNotifications: NotificationItem[] = dataList.map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(),
        type: item.type?.toLowerCase() || item.category?.toLowerCase() || 'system',
        title: item.title || item.subject || 'New Notification',
        message: item.message || item.body || item.description || '',
        time: item.created_at || item.createdAt 
            ? new Date(item.created_at || item.createdAt).toLocaleDateString() 
            : 'Recently',
        read: item.is_read || item.read || item.status === 'read' || false,
      }));

      setNotifications(mappedNotifications);

      // === DYNAMIC CATEGORIES (this is what you asked for) ===
      const catSet = new Set(mappedNotifications.map(item => getCategoryLabel(item.type)));
      let catList = Array.from(catSet);

      // Preferred order like your original tabs
      const preferredOrder = ['Trading', 'System', 'Offers', 'Other'];
      catList.sort((a, b) => {
        const ia = preferredOrder.indexOf(a);
        const ib = preferredOrder.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      setCategories(['All', ...catList]);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Updated filtering – now uses the same getCategoryLabel (much cleaner)
  const getFilteredData = () => {
    if (activeTab === 'All') return notifications;
    return notifications.filter(n => getCategoryLabel(n.type) === activeTab);
  };

  const markAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await notificationServices.markAllRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Could not mark notifications as read.');
      fetchNotifications(); 
    }
  };

  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || target.read) return;

    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await notificationServices.userMarkRead([id]);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      fetchNotifications(); 
    }
  };

  // --- Render Helpers (no changes needed) ---
  const getIcon = (type: string) => {
    if (type.includes('trading_buy') || type.includes('buy')) return <Feather name="trending-up" size={20} color="#059669" />;
    if (type.includes('trading_sell') || type.includes('sell')) return <Feather name="trending-down" size={20} color="#DC2626" />;
    if (type.includes('payment') || type.includes('transaction')) return <MaterialIcons name="payment" size={20} color="#0284C7" />;
    if (type.includes('system') || type.includes('alert')) return <Feather name="shield" size={20} color="#7C3AED" />;
    if (type.includes('offer') || type.includes('promo')) return <MaterialCommunityIcons name="tag-outline" size={20} color="#D97706" />;
    return <Feather name="bell" size={20} color="#6B7280" />;
  };

  const getIconBg = (type: string) => {
    if (type.includes('trading_buy') || type.includes('buy')) return '#ECFDF5';
    if (type.includes('trading_sell') || type.includes('sell')) return '#FEF2F2';
    if (type.includes('payment') || type.includes('transaction')) return '#E0F2FE';
    if (type.includes('system') || type.includes('alert')) return '#F3E8FF';
    if (type.includes('offer') || type.includes('promo')) return '#FFFBEB';
    return '#F3F4F6';
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[styles.card, !item.read && styles.unreadCard]} 
      activeOpacity={0.7}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.cardRow}>
        <View style={[styles.iconBox, { backgroundColor: getIconBg(item.type) }]}>
          {getIcon(item.type)}
        </View>

        <View style={styles.contentBox}>
          <View style={styles.headerRow}>
            <Text style={[styles.cardTitle, !item.read && styles.unreadText]}>
                {item.title}
            </Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          
          <Text style={styles.messageText} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
            <Feather name="check-circle" size={16} color={THEME_COLOR} />
            <Text style={styles.markReadText}>Read All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {categories.map((tab) => (   // ← Now fully dynamic!
            <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab}
                </Text>
            </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      ) : (
        <FlatList
          data={getFilteredData()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Feather name="bell-off" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySub}>You are all caught up! Check back later.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 35,
    paddingBottom: 15,
    backgroundColor: BG_COLOR,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  markReadText: {
    fontSize: 13,
    color: THEME_COLOR,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: THEME_COLOR,
    borderColor: THEME_COLOR,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 10,
    paddingTop: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF', 
    borderColor: '#BAE6FD',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentBox: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    paddingRight: 8,
  },
  unreadText: {
    color: '#111827',
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLOR,
    marginLeft: 8,
    marginTop: 6,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
  },
});
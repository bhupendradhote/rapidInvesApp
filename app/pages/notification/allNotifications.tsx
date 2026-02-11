import React, { useState } from 'react';
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
} from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');

// --- Types ---
type NotificationType = 'trading_buy' | 'trading_sell' | 'system' | 'offer' | 'payment';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// --- Mock Data ---
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'trading_buy',
    title: 'Buy Alert: TATASTEEL',
    message: 'Target 150 achieved. Book partial profit now.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'payment',
    title: 'Subscription Successful',
    message: 'Your payment of ₹2,499 for Premium Plan was successful.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'trading_sell',
    title: 'Stop Loss Hit: RELIANCE',
    message: 'Market turning bearish. Exit position at 2400.',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'KYC Verified',
    message: 'Your documents have been approved. You can now start trading.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '5',
    type: 'offer',
    title: '20% Off Renewal',
    message: 'Renew your plan before 10th Feb and save flat 20%.',
    time: '2 days ago',
    read: true,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // --- Logic ---
  const getFilteredData = () => {
    if (activeTab === 'All') return notifications;
    if (activeTab === 'Trading') return notifications.filter(n => n.type.includes('trading'));
    if (activeTab === 'System') return notifications.filter(n => ['system', 'payment'].includes(n.type));
    if (activeTab === 'Offers') return notifications.filter(n => n.type === 'offer');
    return notifications;
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
  };

  // --- Render Helpers ---
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'trading_buy': return <Feather name="trending-up" size={20} color="#059669" />;
      case 'trading_sell': return <Feather name="trending-down" size={20} color="#DC2626" />;
      case 'payment': return <MaterialIcons name="payment" size={20} color="#0284C7" />;
      case 'system': return <Feather name="shield" size={20} color="#7C3AED" />;
      case 'offer': return <MaterialCommunityIcons name="tag-outline" size={20} color="#D97706" />;
      default: return <Feather name="bell" size={20} color="#6B7280" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'trading_buy': return '#ECFDF5';
      case 'trading_sell': return '#FEF2F2';
      case 'payment': return '#E0F2FE';
      case 'system': return '#F3E8FF';
      case 'offer': return '#FFFBEB';
      default: return '#F3F4F6';
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[styles.card, !item.read && styles.unreadCard]} 
      activeOpacity={0.7}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.cardRow}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: getIconBg(item.type) }]}>
          {getIcon(item.type)}
        </View>

        {/* Content */}
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

        {/* Unread Indicator */}
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- Header --- */}
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

      {/* --- Filter Tabs --- */}
      <View style={styles.tabsContainer}>
        {['All', 'Trading', 'System', 'Offers'].map((tab) => (
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

      {/* --- List --- */}
      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
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
    backgroundColor: '#F0F9FF', // Very light teal/blue tint
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
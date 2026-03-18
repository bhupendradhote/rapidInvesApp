import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  ListRenderItem,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';

import announcementServices from '@/services/api/methods/announcementService';

// --- Constants ---
const { width } = Dimensions.get('window');
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';

// --- Types ---
interface AnnouncementItem {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  tags: string[];
}

interface FilterItem {
  key: string;
  count: number;
}

export default function Announcements() {
  const router = useRouter();
  
  // --- State ---
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // --- API Integration ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // You can swap to getActiveAnnouncements() if you only want active ones
      const response = await announcementServices.getAllAnnouncements();
      
      // Safety check in case response is null/undefined
      if (response) {
        // Map API data to our local AnnouncementItem interface
        // Adjust these mappings based on your actual API response structure
        const mappedData: AnnouncementItem[] = response.map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          title: item.title || 'No Title',
          subtitle: item.subtitle || item.description || item.content || '',
          when: item.when || item.createdAt 
            ? new Date(item.createdAt).toLocaleDateString() 
            : 'Recently',
          tags: Array.isArray(item.tags) ? item.tags : (item.category ? [item.category] : ['Others']),
        }));
        setAnnouncements(mappedData);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return announcements.filter((d) => {
      if (selectedFilter === 'All') return true;
      // Case insensitive tag matching just in case
      return d.tags.some(tag => tag.toLowerCase() === selectedFilter.toLowerCase());
    }).filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.tags.join(' ').toLowerCase().includes(q)
      );
    });
  }, [search, selectedFilter, announcements]);

  // --- Counts ---
  const getCount = (key: string) => {
    if (key === 'All') return announcements.length;
    return announcements.filter((d) => 
      d.tags.some(tag => tag.toLowerCase() === key.toLowerCase())
    ).length;
  };

  const FILTERS: FilterItem[] = [
    { key: 'All', count: getCount('All') },
    { key: 'Features', count: getCount('Features') },
    { key: 'Service Update', count: getCount('Service Update') },
    { key: 'Others', count: getCount('Others') },
  ];

  // --- Renderers ---
  const renderChip = (item: FilterItem) => {
    const active = selectedFilter === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => setSelectedFilter(item.key)}
        activeOpacity={0.8}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {item.key}
        </Text>
        <View style={[styles.chipCountBadge, active ? {backgroundColor: 'rgba(255,255,255,0.2)'} : {backgroundColor: '#F3F4F6'}]}>
             <Text style={[styles.chipCountText, active ? {color: '#fff'} : {color: '#6B7280'}]}>{item.count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCard: ListRenderItem<AnnouncementItem> = ({ item }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/pages/detailPages/announcementDetails',
            params: {
              id: item.id,
              title: item.title,
              date: item.when,
              tag: item.tags[0] || 'Update' 
            }
          });
        }}
      >
        <View style={styles.cardHeader}>
            <View style={styles.tagRow}>
                {item.tags.map((t, index) => {
                    const isNew = t.toLowerCase() === 'new';
                    return (
                        <View key={index} style={[styles.tagBadge, isNew ? styles.tagNew : styles.tagStandard]}>
                            <Text style={[styles.tagText, isNew ? styles.tagTextNew : styles.tagTextStandard]}>{t}</Text>
                        </View>
                    );
                })}
            </View>
            <Text style={styles.dateText}>{item.when}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text numberOfLines={2} style={styles.cardSubtitle}>
          {item.subtitle}
        </Text>

        <View style={styles.cardFooter}>
            <Text style={styles.readMoreText}>Read Details</Text>
            <Feather name="arrow-right" size={16} color={THEME_COLOR} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Tabs.Screen
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="campaign" size={size ?? 26} color={color} />
          ),
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
        
        <View style={styles.container}>
            
            {/* Header / Search */}
            <View style={styles.headerContainer}>
                <Text style={styles.pageTitle}>Updates Feed</Text>
                
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Feather name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                        <TextInput
                            placeholder="Search updates..."
                            placeholderTextColor="#9CA3AF"
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            returnKeyType="search"
                        />
                    </View>
                    {/* Timeframe Button (Mock) */}
                    <TouchableOpacity style={styles.filterBtn}>
                         <Ionicons name="filter" size={20} color="#4B5563" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.chipsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                >
                    {FILTERS.map((filter) => renderChip(filter))}
                </ScrollView>
            </View>

            {/* Main Content Area */}
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={THEME_COLOR} />
              </View>
            ) : (
              <FlatList
                  data={filteredData}
                  keyExtractor={(i) => i.id}
                  renderItem={renderCard}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={40} color="#D1D5DB" />
                        <Text style={styles.emptyText}>
                          {search ? "No matching announcements." : "No announcements found."}
                        </Text>
                    </View>
                  }
              />
            )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  container: {
    flex: 1,
    paddingTop: 15,

  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  headerContainer: {
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: BG_COLOR,
  },
  pageTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
  },
  searchRow: {
      flexDirection: 'row',
      gap: 12,
  },
  searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 46,
  },
  searchInput: {
      flex: 1,
      fontSize: 14,
      color: '#1F2937',
  },
  filterBtn: {
      width: 46,
      height: 46,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
  },

  // Chips
  chipsWrapper: {
      marginBottom: 10,
  },
  chipsScroll: {
      paddingHorizontal: 10,
      paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: THEME_COLOR,
    borderColor: THEME_COLOR,
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 6,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipCountBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
  },
  chipCountText: {
      fontSize: 11,
      fontWeight: '700',
  },

  // List
  listContent: {
      paddingHorizontal: 10,
      paddingBottom: 100,
  },
  
  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  tagRow: {
      flexDirection: 'row',
      gap: 6,
  },
  tagBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
  },
  tagNew: {
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
  },
  tagStandard: {
      backgroundColor: '#EFF6FF',
      borderColor: '#BFDBFE',
  },
  tagText: {
      fontSize: 11,
      fontWeight: '600',
  },
  tagTextNew: {
      color: '#059669',
  },
  tagTextStandard: {
      color: '#2563EB',
  },
  dateText: {
      fontSize: 12,
      color: '#9CA3AF',
      fontWeight: '500',
  },
  
  cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 6,
  },
  cardSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: 16,
  },
  
  cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  readMoreText: {
      fontSize: 13,
      fontWeight: '600',
      color: THEME_COLOR,
      marginRight: 4,
  },

  // Empty
  emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 60,
  },
  emptyText: {
      marginTop: 12,
      color: '#9CA3AF',
      fontSize: 14,
  },
});
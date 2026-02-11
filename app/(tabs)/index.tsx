import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ScrollView,
  RefreshControl, 
} from 'react-native';

import Header from '@/components/includes/header';
import Sidebar from '@/components/includes/sidebar';
import Indices from '@/components/dasboardSections/indices';
import SectoralIndices from '@/components/dasboardSections/sectoralIndices';
import MarketMovers from '@/components/dasboardSections/marketMovers';
import TodaysMarketHighlights from '@/components/dasboardSections/todaysMarketHighlights'; // 2. Import new component
import Search from '@/components/includes/search';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false); // 3. State for refresh

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Sidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          // 5. Attach RefreshControl here
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

          <Header
            onMenuPress={() => setIsSidebarOpen(true)}
          />

          
          {/* <Search value={search} onChangeText={setSearch} /> */}
          
          <Indices />

          <TodaysMarketHighlights />

          <SectoralIndices />

          <MarketMovers />

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
});
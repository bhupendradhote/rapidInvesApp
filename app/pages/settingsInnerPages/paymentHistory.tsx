import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import OtherPagesInc from '@/components/includes/otherPagesInc';

import subscriptionService from '@/services/api/methods/subscriptionService';

interface Transaction {
  id: string;
  invoiceId: number; // Keep track of the actual ID for API calls if needed
  date: string;
  plan: string;
  amount: string;
  status: 'Success' | 'Failed' | 'Pending';
  invoiceUrl?: string;
}

export default function PaymentHistory() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await subscriptionService.getInvoices();

      let dataList = [];
      if (Array.isArray(response)) {
        dataList = response;
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        dataList = (response as any).data;
      } else if ((response as any)?.data?.data && Array.isArray((response as any).data.data)) {
        dataList = (response as any).data.data;
      }

      const mappedData: Transaction[] = dataList.map((item: any) => {
        let formattedDate = 'Recently';
        if (item.created_at) {
            const d = new Date(item.created_at);
            formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        let mappedStatus: 'Success' | 'Failed' | 'Pending' = 'Success'; 
        const rawStatus = (item.status || '').toLowerCase();
        if (rawStatus === 'failed' || rawStatus === 'error') mappedStatus = 'Failed';
        if (rawStatus === 'pending') mappedStatus = 'Pending';

        return {
          id: item.invoice_no || `INV-${item.id}`,
          invoiceId: item.id,
          date: formattedDate,
          plan: item.plan_name || 'Subscription Plan', 
          amount: item.amount ? `₹${item.amount}` : '₹0',
          status: mappedStatus,
          invoiceUrl: item.download_url || null,
        };
      });

      setTransactions(mappedData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      Alert.alert('Error', 'Could not load payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleDownloadInvoice = async (item: Transaction) => {
    if (item.invoiceUrl) {
      Linking.openURL(item.invoiceUrl).catch(() => {
        Alert.alert('Error', 'Could not open the invoice link.');
      });
      return;
    }

    setDownloadingId(item.invoiceId);
    try {
      const blob = await subscriptionService.downloadInvoice(item.invoiceId);
      Alert.alert('Success', 'Invoice downloaded. Check your files.');
      console.log('Blob received:', blob);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Failed to download the invoice.');
    } finally {
      setDownloadingId(null);
    }
  };

  // --- Renderers ---
  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.infoCol}>
          <Text style={styles.planText}>{item.plan}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.idText}>ID: {item.id}</Text>
        </View>

        <View style={styles.statusCol}>
          <Text style={styles.amountText}>{item.amount}</Text>
          <View style={[
            styles.badge, 
            item.status === 'Success' ? styles.badgeSuccess : 
            item.status === 'Failed' ? styles.badgeFailed : styles.badgePending
          ]}>
            <Text style={[
              styles.badgeText,
              item.status === 'Success' ? styles.textSuccess : 
              item.status === 'Failed' ? styles.textFailed : styles.textPending
            ]}>{item.status}</Text>
          </View>
        </View>
      </View>

      {item.status === 'Success' && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity 
            style={[styles.downloadRow, (!item.invoiceUrl && downloadingId !== item.invoiceId) && styles.downloadRowDisabled]} 
            activeOpacity={0.6}
            onPress={() => handleDownloadInvoice(item)}
            disabled={downloadingId === item.invoiceId}
          >
            {downloadingId === item.invoiceId ? (
              <ActivityIndicator size="small" color="#005BC1" style={{ marginRight: 8 }} />
            ) : (
              <Feather name="download" size={16} color="#005BC1" />
            )}
            <Text style={styles.downloadText}>
              {downloadingId === item.invoiceId ? "Downloading..." : "Download Invoice"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#005BC1" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => item.id + index}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#005BC1"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Feather name="file-text" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Transactions</Text>
                <Text style={styles.emptySub}>You haven&#39;t made any payments yet.</Text>
            </View>
          }
        />
      )}
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
  },
  planText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  idText: {
    fontSize: 12,
    color: '#999',
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: { backgroundColor: '#ECFDF5' },
  badgeFailed: { backgroundColor: '#FEF2F2' },
  badgePending: { backgroundColor: '#FFFBEB' },
  
  badgeText: { fontSize: 11, fontWeight: '600' },
  textSuccess: { color: '#059669' },
  textFailed: { color: '#DC2626' },
  textPending: { color: '#D97706' },

  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  downloadRowDisabled: {
    opacity: 0.6,
  },
  downloadText: {
    fontSize: 13,
    color: '#005BC1',
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
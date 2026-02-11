import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import OtherPagesInc from '@/components/includes/otherPagesInc';

interface Transaction {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: 'Success' | 'Failed' | 'Pending';
  invoiceUrl?: string;
}

const transactions: Transaction[] = [
  { id: 'INV-2025-001', date: '12 Sep 2025', plan: 'Premium (3 Months)', amount: '₹2,499', status: 'Success' },
  { id: 'INV-2025-002', date: '12 Jun 2025', plan: 'Premium (3 Months)', amount: '₹2,499', status: 'Success' },
  { id: 'INV-2025-003', date: '10 Jun 2025', plan: 'Premium (3 Months)', amount: '₹2,499', status: 'Failed' },
  { id: 'INV-2024-004', date: '12 Mar 2025', plan: 'Standard (1 Month)', amount: '₹999', status: 'Success' },
];

export default function PaymentHistory() {
  const router = useRouter();

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

      <View style={styles.divider} />

      <TouchableOpacity style={styles.downloadRow} activeOpacity={0.6}>
        <Feather name="download" size={16} color="#005BC1" />
        <Text style={styles.downloadText}>Download Invoice</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
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
  },
  downloadText: {
    fontSize: 13,
    color: '#005BC1',
    fontWeight: '500',
    marginLeft: 8,
  },
});
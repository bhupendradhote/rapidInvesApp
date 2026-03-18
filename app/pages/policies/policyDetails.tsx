import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import policyService, { Policy } from '@/services/api/methods/policyServices';

const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';

// Extend the imported Policy type to include the missing properties.
// This satisfies TypeScript without requiring changes to the external service file.
export type ExtendedPolicy = Policy & {
  active_content?: {
    content?: string;
    updated_at?: string;
  };
  content?: string;
  description?: string;
  title?: string;
  name?: string;
  updated_at?: string;
  created_at?: string;
};

const stripHtmlTags = (htmlString?: string) => {
  if (!htmlString) return '';
  return htmlString
    .replace(/<li>/g, '• ') 
    .replace(/<\/li>/g, '\n') 
    .replace(/<\/p>/g, '\n\n') 
    .replace(/<br\s*[\/]?>/gi, '\n') 
    .replace(/<\/h[1-6]>/g, '\n\n') 
    .replace(/<[^>]+>/g, '') 
    .replace(/&nbsp;/g, ' ') 
    .replace(/\n\s*\n/g, '\n\n') 
    .trim();
};

const PolicyDetails = () => {
  const router = useRouter();
  
  const { slug, id } = useLocalSearchParams<{ slug?: string; id?: string }>();
  
  const identifier = slug || id;

  // Use the ExtendedPolicy type here
  const [policy, setPolicy] = useState<ExtendedPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
    let mounted = true;

    const fetchPolicy = async () => {
      if (!identifier) {
        if (mounted) {
          setError('Policy identifier is missing');
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) setLoading(true);
        
        const response = await policyService.getPolicyDetails(identifier);
 
        // FIX: Cast response to 'any' to bypass TS strictness on the nested API wrapper,
        // then enforce the ExtendedPolicy type on the final extracted object.
        const rawResponse = response as any;
        const policyData = (rawResponse?.data?.data || rawResponse?.data || rawResponse) as ExtendedPolicy;

        if (!policyData || !policyData.name) {
          throw new Error('No policy data received');
        }

        if (mounted) {
          setPolicy(policyData);
          setError(null);
        }
      } catch (err: any) {
        console.error('Failed to load policy:', err?.message || err);
        if (mounted) setError('Unable to load policy details. Please try again later.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPolicy();

    return () => {
      mounted = false;
    };
  }, [identifier]);

  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const title = policy?.title || policy?.name || 'Policy Details';
  
  const rawContent = policy?.active_content?.content || policy?.content || policy?.description || 'No content available.';
  const displayContent = stripHtmlTags(rawContent);

  const lastUpdated = getFormattedDate(policy?.active_content?.updated_at || policy?.updated_at || policy?.created_at);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={styles.loadingText}>Loading policy...</Text>
      </SafeAreaView>
    );
  }

  if (error || !policy) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{String(error || 'Policy not found')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policy</Text>
        <View style={styles.balanceView} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.policyTitle}>{String(title)}</Text>
          <Text style={styles.dateText}>Last updated: {String(lastUpdated)}</Text>
          <View style={styles.divider} />
          <Text style={styles.policyContent}>{String(displayContent)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG_COLOR, gap: 16 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginVertical: 16, lineHeight: 24 },
  retryButton: { marginTop: 12, backgroundColor: THEME_COLOR, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backIcon: { padding: 8 },
  headerTitle: { fontSize: 19, fontWeight: '700', color: '#111827' },
  balanceView: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  policyTitle: { fontSize: 24, fontWeight: '700', color: '#111827', lineHeight: 32, marginBottom: 8 },
  dateText: { fontSize: 13.5, color: '#6B7280', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  policyContent: { fontSize: 15.5, lineHeight: 26, color: '#374151' },
});

export default PolicyDetails;
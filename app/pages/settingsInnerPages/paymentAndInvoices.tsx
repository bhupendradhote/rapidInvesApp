import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import customerProfileServices from '@/services/api/methods/profileService';
import OtherPagesInc from '@/components/includes/otherPagesInc';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';

export default function PaymentAndInvoices() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [planName, setPlanName] = useState('Free Tier');

  // --- Helpers ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 32) return '1 Month';
    if (diffDays < 95) return '3 Months';
    if (diffDays > 360) return '1 Year';
    return `${diffDays} Days`;
  };

  const getDaysRemaining = (end: string) => {
    if (!end) return 0;
    const endDate = new Date(end);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // --- Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const fetchSubscriptionDetails = async () => {
      try {
        const response: any = await customerProfileServices.getAllProfiles();
        if (mounted) {
          const user = response?.user ?? response?.data?.user ?? {};
          const subData = user.subscription;
          
          if (subData) {
            setSubscription(subData);
            if (user.plan?.name) {
              setPlanName(user.plan.name);
            } else if (subData.status === 'active') {
              setPlanName('Standard Plan');
            } else {
              setPlanName('Free Tier');
            }
          }
        }
      } catch (err) {
        console.warn('Payment details fetch error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSubscriptionDetails();
    return () => { mounted = false; };
  }, []);

  // --- Derived State ---
  const isActive = subscription?.status === 'active';
  const validityStart = subscription?.start_date;
  const validityEnd = subscription?.end_date;
  
  const durationLabel = isActive && validityStart && validityEnd 
    ? calculateDuration(validityStart, validityEnd) 
    : 'N/A';

  const daysRemaining = isActive ? getDaysRemaining(validityEnd) : 0;
  
  const formattedStart = formatDate(validityStart);
  const formattedEnd = formatDate(validityEnd);
  
  const statusColor = isActive ? '#10B981' : '#6B7280';
  const statusText = isActive ? 'Active' : (subscription?.status || 'Inactive');

  if (loading) {
    return (
      <OtherPagesInc>
         <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      </OtherPagesInc>
    );
  }

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Payment & Invoices</Text>
            <Text style={styles.pageSubtitle}>
            Manage your subscription plan, download invoices, and view payment history.
            </Text>
        </View>

        {/* --- Main Subscription Card --- */}
        <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
                <View style={styles.iconContainer}>
                    <Feather name="package" size={24} color="#fff" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.planNameLabel}>Current Plan</Text>
                    <Text style={styles.planNameValue}>{planName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#F3F4F6' }]}>
                    <Text style={[styles.statusText, { color: isActive ? '#15803D' : '#374151' }]}>
                        {statusText.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Plan Duration</Text>
                    <Text style={styles.statValue}>{durationLabel}</Text>
                </View>
                {isActive && (
                    <>
                    <View style={styles.verticalDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Days Left</Text>
                        <Text style={[styles.statValue, { color: daysRemaining < 7 ? '#EF4444' : THEME_COLOR }]}>
                            {daysRemaining} Days
                        </Text>
                    </View>
                    </>
                )}
            </View>

            {isActive && (
                <View style={styles.datesContainer}>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateLabel}>Start Date</Text>
                        <Text style={styles.dateValue}>{formattedStart}</Text>
                    </View>
                    <Feather name="arrow-right" size={16} color="#9CA3AF" />
                    <View style={[styles.dateBox, { alignItems: 'flex-end' }]}>
                        <Text style={styles.dateLabel}>End Date</Text>
                        <Text style={styles.dateValue}>{formattedEnd}</Text>
                    </View>
                </View>
            )}

            {/* --- Action Buttons --- */}
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={styles.primaryBtn}
                    onPress={() => router.push('/pages/settingsInnerPages/pricingPlans')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryBtnText}>
                        {isActive ? "Upgrade Plan" : "Buy Subscription"}
                    </Text>
                    <Feather name="zap" size={16} color="#fff" style={{marginLeft: 8}} />
                </TouchableOpacity>

                {isActive && (
                     <TouchableOpacity 
                        style={styles.secondaryBtn}
                        onPress={() => router.push('/pages/settingsInnerPages/pricingPlans')}
                    >
                        <Text style={styles.secondaryBtnText}>Renew</Text>
                     </TouchableOpacity>
                )}
            </View>
        </View>

        {/* --- Alert Section (If Expiring) --- */}
        {isActive && daysRemaining < 7 && (
            <View style={styles.alertBox}>
                <Feather name="alert-circle" size={20} color="#B91C1C" />
                <View style={{marginLeft: 10, flex: 1}}>
                    <Text style={styles.alertTitle}>Plan Expiring Soon</Text>
                    <Text style={styles.alertDesc}>Your subscription ends on {formattedEnd}. Renew now to avoid interruption.</Text>
                </View>
            </View>
        )}

        {/* --- Menu Links --- */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History & Legal</Text>
        </View>

        <View style={styles.menuContainer}>
            <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/pages/settingsInnerPages/paymentHistory')}
            >
                <View style={styles.menuIconBox}>
                    <Feather name="clock" size={20} color="#4B5563" />
                </View>
                <Text style={styles.menuText}>Payment History & Invoices</Text>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/pages/settingsInnerPages/legalDisclaimer')}
            >
                <View style={styles.menuIconBox}>
                    <Feather name="shield" size={20} color="#4B5563" />
                </View>
                <Text style={styles.menuText}>Legal Disclaimer</Text>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </View>

      </ScrollView>
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 40,
  },
  
  // Header
  headerContainer: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Card
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  planNameLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  planNameValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Dates
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  dateBox: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },

  // Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },

  // Alert
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },

  // Menu List
  sectionHeader: {
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 56, // Align with text start
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
});
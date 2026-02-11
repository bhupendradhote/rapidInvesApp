// app/PricingPlans.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import pricingServices from '@/services/api/methods/pricingServices';
import subscriptionService from '@/services/api/methods/subscriptionService';
import OtherPagesInc from '@/components/includes/otherPagesInc';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');

/* ---------------- Types ---------------- */

interface ApiFeature {
  id?: number | string;
  svg_icon?: string | null;
  text?: string | null;
}

interface ApiDuration {
  id?: number | string;
  duration: string;
  price: number | string;
  features?: ApiFeature[];
}

interface ApiServicePlan {
  id: number | string;
  name: string;
  tagline?: string | null;
  featured?: number | boolean;
  status?: number | boolean;
  sort_order?: number;
  button_text?: string | null;
  durations?: ApiDuration[];
}

interface UIPricingDuration {
  id: number | string;
  label: string;
  price: number | string;
  priceText: string;
  features: ApiFeature[];
}

interface UIPricingPlan {
  id: string;
  title: string;
  subtitle?: string;
  isRecommended?: boolean;
  buttonText?: string;
  durations: UIPricingDuration[];
}

/* ---------------- PlanCard Component ---------------- */

const PlanCard = ({
  plan,
  onPurchase,
  loadingPlanId,
}: {
  plan: UIPricingPlan;
  onPurchase: (planId: string, durationIndex: number) => void;
  loadingPlanId: string | null;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const durations = plan.durations ?? [];
  const activeDuration = durations[selectedIndex] ?? durations[0] ?? null;

  return (
    <View style={[styles.cardContainer, plan.isRecommended && styles.cardContainerRecommended]}>
      {plan.isRecommended && (
        <View style={styles.recommendedBanner}>
          <MaterialIcons name="star" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.recommendedText}>Most Popular</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
        </View>

        {/* Duration Tabs */}
        {durations.length > 0 && (
          <View style={styles.durationTabsContainer}>
            {durations.map((d, idx) => {
              const isActive = selectedIndex === idx;
              return (
                <TouchableOpacity
                  key={`${plan.id}-dur-${idx}`}
                  activeOpacity={0.7}
                  onPress={() => setSelectedIndex(idx)}
                  style={[styles.durationTab, isActive && styles.durationTabActive]}
                >
                  <Text style={[styles.durationTabText, isActive && styles.durationTabTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Price Display */}
        <View style={styles.priceContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.priceValue}>
             {activeDuration ? String(activeDuration.price) : '0'}
          </Text>
          <Text style={styles.pricePeriod}>/{activeDuration?.label?.toLowerCase().replace('ly', '') || 'period'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Features List */}
        <View style={styles.featuresList}>
          {(activeDuration?.features ?? []).map((feat, idx) => (
            <View key={`${plan.id}-feat-${idx}`} style={styles.featureRow}>
              <View style={styles.checkIconBg}>
                <Feather name="check" size={12} color="#fff" />
              </View>
              <Text style={styles.featureText}>{feat.text ?? '—'}</Text>
              {/* If SVG icon is text based like "10 calls", show it as a badge */}
              {feat.svg_icon ? (
                  <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>{feat.svg_icon}</Text>
                  </View>
              ) : null}
            </View>
          ))}

          {(activeDuration?.features ?? []).length === 0 && (
            <Text style={styles.noFeaturesText}>Standard features included</Text>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.purchaseBtn, plan.isRecommended ? styles.purchaseBtnRecommended : styles.purchaseBtnStandard]}
          activeOpacity={0.8}
          onPress={() => onPurchase(plan.id, selectedIndex)}
          disabled={loadingPlanId !== null}
        >
          {loadingPlanId === plan.id ? (
            <ActivityIndicator color={plan.isRecommended ? "#fff" : THEME_COLOR} />
          ) : (
            <>
                <Text style={[styles.purchaseBtnText, !plan.isRecommended && {color: THEME_COLOR}]}>
                    {plan.buttonText || 'Choose Plan'}
                </Text>
                <Feather 
                    name="arrow-right" 
                    size={18} 
                    color={plan.isRecommended ? "#fff" : THEME_COLOR} 
                    style={{marginLeft: 8}} 
                />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ---------------- Main Screen ---------------- */

export default function PricingPlans() {
  const [plans, setPlans] = useState<UIPricingPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: any = await pricingServices.getAllPricingPlans();
        const resAny = response as any;
        let rawPlans: ApiServicePlan[] = [];

        if (Array.isArray(response)) rawPlans = response;
        else if (resAny && resAny.data && Array.isArray(resAny.data)) rawPlans = resAny.data;
        else rawPlans = [];

        const uiPlans: UIPricingPlan[] = rawPlans.map((p) => {
          const durations: UIPricingDuration[] = (p.durations ?? []).map((d) => {
            const priceRaw = d.price ?? '';
            return {
              id: d.id ?? '',
              label: d.duration ?? '—',
              price: d.price ?? '',
              priceText: typeof priceRaw === 'number' ? `₹${priceRaw}` : `${priceRaw ?? ''}`,
              features: d.features ?? [],
            };
          });

          return {
            id: String(p.id),
            title: p.name ?? 'Untitled Plan',
            subtitle: p.tagline ?? '',
            isRecommended: Boolean(p.featured),
            buttonText: p.button_text ?? 'Subscribe',
            durations: durations.length ? durations : [{ id: '', label: 'Default', price: '', priceText: '', features: [] }],
          };
        });

        if (mounted) setPlans(uiPlans);
      } catch (err: any) {
        console.warn('Error fetching plans:', err);
        if (mounted) setError(err?.message ?? 'Failed to load plans');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPlans();
    return () => { mounted = false; };
  }, []);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Coupon', 'Please enter a coupon code.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const svcAny = subscriptionService as any;
      if (typeof svcAny.validateCoupon === 'function') {
        const resp = await svcAny.validateCoupon({ coupon: code });
        if (resp?.success) {
          setAppliedCoupon(code);
          Keyboard.dismiss();
          Alert.alert('Success', `Coupon "${code}" applied successfully!`);
        } else {
          Alert.alert('Invalid Coupon', resp?.message ?? 'This coupon is not valid.');
        }
      } else {
        setAppliedCoupon(code);
        Keyboard.dismiss();
        Alert.alert('Coupon Applied', `Coupon "${code}" applied.`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Coupon validation failed';
      Alert.alert('Error', String(msg));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handlePurchase = async (planId: string, durationIndex: number) => {
    if (loadingPlanId) return;
    setLoadingPlanId(planId);

    try {
      const plan = plans.find((p) => p.id === planId);
      const duration = plan?.durations?.[durationIndex];

      if (!duration?.id) {
        Alert.alert('Error', 'Invalid plan configuration.');
        return;
      }

      const svcAny = subscriptionService as any;
      const initResp: any = await svcAny.initiateRazorpay(
        Number(planId),
        Number(duration.id),
        appliedCoupon ?? undefined
      );

      const finalCoupon = appliedCoupon ?? undefined;
      const checkoutUrl = initResp?.checkout_url ?? initResp?.payment_url ?? initResp?.redirect_url ?? initResp?.url;

      if (checkoutUrl) {
        const urlWithCoupon = finalCoupon && !checkoutUrl.includes('coupon=')
            ? `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}coupon=${encodeURIComponent(finalCoupon)}`
            : checkoutUrl;
        router.push(`/pages/subscription/RazorpayWebView?url=${encodeURIComponent(urlWithCoupon)}&coupon=${encodeURIComponent(finalCoupon ?? '')}`);
        return;
      }

      const order_id = initResp?.order_id ?? initResp?.razorpay_order_id;
      const key = initResp?.key ?? initResp?.razorpay_key ?? initResp?.key_id;
      const amount = initResp?.amount ?? initResp?.amount_in_paise ?? initResp?.value;
      const currency = initResp?.currency ?? 'INR';

      if (order_id && key) {
        const params = `order_id=${encodeURIComponent(String(order_id))}&key=${encodeURIComponent(String(key))}&amount=${encodeURIComponent(String(amount ?? ''))}&currency=${encodeURIComponent(String(currency ?? 'INR'))}${finalCoupon ? `&coupon=${encodeURIComponent(finalCoupon)}` : ''}`;
        router.push(`/pages/subscription/RazorpayWebView?${params}`);
        return;
      }

      Alert.alert('Payment', 'Could not initialize payment gateway.');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message ?? err?.message ?? 'Payment initiation failed';
      
      if (status === 422) {
          Alert.alert('Subscription Exists', String(msg));
      } else {
          Alert.alert('Error', String(msg));
      }
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <Text style={styles.headerSubtitle}>Select a subscription that best suits your trading needs.</Text>
        </View>

        {/* Coupon Input */}
        <View style={styles.couponContainer}>
          <View style={styles.couponIconBox}>
             <Feather name="tag" size={20} color={THEME_COLOR} />
          </View>
          <TextInput
            placeholder="Enter Discount Code"
            placeholderTextColor="#9CA3AF"
            value={couponInput}
            onChangeText={setCouponInput}
            autoCapitalize="characters"
            style={styles.couponInput}
            editable={!validatingCoupon}
          />
          <TouchableOpacity
            style={[styles.applyBtn, appliedCoupon ? { backgroundColor: '#EF4444' } : { backgroundColor: THEME_COLOR }]}
            onPress={appliedCoupon ? removeCoupon : applyCoupon}
            disabled={validatingCoupon}
          >
            {validatingCoupon ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.applyBtnText}>{appliedCoupon ? 'Remove' : 'Apply'}</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {appliedCoupon && (
            <View style={styles.successMessage}>
                <Feather name="check-circle" size={14} color="#059669" />
                <Text style={styles.successText}>Coupon "{appliedCoupon}" applied!</Text>
            </View>
        )}

        {/* Plans List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME_COLOR} />
            <Text style={{marginTop: 10, color: '#6B7280'}}>Loading plans...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => router.replace('/pages/settingsInnerPages/pricingPlans')}>
                <Text style={{color: THEME_COLOR, marginTop: 10, fontWeight: '600'}}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.infoText}>No subscription plans available at the moment.</Text>
          </View>
        ) : (
          <View style={styles.plansGrid}>
             {plans.map((plan) => (
                <PlanCard 
                    key={plan.id} 
                    plan={plan} 
                    onPurchase={handlePurchase} 
                    loadingPlanId={loadingPlanId} 
                />
             ))}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </OtherPagesInc>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: BG_COLOR,
    minHeight: '100%',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  headerContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Coupon
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  couponIconBox: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginRight: 10,
  },
  couponInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  successMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
  },
  successText: {
      color: '#059669',
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  infoText: {
      color: '#6B7280',
      fontSize: 14
  },

  // Plan Card
  plansGrid: {
      gap: 24,
  },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardContainerRecommended: {
    borderColor: THEME_COLOR,
    borderWidth: 1.5,
    transform: [{ scale: 1.01 }], // Slightly larger
  },
  recommendedBanner: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 24,
  },
  
  // Card Header
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Duration Tabs
  durationTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  durationTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  durationTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  durationTabTextActive: {
    color: THEME_COLOR,
    fontWeight: '700',
  },

  // Price
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },

  // Features
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981', // Green for checks always looks good
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  featureBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
  },
  featureBadgeText: {
      fontSize: 11,
      color: THEME_COLOR,
      fontWeight: '600',
  },
  noFeaturesText: {
      color: '#9CA3AF',
      fontSize: 13,
      textAlign: 'center', 
      fontStyle: 'italic',
  },

  // Purchase Button
  purchaseBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseBtnRecommended: {
    backgroundColor: THEME_COLOR,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseBtnStandard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  purchaseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
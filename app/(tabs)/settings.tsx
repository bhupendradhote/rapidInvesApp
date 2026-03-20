import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import customerProfileServices from '@/services/api/methods/profileService';
import policyService from '@/services/api/methods/policyServices';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');

// --- Types ---
interface MenuItem {
  id: number;
  icon: any;
  text: string;
  type: 'ionic' | 'material' | 'fontAwesome' | 'feather';
  color?: string;
  route?: string;
  isDestructive?: boolean;
}

const SettingsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [policyLoading, setPolicyLoading] = useState(true);

  // --- Helper: Get Last 4 Digits ---
  const getLast4Chars = (str: string | null | undefined, type: 'pan' | 'aadhar') => {
    if (!str || typeof str !== 'string' || str.length < 4) {
      return type === 'pan' ? '----------' : '---- ---- ----';
    }
    const last4 = str.slice(-4);
    return type === 'pan' ? `******${last4}` : `**** **** ${last4}`;
  };

  const getKycData = (user: any) => {
    const kycActions = user?.kyc?.raw_response?.actions;
    if (Array.isArray(kycActions)) {
      const digilockerData = kycActions.find((a: any) => a.type === 'digilocker');
      return digilockerData?.details || {};
    }
    return {};
  };

  // --- Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const response: any = await customerProfileServices.getAllProfiles();
        if (mounted) {
          const user = response?.user ?? response?.data?.user ?? {};
          setUserData(user);
        }
      } catch (err) {
        console.warn('Settings fetch error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchPolicies = async () => {
      try {
        const res = await policyService.getPolicies();
        const data = res?.data ?? res ?? [];
        if (mounted) setPolicies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn('Policies fetch error:', error);
      } finally {
        if (mounted) setPolicyLoading(false);
      }
    };

    fetchPolicies();
    return () => { mounted = false; };
  }, []);

  // --- Data Formatting Helpers ---
  const getFormattedDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  

  // --- Derived State ---
  const bsmrId = userData?.bsmr_id || '-';
  const userName = userData?.name || 'User';
  const userEmail = userData?.email || '-';
  const userPhone = userData?.phone || '-';
  const isEmailVerified = !!userData?.email_verified_at;

  const kycDetails = getKycData(userData);

  let profileImageSource = { uri: 'https://randomuser.me/api/portraits/men/32.jpg' };
  if (userData?.profile_image_url) {
    profileImageSource = { uri: userData.profile_image_url };
  } else if (kycDetails?.aadhaar?.profile_image_url) {
    profileImageSource = { uri: `data:image/jpeg;base64,${kycDetails.aadhaar.image}` };
  }

  const panMasked = getLast4Chars(userData?.pan_card || kycDetails?.pan?.id_number, 'pan');
  const aadharMasked = getLast4Chars(userData?.adhar_card || kycDetails?.aadhaar?.id_number, 'aadhar');

  const subscription = userData?.subscription;
  const hasActivePlan = subscription?.status === 'active';
  const planName = userData?.plan?.name || (hasActivePlan ? 'Standard Plan' : 'No Active Plan');
  const validityStart = getFormattedDate(subscription?.start_date);
  const validityEnd = getFormattedDate(subscription?.end_date);
  const kycStatus = userData?.kyc?.status || 'pending';
  const isKycVerified = kycStatus === 'verified' || kycStatus === 'approved';

  const menuItems: MenuItem[] = [
    // {
    //   id: 1,
    //   icon: 'credit-card',
    //   text: 'Payment & Invoices',
    //   type: 'feather',
    //   route: '/pages/settingsInnerPages/paymentAndInvoices',
    // },
    {
      id: 2,
      icon: 'file-text',
      text: 'KYC & Agreement',
      type: 'feather',
      route: '/pages/kyc/kycAgreement',
    },
    {
      id: 3,
      icon: 'help-circle',
      text: 'Support',
      type: 'feather',
      route: '/pages/support/SupportPage',
    },
     {
    id: 9,
    icon: 'trash-2',
    text: 'Delete Account',
    type: 'feather',
    color: '#EF4444',
    isDestructive: true,
  },
  ];

  const renderIcon = (item: MenuItem) => {
    const iconColor = item.color || '#4B5563';
    switch (item.type) {
      case 'ionic': return <Ionicons name={item.icon} size={20} color={iconColor} />;
      case 'material': return <MaterialIcons name={item.icon} size={20} color={iconColor} />;
      case 'fontAwesome': return <FontAwesome name={item.icon} size={18} color={iconColor} />;
      case 'feather': return <Feather name={item.icon} size={20} color={iconColor} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* --- Header & Profile Card --- */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Settings</Text>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image source={profileImageSource} style={styles.avatar} />
              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={() => router.push('/pages/profile/profileDetails')}
              >
                <Feather name="edit-2" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileId}>USER ID: {bsmrId}</Text>

            <View style={styles.emailChip}>
              <Text style={styles.emailText} numberOfLines={1}>
                {userEmail}
              </Text>
              {isEmailVerified ? <MaterialIcons name="verified" size={14} color={THEME_COLOR} style={{ marginLeft: 4 }} /> : null}
            </View>
          </View>
        </View>

        {/* --- Personal Details Grid --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Personal Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{userPhone}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PAN</Text>
                <Text style={styles.detailValue}>{panMasked}</Text>
              </View>
            </View>
            <View style={styles.horizontalDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Aadhar Number</Text>
                <Text style={styles.detailValue}>{aadharMasked}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email Status</Text>
                <Text
                  style={[styles.detailValue, { color: isEmailVerified ? '#10B981' : '#F59E0B' }]}
                >
                  {isEmailVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Subscription Plan --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Subscription</Text>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planIconBox}>
                <Feather name="box" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{planName}</Text>
                <Text style={styles.planStatus}>
                  Status:{' '}
                  <Text style={{ fontWeight: '700', color: hasActivePlan ? '#10B981' : '#6B7280' }}>
                    {hasActivePlan ? 'Active' : 'Inactive'}
                  </Text>
                </Text>
              </View>
              <View
                style={[
                  styles.kycBadge,
                  { backgroundColor: isKycVerified ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                <Text
                  style={[
                    styles.kycBadgeText,
                    { color: isKycVerified ? '#166534' : '#92400E' },
                  ]}
                >
                  KYC {kycStatus === 'verified' ? 'DONE' : 'PENDING'}
                </Text>
              </View>
            </View>

            <View style={styles.planDatesRow}>
              <View>
                <Text style={styles.dateLabel}>Starts</Text>
                <Text style={styles.dateValue}>{validityStart}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.dateLabel}>Ends</Text>
                <Text style={styles.dateValue}>{validityEnd}</Text>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              {/* <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push('/pages/settingsInnerPages/pricingPlans')}
              >
                <Text style={styles.primaryBtnText}>Upgrade Plan</Text>
              </TouchableOpacity> */}

              {!isKycVerified ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push('/pages/kyc/kycAgreement')}
                >
                  <Text style={styles.secondaryBtnText}>Complete KYC</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.disabledBtn}>
                  <Feather name="check" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                  <Text style={styles.disabledBtnText}>KYC Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* --- Preferences (Static + Dynamic Policies) --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.menuContainer}>
            {/* -------- STATIC LINKS -------- */}
            {menuItems.map((item) => (
  <TouchableOpacity
    key={`menu-${item.id}`}
    style={styles.menuRow}
    activeOpacity={0.7}
    onPress={() => {
      if (item.text === 'Delete Account') {
        handleDeleteAccount();
      } else if (item.route) {
        router.push(item.route as any);
      }
    }}
  >
    <View
      style={[
        styles.menuIconBox,
        { backgroundColor: item.isDestructive ? '#FEF2F2' : '#F3F4F6' },
      ]}
    >
      {renderIcon(item)}
    </View>

    <Text
      style={[
        styles.menuText,
        item.isDestructive && { color: '#EF4444', fontWeight: '600' }
      ]}
    >
      {item.text}
    </Text>

    <Feather name="chevron-right" size={20} color="#9CA3AF" />
  </TouchableOpacity>
))}
            {/* -------- DIVIDER (Fixed React Native text string crash) -------- */}
            {policies.length > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: '#E5E7EB',
                  marginVertical: 8,
                }}
              />
            ) : null}

            {/* -------- DYNAMIC POLICIES -------- */}
            {policyLoading ? (
              <ActivityIndicator size="small" color={THEME_COLOR} style={{ padding: 16 }} />
            ) : (
              policies.map((policy: any, index: number) => (
                <TouchableOpacity
                  key={`policy-${policy.id}`}
                  style={[
                    styles.menuRow,
                    index === policies.length - 1 ? { borderBottomWidth: 0 } : {},
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/pages/policies/policyDetails',
                      params: { id: policy.id, slug: policy.slug },
                    })
                  }
                >
                  <View style={styles.menuIconBox}>
                    <Feather name="file-text" size={20} color="#4B5563" />
                  </View>

                  <Text style={styles.menuText}>
                    {policy.title ?? policy.name ?? 'Policy'}
                  </Text>

                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const handleDeleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "Are you sure you want to delete your account?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Delete",
        style: "destructive",
        onPress: async () => {
          const url = "https://app.therapidinvestors.com/delete-account-request";
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            Alert.alert("Error", "Unable to open link");
          }
        }
      }
    ]
  );
};

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG_COLOR },
  container: { flex: 1, backgroundColor: BG_COLOR },
  scrollContent: { padding: 10, paddingTop: 15 },
  headerSection: { marginBottom: 24, alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', alignSelf: 'flex-start', marginBottom: 12 },
  profileCard: { width: '100%', backgroundColor: CARD_BG, borderRadius: 20, padding: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#F3F4F6' },
  editIconBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: THEME_COLOR, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  profileId: { fontSize: 13, color: '#6B7280', marginBottom: 10, fontWeight: '500' },
  emailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  emailText: { fontSize: 12, color: '#4B5563', fontWeight: '500', maxWidth: width * 0.5 },
  sectionContainer: { marginBottom: 24 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
  detailsCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1, paddingVertical: 8, paddingHorizontal: 4 },
  verticalDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  horizontalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  detailLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: '500', textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  planCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  planIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: THEME_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  planTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  planStatus: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  kycBadgeText: { fontSize: 10, fontWeight: '700' },
  planDatesRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 20 },
  dateLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  dateValue: { fontSize: 13, color: '#374151', fontWeight: '600' },
  actionButtonsContainer: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: THEME_COLOR, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: { flex: 1, backgroundColor: '#fff', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME_COLOR },
  secondaryBtnText: { color: THEME_COLOR, fontSize: 14, fontWeight: '600' },
  disabledBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  disabledBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  menuContainer: { backgroundColor: CARD_BG, borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#374151' },
  versionText: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 10 },
});

export default SettingsPage;
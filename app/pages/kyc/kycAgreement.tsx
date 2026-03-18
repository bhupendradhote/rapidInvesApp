// app/KycAgreementPage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import customerProfileServices from '@/services/api/methods/profileService';
import kycService from '@/services/api/methods/kycService';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');

export default function KycAgreementPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [userName, setUserName] = useState('');
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'verified' | 'rejected' | string>('pending');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const mountedRef = useRef(true);

  // ---------- Helpers ----------
  const isApproved = (s: string) => {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === 'approved' || v === 'verified';
  };

  const extractSignatureFromKyc = (kyc: any) => {
    if (!kyc) return null;
    const actions = kyc.raw_response?.actions;
    if (!Array.isArray(actions)) return null;

    const sigAction = actions.find((a: any) =>
      a?.type === 'signature' ||
      a?.action_ref?.includes?.('signature') ||
      (a?.type === 'image' && a?.rules_data?.strict_validation_types?.includes?.('signature'))
    );

    let rawImage: any = null;
    if (sigAction) {
      rawImage = sigAction.file ?? sigAction.details?.image ?? sigAction.output_image ?? null;
    }

    if (!rawImage) {
      const digilocker = actions.find((a: any) => a?.type === 'digilocker');
      rawImage = digilocker?.details?.aadhaar?.image ?? null;
    }

    if (!rawImage) return null;
    return typeof rawImage === 'string' && rawImage.startsWith('http') ? rawImage : `data:image/jpeg;base64,${rawImage}`;
  };

  const extractKycUrlFromProfile = (userObj: any): string | null => {
    const kyc = userObj?.kyc ?? userObj?.kyc_details ?? null;
    if (!kyc) return null;

    if (typeof kyc.kyc_url === 'string' && kyc.kyc_url) return kyc.kyc_url;
    if (typeof kyc.url === 'string' && kyc.url) return kyc.url;
    if (typeof kyc.document_id === 'string' && kyc.document_id) {
      return `https://app.digio.in/#/gateway/login/${kyc.document_id}`;
    }

    const raw = kyc.raw_response ?? null;
    if (raw) {
      if (typeof raw.kyc_url === 'string' && raw.kyc_url) return raw.kyc_url;
      if (typeof raw.redirect_url === 'string' && raw.redirect_url) return raw.redirect_url;
      const candidate = raw?.data?.document_id ?? raw?.data?.documentId ?? raw?.document_id;
      if (candidate) return `https://app.digio.in/#/gateway/login/${candidate}`;
    }

    return null;
  };

  // ---------- Profile fetch ----------
  const fetchProfile = useCallback(async () => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);

      const response: any = await customerProfileServices.getAllProfiles();
      if (!mountedRef.current) return;

      const user = response?.user ?? response?.data?.user ?? response ?? {};
      setUserName(user?.name ?? user?.full_name ?? 'User');

      const kyc = user?.kyc ?? user?.kyc_details ?? {};
      setKycStatus((kyc?.status ?? 'pending').toString());

      const sig = extractSignatureFromKyc(kyc);
      setSignatureImage(sig);
    } catch (err) {
      console.warn('KYC fetch error:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // ---------- Logic ----------
  const openKycInWebViewOrExternal = async (url: string) => {
    if (!url) return false;
    try {
      const encoded = encodeURIComponent(url);
      router.push(`/pages/kyc/KycWebView?url=${encoded}`);
      return true;
    } catch (err) {
      console.warn('router push failed, trying Linking.openURL', err);
      try {
        await Linking.openURL(url);
        return true;
      } catch (linkErr) {
        return false;
      }
    }
  };

  const findKycUrlFromFallbacks = async (): Promise<string | null> => {
    try {
      const resp: any = await customerProfileServices.getAllProfiles();
      const user = resp?.user ?? resp?.data?.user ?? resp ?? {};
      const fromProfile = extractKycUrlFromProfile(user);
      if (fromProfile) return fromProfile;
    } catch (e) { console.warn(e); }

    try {
      const statusResp: any = await kycService.getKycStatus();
      if (statusResp?.kyc_url) return statusResp.kyc_url;
      if (statusResp?.document_id) return `https://app.digio.in/#/gateway/login/${statusResp.document_id}`;
      if (statusResp?.data?.kyc_url) return statusResp.data.kyc_url;
      if (statusResp?.data?.document_id) return `https://app.digio.in/#/gateway/login/${statusResp.data.document_id}`;
    } catch (e) { console.warn(e); }

    return null;
  };

  const handleStartKyc = async () => {
    if (isApproved(kycStatus)) {
      Alert.alert('KYC Completed', 'Your KYC is already approved.');
      return;
    }

    if (starting) return;
    setStarting(true);

    try {
      const res: any = await kycService.startKyc();

      if (res?.kyc_url) {
        const opened = await openKycInWebViewOrExternal(res.kyc_url);
        if (!opened) Alert.alert('Error', 'Unable to open KYC url.');
        return;
      }

      if (res?.success) {
        const fallback = await findKycUrlFromFallbacks();
        if (fallback) {
          await openKycInWebViewOrExternal(fallback);
          return;
        }
        Alert.alert('KYC', res?.message ?? 'KYC started — check status.');
        return;
      }

      const fallback = await findKycUrlFromFallbacks();
      if (fallback) {
        await openKycInWebViewOrExternal(fallback);
        return;
      }

      Alert.alert('Error', res?.message ?? 'Unable to start KYC.');
    } catch (rawErr: any) {
      const axiosResp = rawErr?.response;
      if (axiosResp?.status === 422) {
        const errData = axiosResp.data ?? {};
        const errUrl = errData?.kyc_url ?? errData?.data?.kyc_url ?? extractKycUrlFromProfile(errData);
        if (errUrl) {
          await openKycInWebViewOrExternal(errUrl);
          setStarting(false);
          return;
        }
        const fallbackUrl = await findKycUrlFromFallbacks();
        if (fallbackUrl) {
          await openKycInWebViewOrExternal(fallbackUrl);
          setStarting(false);
          return;
        }
        Alert.alert('Info', errData?.message ?? 'KYC in progress.');
        return;
      }
      
      const fallbackUrl = await findKycUrlFromFallbacks();
      if (fallbackUrl) {
        await openKycInWebViewOrExternal(fallbackUrl);
        return;
      }
      Alert.alert('Error', rawErr?.message ?? 'Failed to start KYC.');
    } finally {
      setStarting(false);
    }
  };

  // ---------- UI Rendering ----------
  const isComplete = isApproved(kycStatus);
  const statusColor = isComplete ? '#10B981' : '#F59E0B'; // Green or Amber
  const statusBg = isComplete ? '#ECFDF5' : '#FFFBEB';
  const statusIcon = isComplete ? 'shield-checkmark' : 'alert-circle';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <View>
             <Text style={styles.headerTitle}>KYC & Agreement</Text>
             <Text style={styles.headerSubtitle}>Legal compliance & verification</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusBg, borderColor: statusColor }]}>
            <View style={styles.statusHeader}>
                <Ionicons name={statusIcon} size={24} color={statusColor} />
                <Text style={[styles.statusTitle, { color: statusColor }]}>
                    Status: {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
                </Text>
            </View>
            <Text style={styles.statusDesc}>
                {isComplete 
                    ? "Your identity has been verified. You have full access to platform features." 
                    : "Please complete your KYC verification to activate your account."}
            </Text>
            
            {!isComplete && (
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: THEME_COLOR }]}
                    onPress={handleStartKyc}
                    disabled={starting}
                >
                    {starting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={styles.actionBtnText}>Complete KYC Now</Text>
                            <Feather name="external-link" size={16} color="#fff" style={{marginLeft: 8}} />
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>

        {/* Agreement Document */}
        <Text style={styles.sectionLabel}>DIGITAL AGREEMENT</Text>
        <View style={styles.documentContainer}>
            <View style={styles.docHeader}>
                <Feather name="file-text" size={16} color="#6B7280" />
                <Text style={styles.docHeaderText}>User Agreement - v1.0</Text>
            </View>
            <ScrollView 
                style={styles.docScroll} 
                nestedScrollEnabled 
                contentContainerStyle={{padding: 16}}
            >
                <Text style={styles.docTitle}>TERMS OF SERVICE</Text>
                <Text style={styles.docText}>
                    This Agreement is made on {new Date().toLocaleDateString()} between <Text style={{fontWeight: '700'}}>{userName}</Text> ("User") and Rapid Invest Market Research ("Company").
                    {'\n\n'}
                    <Text style={{fontWeight: '700'}}>1. Acceptance:</Text> By using our services, you agree to comply with all applicable SEBI regulations and platform policies.
                    {'\n\n'}
                    <Text style={{fontWeight: '700'}}>2. Identity Verification:</Text> You confirm that the PAN and Aadhaar details submitted belong to you and are valid.
                    {'\n\n'}
                    <Text style={{fontWeight: '700'}}>3. Risk Disclosure:</Text> Investment in securities market are subject to market risks. Read all the related documents carefully before investing.
                    {'\n\n'}
                    <Text style={{fontWeight: '700'}}>4. Data Privacy:</Text> Your data is encrypted and stored securely. We do not share your personal details with third parties without consent.
                </Text>
                <View style={styles.digitalStamp}>
                    <Text style={styles.stampText}>Digitally Generated • {kycStatus.toUpperCase()}</Text>
                </View>
            </ScrollView>
        </View>

        {/* Signature Section */}
        {/* <Text style={styles.sectionLabel}>USER SIGNATURE</Text>
        <View style={styles.signatureCard}>
            {signatureImage ? (
                <View style={styles.signedContainer}>
                    <Image source={{ uri: signatureImage }} style={styles.signatureImg} resizeMode="contain" />
                    <View style={styles.verifiedBadge}>
                        <Feather name="check-circle" size={12} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified Signature</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.unsignedContainer}>
                    <Feather name="pen-tool" size={32} color="#D1D5DB" />
                    <Text style={styles.unsignedText}>Signature will appear here once KYC is completed.</Text>
                </View>
            )}
        </View> */}

        {/* Footer Actions */}
        {/* <View style={styles.footerActions}>
            <TouchableOpacity 
                style={[styles.outlineBtn, !isComplete && { opacity: 0.5 }]} 
                onPress={() => isComplete && Alert.alert('Download', 'Downloading PDF...')}
                disabled={!isComplete}
            >
                <Feather name="download" size={18} color={isComplete ? THEME_COLOR : '#9CA3AF'} />
                <Text style={[styles.outlineBtnText, !isComplete && { color: '#9CA3AF' }]}>
                    Download Agreement
                </Text>
            </TouchableOpacity>
        </View> */}

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
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
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Status Card
  statusCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Section Headers
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Document View
  documentContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    overflow: 'hidden',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  docHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  docScroll: {
    height: 220,
    backgroundColor: '#fff',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
  docText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 22,
  },
  digitalStamp: {
    marginTop: 20,
    alignItems: 'center',
    opacity: 0.5,
  },
  stampText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },

  // Signature
  signatureCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    height: 140,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  signatureImg: {
    width: '80%',
    height: '70%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  unsignedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    margin: 10,
    backgroundColor: '#FAFAFA',
  },
  unsignedText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '70%',
  },

  // Footer
  footerActions: {
    alignItems: 'center',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    width: '100%',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLOR,
    marginLeft: 8,
  },
});
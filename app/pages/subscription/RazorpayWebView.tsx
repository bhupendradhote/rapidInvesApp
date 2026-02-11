// app/pages/subscription/RazorpayWebView.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import subscriptionService from '@/services/api/methods/subscriptionService';
import customerProfileServices from '@/services/api/methods/profileService';

export default function RazorpayWebView() {
  const params = useLocalSearchParams<{
    url?: string;
    order_id?: string;
    key?: string;
    amount?: string;
    currency?: string;
    coupon?: string;
    contact?: string;
  }>();

  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [userContact, setUserContact] = useState<string | null>(null);
  const [loadingContact, setLoadingContact] = useState(true);

  // coupon passed via query (may be empty string)
  const coupon = params?.coupon ? String(params.coupon) : null;
  const contactFromParam = params?.contact ?? null;

  useEffect(() => {
    let mounted = true;
    const fetchContact = async () => {
      if (contactFromParam) {
        if (mounted) {
          setUserContact(String(contactFromParam));
          setLoadingContact(false);
        }
        return;
      }

      try {
        const resp: any = await customerProfileServices.getAllProfiles();
        const user = resp?.user ?? resp?.data?.user ?? resp ?? {};
        const possible =
          user?.phone ??
          user?.mobile ??
          user?.mobile_number ??
          user?.contact_number ??
          user?.profile?.phone ??
          user?.profile?.mobile ??
          null;

        if (mounted) setUserContact(possible ?? null);
      } catch (e) {
        console.warn('Failed to fetch user contact for checkout:', e);
      } finally {
        if (mounted) setLoadingContact(false);
      }
    };

    fetchContact();
    return () => {
      mounted = false;
    };
  }, [contactFromParam]);

  const checkoutUrl = params?.url ? decodeURIComponent(params.url) : null;
  const order_id = params?.order_id ?? null;
  const key = params?.key ?? null;
  const amount = params?.amount ?? null;
  const currency = params?.currency ?? 'INR';

  // If order_id & key provided, create HTML for Razorpay checkout
  const generatedHtml = useMemo(() => {
    if (!order_id || !key) return null;

    const prefillContact = userContact ? String(userContact) : '';
    const couponNote = coupon ? String(coupon) : '';
    const safeAmount = amount ?? '';

    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <script>
            window.onload = function() {
              var options = {
                "key": "${key}",
                "order_id": "${order_id}",
                "amount": "${safeAmount}",
                "currency": "${currency}",
                "name": "Bharat Stock Market",
                "description": "Subscription Purchase",
                "prefill": {
                  "contact": "${prefillContact}"
                },
                "notes": {
                  "coupon": "${couponNote}"
                },
                "handler": function (response){
                  var url = "https://mobile-app-payment-callback.local/?razorpay_payment_id=" + response.razorpay_payment_id + "&razorpay_order_id=" + response.razorpay_order_id + "&razorpay_signature=" + response.razorpay_signature;
                  window.location.href = url;
                },
                "modal": {
                  "ondismiss": function() {
                    window.location.href = "https://mobile-app-payment-callback.local/?status=cancelled";
                  }
                }
              };
              var rzp = new Razorpay(options);
              rzp.open();
            };
          </script>
        </body>
      </html>
    `;
  }, [order_id, key, amount, currency, userContact, coupon]);

  // Build webViewSource (hosted-URL uses coupon appended, order-based uses generated HTML)
  const webViewSource = checkoutUrl
    ? {
        uri:
          coupon && !checkoutUrl.includes('coupon=')
            ? `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}coupon=${encodeURIComponent(coupon)}`
            : checkoutUrl,
      }
    : generatedHtml
    ? { html: generatedHtml }
    : null;

  if (!webViewSource) {
    return (
      <>
        <Stack.Screen options={{ title: 'Checkout' }} />
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </>
    );
  }

  const parseQuery = (url: string) => {
    try {
      const q = url.split('?')[1] ?? '';
      const params = new URLSearchParams(q);
      const payment_id = params.get('razorpay_payment_id') ?? params.get('payment_id');
      const order_id = params.get('razorpay_order_id') ?? params.get('order_id');
      const signature = params.get('razorpay_signature') ?? params.get('signature');
      const status = params.get('status') ?? null;
      return { payment_id, order_id, signature, status };
    } catch (e) {
      return { payment_id: null, order_id: null, signature: null, status: null };
    }
  };

  const onNavChange = async (navState: any) => {
    const navUrl = navState?.url ?? '';
    if (!navUrl.includes('mobile-app-payment-callback.local')) return;

    const { payment_id, order_id: r_order_id, signature, status } = parseQuery(navUrl);

    if (status === 'cancelled') {
      Alert.alert('Payment', 'Payment was cancelled.');
      router.back();
      return;
    }

    if (!payment_id || !r_order_id || !signature) {
      Alert.alert('Payment', 'Payment returned incomplete data.');
      router.back();
      return;
    }

    setVerifying(true);
    try {
      const payload: any = {
        razorpay_order_id: r_order_id,
        razorpay_payment_id: payment_id,
        razorpay_signature: signature,
      };
      if (coupon) payload.coupon = coupon;

      const verifyResp: any = await subscriptionService.verifyRazorpay(payload);
      console.log('verifyResp', verifyResp);

      if (verifyResp?.success) {
        Alert.alert('Payment Success', verifyResp?.message ?? 'Payment verified and subscription activated.');
        router.back();
      } else {
        Alert.alert('Payment', verifyResp?.message ?? 'Payment verification failed.');
        router.back();
      }
    } catch (e: any) {
      console.warn('verifyRazorpay failed', e);
      Alert.alert('Payment', e?.message ?? 'Verification failed. Contact support.');
      router.back();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <View style={styles.flex}>
        <WebView
          source={webViewSource as any}
          originWhitelist={['*']}
          onNavigationStateChange={onNavChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          )}
        />
        {verifying && (
          <View style={styles.verifyingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

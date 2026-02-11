import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, Text, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

export default function KycWebView() {
  const params = useLocalSearchParams<{ url?: string }>();
  const router = useRouter();

  const url = useMemo(() => {
    let maybe = params?.url;
    if (Array.isArray(maybe)) maybe = maybe[0];
    if (!maybe) return undefined;
    
    try {
      return decodeURIComponent(maybe);
    } catch {
      return maybe;
    }
  }, [params?.url]);

  if (!url) {
    return (
      <>
        <Stack.Screen options={{ title: 'Complete KYC', headerBackTitle: 'Back' }} />
        <SafeAreaView style={styles.center}>
          <Text style={{ textAlign: 'center', padding: 16 }}>
            Missing KYC URL. Please go back and try again.
          </Text>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Complete KYC', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.flex}>
        <StatusBar barStyle="dark-content" />
        <WebView
          source={{ uri: url }}
          startInLoadingState
          // FIX: Critical for Digio to load properly.
          // Digio often blocks or hangs on default RN UserAgents.
          userAgent={
             Platform.OS === 'android'
               ? 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
               : 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
          }
          javaScriptEnabled={true}
          domStorageEnabled={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#005BC1" />
            </View>
          )}
          onNavigationStateChange={(navState) => {
            const navUrl = navState?.url ?? '';
            if (
              navUrl.includes('/success') || 
              navUrl.includes('completed') || 
              navUrl.includes('status=success') || 
              navUrl.includes('callback')
            ) {
              // Delay slightly to allow any final scripts to run
              setTimeout(() => {
                  if (router.canGoBack()) router.back();
              }, 1000);
            }
          }}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1, 
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,1)',
    zIndex: 100,
  }
});
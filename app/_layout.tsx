// app/_layout.tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated'; 
import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { userToken, isLoading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = rootNavigationState?.key != null;

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments?.[0] === 'pages' && segments?.[1] === 'auth';

    if (userToken && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!userToken && !inAuthGroup) {
      router.replace('/pages/auth/welcome');
    }
  }, [isLoading, userToken, segments, isNavigationReady]);

  useEffect(() => {
    if (!isLoading && isNavigationReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, isNavigationReady]);

  if (isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pages/auth/welcome" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pages/auth/loginRegister" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        <Stack.Screen name="index" />
      </Stack>

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>   {/* ✅ THIS WAS MISSING */}
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
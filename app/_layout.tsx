// app/_layout.tsx
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

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      
      {/* 🚀 FIX APPLIED HERE: screenOptions added to the root Stack to kill the top gap */}
      <Stack screenOptions={{ headerShown: false }}>
        
        <Stack.Screen name="pages/auth/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pages/auth/loginRegister" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
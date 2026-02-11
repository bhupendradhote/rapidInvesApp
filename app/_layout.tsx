// app/_layout.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Animated } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { userToken, isLoading } = useAuth();

  const opacity = useRef(new Animated.Value(0)).current;
  const [readyToShow, setReadyToShow] = useState(false);
  const hasHiddenSplashRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    (async () => {
      const inAuthGroup = segments?.[0] === 'pages' && segments?.[1] === 'auth';

      try {
        if (userToken && inAuthGroup) {
          await router.replace('/(tabs)');
        } else if (!userToken && !inAuthGroup) {
          await router.replace('/pages/auth/welcome');
        } else {
        }
      } catch {
      }

      await new Promise((res) => requestAnimationFrame(() => res(undefined)));

      setReadyToShow(true);
    })();
  }, [isLoading, userToken, segments]);

  useEffect(() => {
    if (!readyToShow) return;
    if (hasHiddenSplashRef.current) return;

    (async () => {
      try {
        // Hide native splash
        await SplashScreen.hideAsync();
      } catch {
        // ignore hide errors
      } finally {
        hasHiddenSplashRef.current = true;
        // Fade in app content
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    })();
  }, [readyToShow, opacity]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Animated.View style={{ flex: 1, opacity }}>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="pages/auth/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="pages/auth/loginRegister" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
      </Animated.View>
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

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// --- Constants ---
const { width, height } = Dimensions.get('window');
const THEME_COLOR = '#0a7ea4';
const welcomeImageSource = require('../../../assets/images/welcome.png');

const WelcomePage = () => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9FF" />

      <LinearGradient
        colors={['#F0F9FF', '#FFFFFF', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          
          {/* Main Content */}
          <View style={styles.contentContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={welcomeImageSource}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            <View style={styles.textWrapper}>
              <Text style={styles.tagline}>INVEST WITH CONFIDENCE</Text>
              
              <Text style={styles.title}>
                Rapid Invest
              </Text>
              
              <Text style={styles.highlight}>
                Research Platform
              </Text>

              <Text style={styles.description}>
                Unlock expert market insights, real-time calls, and smart investment strategies designed for growth.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.9}
              onPress={() => router.push('/pages/auth/loginRegister')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <Feather name="shield" size={14} color="#64748B" />
              <Text style={styles.trustText}>
                Secure • Reliable • Intelligent
              </Text>
            </View>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40, 
  },
  
  // Image
  imageWrapper: {
    width: width * 0.9,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // Typography
  textWrapper: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B', // Slate gray
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A', // Dark slate
    lineHeight: 40,
    textAlign: 'center',
  },
  highlight: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME_COLOR,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },

  // Footer
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: THEME_COLOR,
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default WelcomePage;
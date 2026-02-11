import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import OtherPagesInc from '@/components/includes/otherPagesInc';

export default function LegalDisclaimer() {
  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: 20 Sep 2025</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>1. General Information</Text>
          <Text style={styles.paragraph}>
            The information provided on Rapid InvestApp is for educational and informational purposes only. It should not be considered as financial advice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. Market Risks</Text>
          <Text style={styles.paragraph}>
            Stock trading and investments are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future results.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. No Guarantee</Text>
          <Text style={styles.paragraph}>
            While we strive to provide accurate data, we do not guarantee the accuracy, completeness, or timeliness of the information. Users are advised to verify information with certified financial advisors.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. User Responsibility</Text>
          <Text style={styles.paragraph}>
            You agree that any trading decisions you make are your own responsibility. Rapid InvestApp and its owners will not be held liable for any losses incurred.
          </Text>
        </View>
      </ScrollView>
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 10,
    paddingBottom: 40,
    paddingTop: 20,

  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'justify',
  },
});
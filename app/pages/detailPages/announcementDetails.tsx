import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions, // Stack is likely from expo-router/stack or similar
} from 'react-native';
import { useLocalSearchParams, Stack as ExpoStack } from 'expo-router'; // Corrected import based on usage
import OtherPagesInc from '@/components/includes/otherPagesInc';

export default function AnnouncementDetails() {
  const params = useLocalSearchParams();

  // Fallback data
  const data = {
    title: params.title || 'Planned maintenance window',
    date: params.date || '30 Nov 2025',
    tag: params.tag || 'Info update',
    bodyTitle: 'Maintenance window',
    bodyText: 'Scheduled between 11.30 PM and 12.30 PM on Sunday night. During the time:',
    bullets: [
      'Exist logged-in users may experience brief disconnects',
      'New logins and KYC documents uploads may be temporarily unavailable.',
    ],
    footer: 'If the update impact you and you have a question, you can raise a ticket from the Support & Complaints page.',
  };

  return (
    <OtherPagesInc>
      <ExpoStack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.meta}>
            {data.date} • <Text style={styles.metaTag}>{data.tag}</Text>
          </Text>

          <Text style={styles.sectionHeader}>{data.bodyTitle}</Text>
          <Text style={styles.bodyText}>{data.bodyText}</Text>

          <View style={styles.bulletContainer}>
            {data.bullets.map((point, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footerNote}>{data.footer}</Text>
        </View>
      </ScrollView>
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  
  scrollContent: {
    padding: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 500,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  meta: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 24,
  },
  metaTag: {
    color: '#9CA3AF',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  bulletContainer: {
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletDot: {
    fontSize: 18,
    lineHeight: 24,
    color: '#374151',
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  footerNote: {
    fontSize: 13,
    lineHeight: 20,
    color: '#D1D5DB',
    marginTop: 10,
  },
});
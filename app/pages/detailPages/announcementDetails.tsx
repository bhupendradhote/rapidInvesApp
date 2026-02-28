import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack as ExpoStack } from 'expo-router';
import OtherPagesInc from '@/components/includes/otherPagesInc';

import announcementServices from '@/services/api/methods/announcementService';

interface AnnouncementData {
  title: string;
  date: string;
  tag: string;
  bodyTitle: string;
  bodyText: string;
  bullets: string[];
  footer: string;
}

const THEME_COLOR = '#0a7ea4';

export default function AnnouncementDetails() {
  const params = useLocalSearchParams();
  
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnnouncementData>({
    title: (params.title as string) || 'Loading...',
    date: (params.date as string) || '',
    tag: (params.tag as string) || '',
    bodyTitle: '',
    bodyText: '',
    bullets: [],
    footer: '',
  });

  // --- API Integration ---
  useEffect(() => {
    const fetchAnnouncementDetails = async () => {
      // If no ID is passed, we can't fetch. Just stop loading.
      if (!params.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await announcementServices.getAnnouncementById(params.id as string);
        
        if (response) {
          // Map the API response to our local state structure.
          // Note: Adjust 'description', 'content', 'bullets' based on your actual API schema.
          setData({
            title: response.title || params.title || 'Announcement',
            date: response.when || response.createdAt 
              ? new Date(response.createdAt).toLocaleDateString() 
              : (params.date as string) || 'Recent',
            tag: Array.isArray(response.tags) ? response.tags[0] : (params.tag as string) || 'Update',
            bodyTitle: response.bodyTitle || response.subtitle || 'Details',
            bodyText: response.bodyText || response.description || response.content || '',
            bullets: response.bullets || [], // Assuming API returns an array of strings for bullets
            footer: response.footer || 'If this update impacts you and you have a question, you can raise a ticket from the Support & Complaints page.',
          });
        }
      } catch (error) {
        console.error('Failed to fetch announcement details:', error);
        // Fallback data if API fails, so the screen isn't completely blank
        setData({
          title: (params.title as string) || 'Planned maintenance window',
          date: (params.date as string) || '30 Nov 2025',
          tag: (params.tag as string) || 'Info update',
          bodyTitle: 'Maintenance window',
          bodyText: 'Scheduled between 11.30 PM and 12.30 PM on Sunday night. During the time:',
          bullets: [
            'Existing logged-in users may experience brief disconnects.',
            'New logins and KYC documents uploads may be temporarily unavailable.',
          ],
          footer: 'If the update impacts you and you have a question, you can raise a ticket from the Support & Complaints page.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncementDetails();
  }, [params.id]);

  return (
    <OtherPagesInc>
      <ExpoStack.Screen options={{ headerShown: false }} />
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{data.title}</Text>
            
            {(data.date || data.tag) && (
              <Text style={styles.meta}>
                {data.date} {data.date && data.tag ? '• ' : ''}
                <Text style={styles.metaTag}>{data.tag}</Text>
              </Text>
            )}

            {!!data.bodyTitle && (
              <Text style={styles.sectionHeader}>{data.bodyTitle}</Text>
            )}
            
            {!!data.bodyText && (
              <Text style={styles.bodyText}>{data.bodyText}</Text>
            )}

            {data.bullets && data.bullets.length > 0 && (
              <View style={styles.bulletContainer}>
                {data.bullets.map((point, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!data.footer && (
              <Text style={styles.footerNote}>{data.footer}</Text>
            )}
          </View>
        </ScrollView>
      )}
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Assuming same background as standard pages
  },
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
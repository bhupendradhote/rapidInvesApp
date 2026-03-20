import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
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

function firstValue(value: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function toText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value.length ? String(value[0]) : fallback;
  return String(value);
}

export default function AnnouncementDetails() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    date?: string | string[];
    tag?: string | string[];
  }>();

  const id = firstValue(params.id);
  const titleParam = firstValue(params.title);
  const dateParam = firstValue(params.date);
  const tagParam = firstValue(params.tag);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnnouncementData>({
    title: titleParam || 'Loading...',
    date: dateParam || '',
    tag: tagParam || '',
    bodyTitle: '',
    bodyText: '',
    bullets: [],
    footer: '',
  });

  useEffect(() => {
    const fetchAnnouncementDetails = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await announcementServices.getAnnouncementById(id);

        if (response) {
          const createdAtValue = response?.createdAt
            ? new Date(response.createdAt).toLocaleDateString()
            : '';

          const responseDate =
            toText(response?.when, '') ||
            createdAtValue ||
            dateParam ||
            'Recent';

          const responseTag = Array.isArray(response?.tags)
            ? toText(response.tags[0], 'Update')
            : toText(response?.tag, tagParam || 'Update');

          setData({
            title: toText(response?.title, titleParam || 'Announcement'),
            date: responseDate,
            tag: responseTag,
            bodyTitle: toText(response?.bodyTitle, toText(response?.subtitle, 'Details')),
            bodyText: toText(
              response?.bodyText,
              toText(response?.description, toText(response?.content, ''))
            ),
            bullets: Array.isArray(response?.bullets)
              ? response.bullets.map((item: unknown) => toText(item)).filter(Boolean)
              : [],
            footer: toText(
              response?.footer,
              'If this update impacts you and you have a question, you can raise a ticket from the Support & Complaints page.'
            ),
          });
        }
      } catch (error) {
        console.error('Failed to fetch announcement details:', error);
        setData({
          title: titleParam || 'Planned maintenance window',
          date: dateParam || '30 Nov 2025',
          tag: tagParam || 'Info update',
          bodyTitle: 'Maintenance window',
          bodyText: 'Scheduled between 11.30 PM and 12.30 PM on Sunday night. During the time:',
          bullets: [
            'Existing logged-in users may experience brief disconnects.',
            'New logins and KYC document uploads may be temporarily unavailable.',
          ],
          footer:
            'If this update impacts you and you have a question, you can raise a ticket from the Support & Complaints page.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncementDetails();
  }, [id, titleParam, dateParam, tagParam]);

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />

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
            <Text style={styles.title}>{toText(data.title, '')}</Text>

            {(data.date || data.tag) ? (
              <Text style={styles.meta}>
                {toText(data.date, '')}
                {data.date && data.tag ? ' • ' : ''}
                <Text style={styles.metaTag}>{toText(data.tag, '')}</Text>
              </Text>
            ) : null}

            {data.bodyTitle ? (
              <Text style={styles.sectionHeader}>{toText(data.bodyTitle, '')}</Text>
            ) : null}

            {data.bodyText ? (
              <Text style={styles.bodyText}>{toText(data.bodyText, '')}</Text>
            ) : null}

            {data.bullets.length > 0 ? (
              <View style={styles.bulletContainer}>
                {data.bullets.map((point, index) => (
                  <View key={`${index}-${point}`} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{toText(point, '')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data.footer ? (
              <Text style={styles.footerNote}>{toText(data.footer, '')}</Text>
            ) : null}
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
    backgroundColor: '#F8F9FA',
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
    color: '#6B7280',
    marginTop: 10,
  },
});
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
// Ensure this path matches your project structure
import blogAndNewsService from '@/services/api/methods/blogAndNewsService';

// --- Unified Interface for both News and Blogs ---
interface ArticleData {
  id: number | string;
  title: string;
  meta: string;
  imageUrl: string;
  body: string;
  type: 'news' | 'blog';
}

export default function ArticleDetailsPage() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: 'news' | 'blog' }>();

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Helper Functions ---

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>?/gm, '') // Remove tags
      .replace(/&nbsp;/g, ' ')   // Replace non-breaking space
      .replace(/&amp;/g, '&')    // Replace ampersand
      .replace(/&quot;/g, '"')   // Replace quotes
      .replace(/\s+/g, ' ')      // Collapse multiple spaces
      .trim();
  };

  const getImageUrl = (item: any) => {
    return item.image || item.image_url || item.thumbnail || 'https://via.placeholder.com/600';
  };

  // --- Main Fetch Logic ---
  
  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, type]); // Re-run when ID or Type changes (e.g., clicking a recent item)

  const fetchData = async () => {
    try {
      setLoading(true);
      // Scroll to top when loading new article (optional UX improvement)
      
      // 1. Fetch Both Data Sources
      const [newsResponse, blogsResponse] = await Promise.all([
        blogAndNewsService.news.getAllNews(),
        blogAndNewsService.blogs.getAllBlogs(),
      ]);

      const getArray = (response: any) => {
        if (Array.isArray(response)) return response;
        if (response?.data && Array.isArray(response.data)) return response.data;
        if (response?.blogs && Array.isArray(response.blogs)) return response.blogs;
        if (response?.news && Array.isArray(response.news)) return response.news;
        return [];
      };

      const rawNews = getArray(newsResponse);
      const rawBlogs = getArray(blogsResponse);

      // 2. Find the Current Article (Based on ID and Type)
      let currentItem: any = null;
      
      if (type === 'blog') {
        currentItem = rawBlogs.find((item: any) => item.id.toString() === id?.toString());
      } else {
        // Default to news if type is missing or 'news'
        currentItem = rawNews.find((item: any) => item.id.toString() === id?.toString());
      }

      // 3. Set Current Article State
      if (currentItem) {
        // Logic to determine Meta text (Blogs get reading time, News gets simple date)
        const dateStr = formatDate(currentItem.published_at || currentItem.created_at);
        const metaText = type === 'blog' && currentItem.reading_time 
          ? `${dateStr} • ${currentItem.reading_time} min read`
          : dateStr;

        setArticle({
          id: currentItem.id,
          title: currentItem.title,
          meta: metaText,
          imageUrl: getImageUrl(currentItem),
          body: stripHtmlTags(currentItem.content),
          type: type as 'news' | 'blog',
        });
      }

      // 4. Prepare "Recent Updates" List
      // We explicitly tag them before merging to avoid type errors
      const taggedNews = rawNews.map((item: any) => ({ ...item, _type: 'news' }));
      const taggedBlogs = rawBlogs.map((item: any) => ({ ...item, _type: 'blog' }));

      const combinedList = [...taggedNews, ...taggedBlogs]
        .filter((item: any) => item.id.toString() !== id?.toString()) // Remove current article
        .sort((a: any, b: any) => {
          // Sort by newest
          const dateA = new Date(a.published_at || a.created_at || 0).getTime();
          const dateB = new Date(b.published_at || b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5); // Take top 5

      // Map to valid ArticleData interface
      const formattedRecent: ArticleData[] = combinedList.map((item: any) => ({
        id: item.id,
        title: item.title,
        meta: formatDate(item.published_at || item.created_at),
        imageUrl: getImageUrl(item),
        body: '', // Not needed for list
        type: item._type as 'news' | 'blog', // Explicit casting based on our tag
      }));

      setRecentUpdates(formattedRecent);

    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Article not found.</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- Hero Image --- */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: article.imageUrl }} style={styles.heroImage} />
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* --- Article Body --- */}
        <View style={styles.contentContainer}>
          {/* Badge for Type */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{article.type === 'blog' ? 'BLOG' : 'NEWS'}</Text>
          </View>

          <Text style={styles.headline}>{article.title}</Text>
          <Text style={styles.dateLine}>{article.meta}</Text>

          <Text style={styles.bodyText}>
            {article.body}
          </Text>
        </View>

        {/* --- Recent Updates Section --- */}
        {recentUpdates.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentHeader}>Recent Updates</Text>
            
            <View style={styles.listContainer}>
              {recentUpdates.map((item, index) => (
                <TouchableOpacity 
                  key={`${item.type}-${item.id}-${index}`} 
                  style={styles.card} 
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to the same page with new params
                    router.push({
                      pathname: '/pages/detailPages/newsDetails', // Ensure this path matches your file name
                      params: { id: item.id, type: item.type } 
                    });
                  }}
                >
                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle} numberOfLines={3}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {item.type === 'blog' ? 'Blog • ' : 'News • '} 
                      {item.meta}
                    </Text>
                  </View>

                  <Image 
                    source={{ uri: item.imageUrl }} 
                    style={styles.thumbnail}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  goBackBtn: {
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  goBackText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Hero Section
  imageContainer: {
    width: '100%',
    height: 260,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 20, 
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Article Body
  contentContainer: {
    padding: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 30,
    textAlign: 'left',
  },
  dateLine: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 24,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#374151',
    textAlign: 'justify',
  },

  // Recent Section
  recentSection: {
    marginTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: 8,
    borderTopColor: '#F3F4F6', // Thick divider
    paddingTop: 24,
  },
  recentHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'space-between',
    minHeight: 80, 
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 11,
    color: '#6B7280', 
    fontWeight: '500',
    marginTop: 'auto',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
});
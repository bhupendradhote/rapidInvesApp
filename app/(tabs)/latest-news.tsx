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
} from 'react-native';
import { useRouter } from 'expo-router';
// Ensure this path matches your project structure
import blogAndNewsService from '@/services/api/methods/blogAndNewsService';

// --- Interface matching your data structure ---
interface NewsItem {
  id: number | string;
  title: string;
  meta: string;
  imageUrl: string;
  type: 'news' | 'blog'; // Strict union type
  content?: string;
  shortDescription?: string;
  originalDate?: string; // Used for sorting
}

const NewsPage = () => {
  const router = useRouter();
  const [feedData, setFeedData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getImageUrl = (item: any) => {
    return item.image || item.image_url || item.thumbnail || 'https://via.placeholder.com/150';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch data from both endpoints
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

      // 2. Format News
      const formattedNews: NewsItem[] = rawNews.map((item: any) => ({
        id: item.id,
        title: item.title,
        meta: formatDate(item.published_at || item.created_at) || 'Latest News',
        imageUrl: getImageUrl(item),
        type: 'news', // Explicit string
        content: item.content,
        shortDescription: item.short_description,
        originalDate: item.published_at || item.created_at,
      }));

      // 3. Format Blogs (with Reading Time)
      const formattedBlogs: NewsItem[] = rawBlogs.map((item: any) => {
        const dateStr = formatDate(item.published_at || item.created_at);
        const readTime = item.reading_time ? ` • ${item.reading_time} min read` : ' • Blog';
        
        return {
          id: item.id,
          title: item.title,
          meta: `${dateStr}${readTime}`,
          imageUrl: getImageUrl(item),
          type: 'blog', // Explicit string
          content: item.content,
          shortDescription: item.short_description,
          originalDate: item.published_at || item.created_at,
        };
      });

      // 4. Combine and Sort by Date (Newest First)
      const combined = [...formattedNews, ...formattedBlogs].sort((a, b) => {
        const dateA = new Date(a.originalDate || 0).getTime();
        const dateB = new Date(b.originalDate || 0).getTime();
        return dateB - dateA; // Descending order
      });

      setFeedData(combined);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.headerTitle}>Latest Updates</Text>

          <View style={styles.listContainer}>
            {feedData.length === 0 ? (
              <Text style={styles.emptyText}>No updates available.</Text>
            ) : (
              feedData.map((item, index) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}-${index}`}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Pass ID and Type so the details page knows what to fetch
                    router.push({
                      pathname: '/pages/detailPages/newsDetails',
                      params: {
                        id: item.id,
                        type: item.type, // Important: Pass the type ('news' or 'blog')
                      },
                    });
                  }}
                >
                  <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={3}>
                      {item.title}
                    </Text>
                    <Text style={styles.meta}>
                        {/* Optional: Add a small label prefix */}
                        {item.type === 'blog' ? 'Blog • ' : 'News • '} 
                        {item.meta}
                    </Text>
                  </View>

                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.thumbnail}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff', // Changed to white for cleaner look
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Subtle border
    // Optional shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'space-between',
    minHeight: 80,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  meta: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 'auto',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
    fontSize: 16,
  },
});

export default NewsPage;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Chat from '@/components/includes/chat'; 

const insets = useSafeAreaInsets(); 

  const BASE_TAB_HEIGHT = Platform.OS === "android" ? 60 : 65;

  const tabHeight = BASE_TAB_HEIGHT + insets.bottom;
  const fabBottom = tabHeight + 15; 

interface OtherPagesIncProps {
  children: React.ReactNode;
}

export default function OtherPagesInc({ children }: OtherPagesIncProps) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const activeColor = "#0a7ea4"; 

  // 1. Production Fix: Shortened labels to prevent text wrapping/squishing
  const navItems = [
    { name: 'News', icon: 'newspaper', route: '/latest-news' },
    { name: 'Alerts', icon: 'campaign', route: '/announcements' },
    { name: 'Home', icon: 'dashboard', route: '/' }, 
    { name: 'Calls', icon: 'show-chart', route: '/market-calls' },
    { name: 'Settings', icon: 'settings', route: '/settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/pages/notification/allNotifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* --- CONTENT --- */}
      <View style={styles.contentContainer}>
        {children}
      </View>

      {/* --- FAB --- */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeColor }]}
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chat" size={24} color="white" />
      </TouchableOpacity>

      {/* --- CUSTOM BOTTOM NAV --- */}
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={item.icon as any} size={24} color="#6B7280" />
            <Text style={styles.navLabel} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true} 
        visible={isChatOpen}
        onRequestClose={() => setIsChatOpen(false)}
      >
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setIsChatOpen(false)}>
                <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.modalContainer}>
                {/* 2. Production Fix: Header moved inside the container to prevent clipping */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Support Chat</Text>
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={() => setIsChatOpen(false)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Chat Component takes the rest of the space */}
                <View style={styles.chatWrapper}>
                  <Chat />
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabBarStyle: {
              backgroundColor: '#ffffff',
              height: tabHeight,              
              paddingTop: Platform.OS === "android" ? 0 : 4,
              paddingBottom: Platform.OS === "android" ? insets.bottom + 5 : insets.bottom + 10, 
              elevation: 8,
              borderTopColor: '#f0f0f0', 
            },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // slightly increased for better edge spacing
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  
  // --- CUSTOM BOTTOM NAV ---
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    // 3. Production Fix: Safe area padding for bottom of iOS screens
    paddingBottom: Platform.OS === 'ios' ? 28 : 10, 
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8, // Add shadow on Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1, // Replaced width: 18% with flex: 1 for perfectly equal distribution
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10, // Bumped slightly since we shortened words
    marginTop: 4,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // --- FAB ---
  fab: {
    position: "absolute",
    // 4. Production Fix: Platform specific heights to clear the bottom nav
    bottom: Platform.OS === 'ios' ? 95 : 85, 
    right: 20,
    width: 56, // Standardized touch target size
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  
  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', 
  },
  modalBackdrop: {
    flex: 1, 
  },
  modalContainer: {
    backgroundColor: "#fff",
    height: '85%',
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatWrapper: {
    flex: 1,
  }
});
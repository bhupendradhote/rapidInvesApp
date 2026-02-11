import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Chat from '@/components/includes/chat'; 

interface OtherPagesIncProps {
  children: React.ReactNode;
}

export default function OtherPagesInc({ children }: OtherPagesIncProps) {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const activeColor = "#0a7ea4"; 

  const navItems = [
    { name: 'Latest News', icon: 'newspaper', route: '/latest-news' },
    { name: 'Announcement', icon: 'campaign', route: '/announcements' },
    { name: 'Dashboard', icon: 'dashboard', route: '/' }, // Index
    { name: 'Market Calls', icon: 'show-chart', route: '/market-calls' },
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

        {/* Updated Route Here */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/pages/notification/allNotifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {children}
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeColor }]}
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chat" size={25} color="white" />
      </TouchableOpacity>

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
                <Chat />

                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setIsChatOpen(false)}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="close" size={22} color="#333" />
                </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 12,
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '18%', 
  },
  navLabel: {
    fontSize: 9, 
    marginTop: 4,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  fab: {
    position: "absolute",
    bottom: 80, 
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
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
    height: '90%',
    width: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -40, 
    right: 15,
    zIndex: 99999,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  }
});
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Platform, 
  TouchableWithoutFeedback,
  Text 
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import Chat from "@/components/includes/chat"; 

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = Colors[colorScheme ?? "light"].tint;

  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          headerShown: false,
          tabBarButton: HapticTab,
          // 1. Production Fix: Prevent tabs from collapsing on small Android screens
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            paddingBottom: 4,
          },
          tabBarStyle: {
            height: Platform.OS === "android" ? 65 : 85,
            paddingTop: Platform.OS === "android" ? 8 : 8,
            paddingBottom: Platform.OS === "android" ? 10 : 28,
            elevation: 8, // Adds shadow to tab bar on Android
          },
        }}
      >
        <Tabs.Screen
          name="latest-news"
          options={{
            title: "News", // Shortened for better fit
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="newspaper" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: "Alerts", // Shortened for better fit
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="campaign" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Home", // Shortened for better fit
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="market-calls"
          options={{
            title: "Calls", // Shortened for better fit
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="show-chart" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size ?? 24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* 2. Production Fix: FAB positioning is dynamically adjusted based on platform */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeColor }]}
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chat" size={24} color="white" />
      </TouchableOpacity>

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
                {/* 3. Production Fix: Clean header inside the container to prevent clipping */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    // Ensure it sits well above the tab bar on both OS's
    bottom: Platform.OS === 'ios' ? 100 : 85, 
    right: 20,
    width: 56, // Slightly larger standard FAB size
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
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
    height: '85%', // Slightly reduced to ensure status bar visibility
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
import { Tabs } from "expo-router";
import React, { useState } from "react";
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Platform, 
  Pressable, 
  Text,
  KeyboardAvoidingView 
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import Chat from "@/components/includes/chat"; 

export default function TabLayout() {
  const activeColor = Colors.light.tint; 
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const insets = useSafeAreaInsets(); 

  const BASE_TAB_HEIGHT = Platform.OS === "android" ? 60 : 65;

  const tabHeight = BASE_TAB_HEIGHT + insets.bottom;
  const fabBottom = tabHeight + 15; 

  return (
    <View style={styles.container}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            paddingBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: '#ffffff',
            height: tabHeight,              
            paddingTop: Platform.OS === "android" ? 0 : 4,
            paddingBottom: Platform.OS === "android" ? insets.bottom + 5 : insets.bottom + 10, 
            elevation: 8,
            borderTopColor: '#f0f0f0', 
          },
        }}
      >
        <Tabs.Screen
          name="latest-news"
          options={{
            title: "News",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="newspaper" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="campaign" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="market-calls"
          options={{
            title: "Calls",
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeColor, bottom: fabBottom }]}
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
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => setIsChatOpen(false)} 
            />

            <KeyboardAvoidingView 
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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

                <View style={styles.chatWrapper}>
                  <Chat />
                </View>
            </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', 
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56, 
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', 
  },
  modalContainer: {
    backgroundColor: '#ffffff', 
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
    color: '#333333', 
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
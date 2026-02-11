import { Tabs } from "expo-router";
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, Platform, TouchableWithoutFeedback } from "react-native";
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
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="latest-news"
          options={{
            title: "Latest News",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="newspaper" size={size ?? 26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: "Announcement",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="campaign" size={size ?? 26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size ?? 26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="market-calls"
          options={{
            title: "Market Calls",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="show-chart" size={size ?? 26} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size ?? 26} color={color} />
            ),
          }}
        />
      </Tabs>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeColor }]}
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chat" size={25} color="white" />
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
                <View >
                    <View  />
                </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 60, 
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
    // overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  
  // --- Close Button ---
  closeButton: {
    position: 'absolute',
    top: -32, 
    right: 10,
    zIndex: 99999,
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center',
    alignItems: 'center',
  }
});
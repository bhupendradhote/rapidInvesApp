import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // 1. Import useRouter

interface SearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  // onNotificationPress is no longer strictly needed if hardcoded, 
  // but kept optional in case you want to override it later.
  onNotificationPress?: () => void;
}

const Search: React.FC<SearchProps> = ({ 
  value, 
  onChangeText, 
  placeholder = "Search using stock name...",
  onNotificationPress 
}) => {
  const router = useRouter(); // 2. Initialize router

  const handleNotificationPress = () => {
    // Priority to custom prop if passed, otherwise default navigation
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/pages/notification/allNotifications');
    }
  };

  return (
    <View style={styles.searchRow}>
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#999" />
        <TextInput
          placeholder={placeholder}
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity 
        style={styles.notificationBtn} 
        onPress={handleNotificationPress} // 3. Use the handler
      >
        <Ionicons
          name="notifications-outline"
          size={22}
          color="#444"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111',
  },
  notificationBtn: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Search;
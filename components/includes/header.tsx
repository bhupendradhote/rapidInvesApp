import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { storage } from '../../services/storage';
import customerProfileServices from '@/services/api/methods/profileService';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  avatarUrl,
  onMenuPress,
  onProfilePress,
  notificationCount = 0,
}) => {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(userName || 'User');
  const [displayAvatar, setDisplayAvatar] = useState(
    avatarUrl || 'https://i.pravatar.cc/300'
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadUser = async () => {
        if (userName && avatarUrl) {
          if (mounted) {
            setDisplayName(userName);
            setDisplayAvatar(avatarUrl);
          }
          return;
        }

        try {
          let userData: any = null;

          try {
            const response: any =
              await customerProfileServices.getAllProfiles();
            userData = response?.user ?? response?.data?.user;
          } catch (apiError) {
            console.warn('Header API failed, fallback to storage');
          }

          if (!userData) {
            userData = await storage.getUser();
          }

          if (!mounted || !userData) return;

          if (!userName) {
            const name =
              userData.name || userData.full_name || 'User';
            setDisplayName(name);
          }

          if (!avatarUrl) {
            let finalImage = 'https://i.pravatar.cc/300';

            if (userData.profile_image_url) {
              finalImage = userData.profile_image_url;
            } else {
              const kycActions =
                userData.kyc?.raw_response?.actions;

              if (Array.isArray(kycActions)) {
                const digilocker = kycActions.find(
                  (a: any) => a.type === 'digilocker'
                );
                const base64Img =
                  digilocker?.details?.aadhaar?.image;

                if (base64Img) {
                  finalImage = `data:image/jpeg;base64,${base64Img}`;
                }
              }
            }

            setDisplayAvatar(finalImage);
          }
        } catch (e) {
          console.error('Header load error', e);
        }
      };

      loadUser();

      return () => {
        mounted = false;
      };
    }, [userName, avatarUrl])
  );

  const handleNotificationPress = () => {
    router.push('/pages/notification/allNotifications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* LEFT SECTION */}
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={onProfilePress}>
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            <Text style={styles.welcome}>Welcome back 👋</Text>
            <Text style={styles.username}>
              {displayName}
            </Text>
          </View>
        </View>

        {/* RIGHT SECTION */}
        <View style={styles.headerRight}>
          {/* Notification */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleNotificationPress}
          >
            <Feather name="bell" size={22} color="#333" />

            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sidebar/Menu Icon (unchanged) */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onMenuPress}
          >
            <Feather name="menu" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
container: {
  paddingBottom: 18,

  paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 40,
},

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#f2f2f2',
  },

  nameContainer: {
    marginLeft: 12,
  },

  welcome: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
  },

  username: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBtn: {
    marginLeft: 20,
    padding: 6,
  },

  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../services/api/methods/authService';
import { storage } from '../../services/storage';
import { useAuth } from '@/app/context/AuthContext';
import customerProfileServices from '@/services/api/methods/profileService';

// --- Constants ---
const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.80;
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#FFFFFF';
const AVATAR_SIZE = 80;
const DEFAULT_IMAGE = 'https://i.pravatar.cc/300';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showModal, setShowModal] = useState(visible);
  
  const [userData, setUserData] = useState({
    name: 'User',
    role: 'Member',
    phone: '',
    email: '',
    status: 'Active',
    plan: 'Free Tier'
  });

  const [profileImage, setProfileImage] = useState(DEFAULT_IMAGE);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // --- Fetch User Data ---
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        let user: any = null;

        // 1. Try fetching fresh data
        try {
          const response: any = await customerProfileServices.getAllProfiles();
          user = response?.user ?? response?.data?.user;
        } catch (apiError) {
          console.warn("Sidebar API fetch failed, falling back to storage");
        }

        // 2. Fallback
        if (!user) {
          user = await storage.getUser();
        }

        if (mounted && user) {
          const hasActiveSubscription = user.subscription?.status === 'active';
          const planName = user.plan?.name || (hasActiveSubscription ? 'Standard Plan' : 'Free Tier');

          setUserData({
            name: user.name || user.full_name || 'User',
            role: user.role || 'Member', 
            phone: user.phone || '',
            email: user.email || '',
            status: user.status || 'Active',
            plan: planName 
          });

          // Image Logic
          let finalImage = DEFAULT_IMAGE;
          if (user.profile_image_url) {
            finalImage = user.profile_image_url;
          } else {
            const kycActions = user.kyc?.raw_response?.actions;
            if (Array.isArray(kycActions)) {
              const digilocker = kycActions.find((a: any) => a.type === 'digilocker');
              const base64Img = digilocker?.details?.aadhaar?.image;
              if (base64Img) finalImage = `data:image/jpeg;base64,${base64Img}`;
            }
          }
          setProfileImage(finalImage);
        }
      } catch (error) {
        console.log("Error fetching user data", error);
      }
    };

    if (visible) {
      fetchUser();
      setShowModal(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }

    return () => { mounted = false; };
  }, [visible]);

  // --- Logout ---
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await authService.logout(); 
          } catch (error) {
            console.log("API logout failed");
          } finally {
            setLoading(false);
            onClose(); 
            await signOut(); 
          }
        }
      }
    ]);
  };

  const navigateTo = (path: string) => {
      onClose();
      // small delay to allow sidebar to close smoothly
      setTimeout(() => {
        router.push(path as any);
      }, 100);
  };

  if (!showModal) return null;

  return (
    <Modal
      transparent
      visible={showModal}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sidebar Panel */}
        <Animated.View
          style={[
            styles.sidebarContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
            {/* 1. Header Section (Colored) */}
            <View style={styles.headerSection}>
                <View style={styles.userInfoRow}>
                    <Image
                        source={{ uri: profileImage }}
                        style={styles.avatar}
                    />
                    <View style={styles.userTextContainer}>
                        <Text style={styles.userName} numberOfLines={1}>{userData.name}</Text>
                        <View style={styles.planBadge}>
                            <MaterialIcons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.planText}>{userData.plan}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Feather name="x" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* 2. Content Scroll */}
            <View style={styles.contentContainer}>
                
                {/* User Info Details */}
                <View style={styles.detailsCard}>
                    {userData.phone ? (
                        <View style={styles.detailRow}>
                            <Feather name="phone" size={16} color="#6B7280" style={styles.detailIcon} />
                            <Text style={styles.detailText}>{userData.phone}</Text>
                        </View>
                    ) : null}
                    
                    {userData.email ? (
                        <View style={styles.detailRow}>
                            <Feather name="mail" size={16} color="#6B7280" style={styles.detailIcon} />
                            <Text style={styles.detailText} numberOfLines={1}>{userData.email}</Text>
                        </View>
                    ) : null}

                    <View style={styles.detailRow}>
                        <Feather name="shield" size={16} color="#6B7280" style={styles.detailIcon} />
                        <Text style={styles.detailText}>{userData.role} • </Text>
                        <Text style={[styles.detailText, {color: userData.status === 'Active' ? '#10B981' : '#EF4444'}]}>
                            {userData.status}
                        </Text>
                    </View>
                </View>

                {/* Primary Action */}
                <TouchableOpacity 
                    style={styles.ctaButton} 
                    activeOpacity={0.9}
                    onPress={() => navigateTo('../(tabs)/market-calls')}
                >
                    <View style={styles.ctaIconBg}>
                        <Feather name="trending-up" size={20} color={THEME_COLOR} />
                    </View>
                    <Text style={styles.ctaText}>View Market Calls</Text>
                    <Feather name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Menu Items */}
                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('../(tabs)/settings')}>
                    <View style={styles.menuIconBox}>
                        <Feather name="settings" size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.menuText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/pages/support/SupportPage')}>
                    <View style={styles.menuIconBox}>
                        <Feather name="help-circle" size={20} color="#4B5563" />
                    </View>
                    <Text style={styles.menuText}>Help & Support</Text>
                </TouchableOpacity>

            </View>

            {/* 3. Footer / Logout */}
            <View style={styles.footerContainer}>
                <TouchableOpacity 
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    disabled={loading}
                >
                    {loading ? (
                         <ActivityIndicator size="small" color="#EF4444" style={{marginRight: 8}}/>
                    ) : (
                        <Feather name="log-out" size={20} color="#EF4444" style={{marginRight: 12}} />
                    )}
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>v1.0.4</Text>
            </View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: BG_COLOR,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  
  // Header
  headerSection: {
    backgroundColor: THEME_COLOR,
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomRightRadius: 24,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#E5E7EB',
  },
  userTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  planText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  closeBtn: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 40,
      right: 16,
      padding: 8,
  },

  // Content
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  
  // Details Card
  detailsCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  detailIcon: {
      marginRight: 10,
      width: 20, 
      textAlign: 'center',
  },
  detailText: {
      fontSize: 14,
      color: '#374151',
      flex: 1,
  },

  // CTA
  ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: THEME_COLOR,
      padding: 14,
      borderRadius: 16,
      shadowColor: THEME_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 24,
  },
  ctaIconBg: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  ctaText: {
      flex: 1,
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
  },

  divider: {
      height: 1,
      backgroundColor: '#F3F4F6',
      marginBottom: 20,
  },

  // Menu Items
  menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 12,
  },
  menuIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
  },
  menuText: {
      fontSize: 16,
      color: '#374151',
      fontWeight: '500',
  },

  // Footer
  footerContainer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
  },
  logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: '#FEF2F2',
      borderRadius: 12,
  },
  logoutText: {
      color: '#EF4444',
      fontSize: 16,
      fontWeight: '600',
  },
  versionText: {
      textAlign: 'center',
      color: '#9CA3AF',
      fontSize: 12,
      marginTop: 12,
  },
});

export default Sidebar;
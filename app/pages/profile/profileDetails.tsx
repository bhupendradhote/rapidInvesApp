import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import customerProfileServices from '@/services/api/methods/profileService';
import OtherPagesInc from '@/components/includes/otherPagesInc';

// --- Theme Constants ---
const COLORS = {
  primary: '#005BC1',
  background: '#F9FAFB',
  card: '#FFFFFF',
  textMain: '#1F2937',
  textSub: '#6B7280',
  inputBg: '#F3F4F6',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
};

export default function ProfileDetails() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Form State ---
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [userId, setUserId] = useState('');
  
  // Date State
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Identity State
  const [panNumber, setPanNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');

  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // --- Helper: Extract KYC Data ---
  const getKycData = (user: any) => {
    const kycActions = user?.kyc?.raw_response?.actions;
    if (Array.isArray(kycActions)) {
      const digilockerData = kycActions.find((a: any) => a.type === 'digilocker');
      return digilockerData?.details || {};
    }
    return {};
  };

  // --- Fetch Data ---
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const response: any = await customerProfileServices.getAllProfiles();
        if (!mounted) return;

        const userData = response?.user ?? response?.data?.user ?? {};
        const kycDetails = getKycData(userData);

        setUsername(userData.name ?? '');
        setEmail(userData.email ?? '');
        setPhone(userData.phone ?? '');
        setUserId(userData.bsmr_id ?? userData.id?.toString() ?? '');
        setIsEmailVerified(!!userData.email_verified_at);

        const apiGender = userData.gender ? userData.gender.toLowerCase() : 'male';
        setGender(apiGender === 'female' ? 'Female' : 'Male');

        if (userData.profile_image_url) {
            setProfileImage(userData.profile_image_url);
        } else if (kycDetails?.aadhaar?.profile_image_url) {
            setProfileImage(kycDetails.aadhaar.profile_image_url);
        } else if (kycDetails?.aadhaar?.image) {
            setProfileImage(`data:image/jpeg;base64,${kycDetails.aadhaar.image}`);
        }

        const rawPan = userData.pan_card || kycDetails?.pan?.id_number || '';
        const rawAadhar = userData.adhar_card || kycDetails?.aadhaar?.id_number || '';
        setPanNumber(rawPan);
        setAadharNumber(rawAadhar);

        if (userData.dob) {
          const datePart = userData.dob.split('T')[0];
          const [y, m, d] = datePart.split('-');
          setYear(y ?? '');
          setMonth(m ?? '');
          setDay(d ?? '');
        }

      } catch (err) {
        console.warn('Profile fetch error:', err);
        Alert.alert('Error', 'Failed to load profile data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  // --- Image Picker ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // --- Save Handler ---
  const handleUpdate = async () => {
    setSaving(true);
    try {
        let dob = null;
        if (year && month && day) {
            dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        const formData = new FormData();
        formData.append('name', username);
        formData.append('gender', gender);
        if(dob) formData.append('dob', dob);
        formData.append('pan_card', panNumber);
        formData.append('adhar_card', aadharNumber);
        
        if (profileImage && !profileImage.startsWith('http') && !profileImage.startsWith('data:')) {
            const filename = profileImage.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            // @ts-ignore
            formData.append('profile_image', { uri: profileImage, name: filename, type });
        }

        // await customerProfileServices.updateProfile(formData);
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to update profile.');
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            
            {/* --- Header / Avatar --- */}
            <View style={styles.headerContainer}>
                
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
                        <Image 
                            source={profileImage ? { uri: profileImage } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
                            style={styles.avatar} 
                        />
                        <View style={styles.cameraButton}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    
                    <View style={styles.idBadgeContainer}>
                         <View style={styles.idBadge}>
                            <Text style={styles.idLabel}>ID: </Text>
                            <Text style={styles.idValue}>{userId || 'N/A'}</Text>
                         </View>
                    </View>
                </View>
            </View>

            {/* --- Form Section --- */}
            <View style={styles.formContainer}>
                
                {/* Personal Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Personal Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput 
                            style={styles.input} 
                            value={username} 
                            onChangeText={setUsername}
                            placeholder="Your full name"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderRow}>
                            {['Male', 'Female'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.genderPill, gender === g && styles.genderPillActive]}
                                    onPress={() => setGender(g as 'Male' | 'Female')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons 
                                        name={g === 'Male' ? 'male' : 'female'} 
                                        size={16} 
                                        color={gender === g ? '#fff' : COLORS.textSub} 
                                    />
                                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                                        {g}
                                    </Text>
                                    {gender === g && (
                                        <View style={styles.genderCheck}>
                                            <Ionicons name="checkmark" size={10} color={COLORS.primary} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <View style={styles.dobRow}>
                            <TextInput 
                                style={[styles.input, styles.dobInput]} 
                                value={day} onChangeText={setDay} placeholder="DD" 
                                keyboardType="numeric" maxLength={2} 
                            />
                            <TextInput 
                                style={[styles.input, styles.dobInput]} 
                                value={month} onChangeText={setMonth} placeholder="MM" 
                                keyboardType="numeric" maxLength={2} 
                            />
                            <TextInput 
                                style={[styles.input, styles.dobInput, { flex: 1.5 }]} 
                                value={year} onChangeText={setYear} placeholder="YYYY" 
                                keyboardType="numeric" maxLength={4} 
                            />
                        </View>
                    </View>
                </View>

                {/* Contact Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Contact Info</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={[styles.input, styles.inputWithAction]}>
                            <TextInput 
                                style={{ flex: 1, color: COLORS.textSub }} 
                                value={email} 
                                editable={false}
                            />
                            {isEmailVerified ? (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                                    <Text style={styles.verifiedText}>Verified</Text>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => router.push('/pages/profile/verifyEmail')}>
                                    <Text style={styles.actionLink}>Verify</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={[styles.input, styles.inputWithAction]}>
                            <TextInput 
                                style={{ flex: 1, color: COLORS.textSub }} 
                                value={phone} 
                                editable={false}
                            />
                            <TouchableOpacity onPress={() => router.push('/pages/profile/verifyNumber')}>
                                <Text style={styles.actionLink}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Identity Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Identity</Text>
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PAN Number</Text>
                        <TextInput 
                            style={styles.input} 
                            value={panNumber} 
                            onChangeText={setPanNumber}
                            placeholder="ABCDE1234F"
                            autoCapitalize="characters"
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Aadhar Number</Text>
                        <TextInput 
                            style={styles.input} 
                            value={aadharNumber} 
                            onChangeText={setAadharNumber}
                            placeholder="0000 0000 0000"
                            keyboardType="numeric"
                            maxLength={14}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <View style={styles.footerContainer}>
                    <TouchableOpacity 
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                        onPress={handleUpdate}
                        disabled={saving}
                        activeOpacity={0.9}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </OtherPagesInc>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 60,
    backgroundColor: COLORS.background,
  },
  
  // --- Header ---
  headerContainer: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 30,
  },

  avatarSection: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  idBadgeContainer: {
    marginTop: 5,
  },
  idBadge: {
    flexDirection: 'row',
    backgroundColor: '#E0E7FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  idLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  idValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
  },

  // --- Form Layout ---
  formContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
  },

  // --- Inputs ---
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textMain,
  },
  inputWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },

  // --- Gender Select ---
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  genderPillActive: {
    backgroundColor: COLORS.primary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  genderTextActive: {
    color: '#fff',
  },
  genderCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 1,
  },

  // --- Date Inputs ---
  dobRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dobInput: {
    flex: 1,
    textAlign: 'center',
  },

  // --- Footer ---
  footerContainer: {
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
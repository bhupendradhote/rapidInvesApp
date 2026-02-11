/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, StatusBar, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, ScrollView, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

import { authService } from '../../../services/api/methods/authService';
import { useAuth } from '../../context/AuthContext';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#FFFFFF';
const INPUT_BG = '#F8F9FA';
const { width } = Dimensions.get('window');

const LoginRegisterPage = () => {
  const router = useRouter();
  const { signIn } = useAuth(); 

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'mobile' | 'otp'>('login');
  const [loading, setLoading] = useState(false);

  // Form Data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [tempKey, setTempKey] = useState(''); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  // --- Handlers (Same Logic) ---
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.login({ login_identity: email, password });
      if (response.token) await signIn(response.token, response.user);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Login failed.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) return Alert.alert("Missing Fields", "Please fill in all details.");
    if (password !== confirmPassword) return Alert.alert("Password Error", "Passwords do not match!");

    setLoading(true);
    try {
      const response: any = await authService.register({
        name: fullName,
        email: email,
        password: password,
        password_confirmation: confirmPassword,
      });

      if (response.temp_key) {
        setTempKey(response.temp_key);
        setAuthMode('mobile'); 
      } else {
        Alert.alert("Error", "Unexpected response.");
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0]; 
        Alert.alert("Validation Error", Array.isArray(firstError) ? String(firstError[0]) : "Invalid input");
      } else {
        Alert.alert("Error", error.response?.data?.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return Alert.alert("Invalid Mobile", "Please enter a valid mobile number.");
    setLoading(true);
    try {
      await authService.sendOtp(tempKey, phone);
      setAuthMode('otp');
      Alert.alert("OTP Sent", "Please check your mobile messages.");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) return Alert.alert("Invalid OTP", "Please enter the complete OTP.");

    setLoading(true);
    try {
      const response = await authService.verifyOtp(tempKey, otpCode);
      if (response.token) {
        await signIn(response.token, response.user);
        Alert.alert("Verified!", "Account created. Logging in...");
      } else {
        setAuthMode('login');
        Alert.alert("Verified", "Please login with your new account.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 5) inputRefs.current[index + 1]?.focus();
    if (text.length === 0 && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const getButtonText = () => {
    if (loading) return "Please wait...";
    switch(authMode) {
        case 'login': return 'Log In';
        case 'register': return 'Continue';
        case 'mobile': return 'Send Verification Code';
        case 'otp': return 'Verify & Complete';
    }
  };

  const handleAction = () => {
    if (loading) return;
    switch(authMode) {
        case 'login': handleLogin(); break;
        case 'register': handleRegister(); break;
        case 'mobile': handleSendOtp(); break;
        case 'otp': handleVerifyOtp(); break;
    }
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header / Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (authMode === 'otp') setAuthMode('mobile');
                        else if (authMode === 'mobile') setAuthMode('register');
                        else if (authMode === 'register') setAuthMode('login');
                        else router.back();
                    }}
                >
                <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            {/* Titles */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>
                    {authMode === 'login' ? 'Welcome back' 
                    : authMode === 'register' ? 'Create Account' 
                    : authMode === 'mobile' ? 'Mobile Number'
                    : 'Verification'}
                </Text>
                <Text style={styles.subtitle}>
                    {authMode === 'login' ? 'Enter your details to access your account.' 
                    : authMode === 'register' ? 'Sign up to start your investment journey.'
                    : authMode === 'mobile' ? 'We need your mobile number for verification.'
                    : `Enter the 6-digit code sent to +91 ${phone}`}
                </Text>
            </View>

            <View style={styles.formContainer}>
              
              {/* === REGISTER FIELDS === */}
              {authMode === 'register' && (
                <>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. John Doe"
                            placeholderTextColor="#9CA3AF"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. john@example.com"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Create a password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Re-enter password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
              )}

              {/* === MOBILE FIELD === */}
              {authMode === 'mobile' && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <View style={styles.phoneContainer}>
                        <View style={styles.countryCodeBox}>
                            <Text style={styles.countryCode}>+91</Text>
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder="Enter 10-digit number"
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>
                </View>
              )}

              {/* === OTP FIELD === */}
              {authMode === 'otp' && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>One Time Password</Text>
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref }} 
                            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            placeholder="•"
                            placeholderTextColor="#D1D5DB"
                        />
                        ))}
                    </View>
                    <TouchableOpacity onPress={handleSendOtp} style={styles.resendBtn}>
                        <Text style={styles.resendText}>Resend Code</Text>
                    </TouchableOpacity>
                </View>
              )}

              {/* === LOGIN FIELDS === */}
              {authMode === 'login' && (
                <>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email or Mobile</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email or phone"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter your password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={styles.optionsRow}>
                        <TouchableOpacity 
                            style={styles.checkboxContainer}
                            activeOpacity={0.8}
                            onPress={() => setKeepSignedIn(!keepSignedIn)}
                        >
                            <MaterialCommunityIcons 
                                name={keepSignedIn ? "checkbox-marked" : "checkbox-blank-outline"} 
                                size={22} 
                                color={keepSignedIn ? THEME_COLOR : "#9CA3AF"} 
                            />
                            <Text style={styles.checkboxLabel}>Remember me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => console.log("Forgot Password pressed")}>
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>
                </>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={handleAction}
                disabled={loading}
              >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.primaryBtnText}>{getButtonText()}</Text>
                )}
              </TouchableOpacity>

              {(authMode === 'login' || authMode === 'register') && (
                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>
                        {authMode === 'login' ? "New here? " : "Already have an account? "}
                    </Text>
                    <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                        <Text style={styles.linkText}>
                            {authMode === 'login' ? 'Create Account' : 'Log In'}
                        </Text>
                    </TouchableOpacity>
                </View>
              )}
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  
  // Header
  header: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  
  // Titles
  titleSection: {
      marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  
  // Form
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  // Phone Field
  phoneContainer: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  countryCodeBox: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderRightWidth: 1,
      borderRightColor: '#E5E7EB',
      backgroundColor: '#F3F4F6',
  },
  countryCode: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
  },

  // Password Field
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 8,
  },

  // Checkbox & Links
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: THEME_COLOR,
    fontWeight: '600',
  },

  // Primary Button
  primaryBtn: {
    width: '100%',
    height: 54,
    backgroundColor: THEME_COLOR,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer Links
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    color: THEME_COLOR,
    fontWeight: '700',
  },

  // OTP
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: width / 7.5,
    height: 50,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
  },
  otpInputFilled: {
      borderColor: THEME_COLOR,
      backgroundColor: '#F0F9FF',
  },
  resendBtn: {
      alignSelf: 'center',
      padding: 8,
  },
  resendText: {
      color: THEME_COLOR,
      fontWeight: '600',
      fontSize: 14,
  },
});

export default LoginRegisterPage;
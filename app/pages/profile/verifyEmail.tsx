import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import OtherPagesInc from '@/components/includes/otherPagesInc';

const VerifyEmailPage = () => {
  const router = useRouter();
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const showTemporaryMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <OtherPagesInc>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            
            <Text style={styles.title}>Verify Email</Text>

            {successMessage && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#00A884" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {step === 'email' && (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Enter Email Address</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email Address"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity 
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSuccessMessage(`OTP sent to ${email || 'your email'}`);
                    setStep('otp');
                  }}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'otp' && (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Enter OTP to Verify</Text>
                
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => { inputRefs.current[index] = ref }} 
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        placeholder="0"
                        placeholderTextColor="#C0C0C0"
                        />
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    const otpCode = otp.join('');
                    showTemporaryMessage("Email verified successfully!");
                  }}
                >
                  <Text style={styles.primaryBtnText}>Verify Email</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.resendBtn}
                    onPress={() => setStep('email')}
                >
                    <Text style={styles.resendText}>Change Email</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </OtherPagesInc>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', 
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#00A884', 
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
    marginTop: 80, 
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 48,  
    height: 48,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#005BC1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendBtn: {
      marginTop: 20,
      alignItems: 'center',
  },
  resendText: {
      color: '#005BC1',
      fontSize: 14,
      fontWeight: '500',
  }
});

export default VerifyEmailPage;
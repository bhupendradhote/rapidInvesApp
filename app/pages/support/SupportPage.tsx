import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Image,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// --- Constants ---
const THEME_COLOR = '#0a7ea4';
const BG_COLOR = '#F8F9FA';
const CARD_BG = '#FFFFFF';
const { width } = Dimensions.get('window');

const MOCK_HISTORY = [
  { id: '1024', subject: 'KYC Verification Pending', status: 'pending', date: '2 mins ago', category: 'Account' },
  { id: '1023', subject: 'Payment deduction issue', status: 'resolved', date: 'Yesterday', category: 'Payment' },
  { id: '1021', subject: 'App crashing on login', status: 'rejected', date: '12 Oct 2024', category: 'Technical' },
];

const CATEGORIES = ['Account Issue', 'Payment/Billing', 'KYC Verification', 'Technical Bug', 'Other'];

export default function SupportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // --- Logic ---
  const handleAttachment = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to attach screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0].uri);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please provide a subject and description.');
      return;
    }

    setSubmitting(true);
    // Simulate API Call
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Ticket Raised', 'Your ticket #8839 has been created successfully.', [
        {
          text: 'View Status',
          onPress: () => {
            setSubject('');
            setDescription('');
            setAttachment(null);
            setActiveTab('history');
          },
        },
      ]);
    }, 1500);
  };

  const openLink = (type: 'whatsapp' | 'email' | 'call') => {
    switch (type) {
      case 'whatsapp':
        Linking.openURL('whatsapp://send?phone=919876543210&text=Hi, I need help with my account.');
        break;
      case 'email':
        Linking.openURL('mailto:support@rapidInveststock.com');
        break;
      case 'call':
        Linking.openURL('tel:+919876543210');
        break;
    }
  };

  // --- Renderers ---

  const renderCreateTicket = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Contact Grid */}
      <View style={styles.quickContactContainer}>
        <Text style={styles.sectionHeader}>Instant Support</Text>
        <View style={styles.contactGrid}>
             <TouchableOpacity style={styles.contactCard} onPress={() => openLink('call')}>
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="phone-call" size={20} color="#005BC1" />
                </View>
                <Text style={styles.contactText}>Call Us</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.contactCard} onPress={() => openLink('whatsapp')}>
                <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <MaterialCommunityIcons name="whatsapp" size={22} color="#10B981" />
                </View>
                <Text style={styles.contactText}>WhatsApp</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.contactCard} onPress={() => openLink('email')}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}>
                    <Feather name="mail" size={20} color="#F97316" />
                </View>
                <Text style={styles.contactText}>Email</Text>
             </TouchableOpacity>
        </View>
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Raise a Ticket</Text>
        <Text style={styles.cardSubtitle}>Submit your query and we will resolve it ASAP.</Text>

        {/* Category Dropdown */}
        <Text style={styles.label}>Category</Text>
        <View style={{ zIndex: 10 }}>
            <TouchableOpacity 
            style={styles.dropdownBtn} 
            activeOpacity={0.8}
            onPress={() => setShowCatDropdown(!showCatDropdown)}
            >
            <Text style={styles.dropdownText}>{category}</Text>
            <Feather name={showCatDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
            </TouchableOpacity>
            
            {showCatDropdown && (
            <View style={styles.dropdownList}>
                {CATEGORIES.map((cat, idx) => (
                <TouchableOpacity 
                    key={idx} 
                    style={[styles.dropdownItem, idx === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => {
                    setCategory(cat);
                    setShowCatDropdown(false);
                    }}
                >
                    <Text style={[styles.dropdownItemText, category === cat && { color: THEME_COLOR, fontWeight: '600' }]}>{cat}</Text>
                    {category === cat && <Feather name="check" size={16} color={THEME_COLOR} />}
                </TouchableOpacity>
                ))}
            </View>
            )}
        </View>

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief summary of the issue"
          placeholderTextColor="#9CA3AF"
          value={subject}
          onChangeText={setSubject}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue in detail..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Attachment */}
        <Text style={styles.label}>Attachments (Optional)</Text>
        {!attachment ? (
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttachment}>
                <View style={styles.attachIconBg}>
                    <Feather name="image" size={20} color={THEME_COLOR} />
                </View>
                <View>
                    <Text style={styles.attachTitle}>Upload Screenshot</Text>
                    <Text style={styles.attachSub}>Tap to browse gallery</Text>
                </View>
            </TouchableOpacity>
        ) : (
            <View style={styles.attachmentPreview}>
                <Image source={{ uri: attachment }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.removeAttachBtn} onPress={removeAttachment}>
                    <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.attachedLabel}>Screenshot_01.jpg</Text>
            </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmitTicket} 
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
                <Feather name="send" size={18} color="#fff" style={{marginLeft: 8}} />
            </>
          )}
        </TouchableOpacity>
      </View>
      <View style={{height: 40}} />
    </ScrollView>
  );

  const renderHistory = () => (
    <FlatList
      data={MOCK_HISTORY}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <Feather name="inbox" size={32} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyText}>No tickets found</Text>
          <Text style={styles.emptySubText}>You have not raised any support tickets yet.</Text>
        </View>
      }
      renderItem={({ item }) => {
        let statusColor = '#F59E0B'; // Pending (Amber)
        let statusBg = '#FFFBEB';
        if (item.status === 'resolved') {
            statusColor = '#10B981'; // Green
            statusBg = '#ECFDF5';
        }
        if (item.status === 'rejected') {
            statusColor = '#EF4444'; // Red
            statusBg = '#FEF2F2';
        }

        return (
          <View style={styles.ticketCard}>
            <View style={styles.ticketRow}>
              <View style={styles.ticketIdBadge}>
                <Text style={styles.ticketIdText}>#{item.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.ticketSubject}>{item.subject}</Text>
            
            <View style={styles.ticketMetaRow}>
                <View style={styles.metaItem}>
                    <Feather name="tag" size={12} color="#9CA3AF" />
                    <Text style={styles.ticketMeta}>{item.category}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Feather name="clock" size={12} color="#9CA3AF" />
                    <Text style={styles.ticketMeta}>{item.date}</Text>
                </View>
            </View>

            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View Timeline</Text>
                <Feather name="chevron-right" size={16} color={THEME_COLOR} />
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'create' && styles.activeTab]} 
                onPress={() => setActiveTab('create')}
                activeOpacity={0.9}
            >
                <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>Raise Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
                onPress={() => setActiveTab('history')}
                activeOpacity={0.9}
            >
                <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>My History</Text>
            </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        {activeTab === 'create' ? renderCreateTicket() : renderHistory()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 35,
    paddingBottom: 15,

    backgroundColor: BG_COLOR,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  // Tabs (Segmented Control Style)
  tabContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },

  // Create Ticket Scroll
  scrollContent: {
    padding: 10,
    paddingTop: 10,
  },

  // Contact Grid
  quickContactContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  
  // Dropdown
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'absolute',
    top: 55,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },

  // Inputs
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 120,
  },

  // Attachments
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  attachIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE', // Light blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  attachSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  attachmentPreview: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  removeAttachBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },
  attachedLabel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 12,
    padding: 6,
    textAlign: 'center',
  },

  // Submit
  submitBtn: {
    backgroundColor: THEME_COLOR,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // History
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketIdBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  ticketMetaRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
  },
  metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  ticketMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewBtnText: {
    color: THEME_COLOR,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
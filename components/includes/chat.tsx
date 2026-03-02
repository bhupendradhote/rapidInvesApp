import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import chatServices from '@/services/api/methods/chatServices'; // adjust path if needed

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

const COLORS = {
  primary: '#2A2A2A',
  accent: '#007AFF',
  headerAvatarBg: '#0D8ABC',
  background: '#F5F5F7',
  white: '#FFFFFF',
  grayLight: '#E5E5EA',
  textDark: '#000000',
  textLight: '#8E8E93',
  greenOnline: '#34C759',
};

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const flatListRef = useRef<FlatList>(null);

  // --- Initial Fetch & Live Polling ---
  useEffect(() => {
    // Initial load with the loading spinner
    fetchHistory(true);

    // Set up a background interval to fetch live messages every 3 seconds
    const intervalId = setInterval(() => {
      fetchHistory(false); // Fetch silently without showing the spinner
    }, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchHistory = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const historyData = await chatServices.getChatHistory();
      
      const dataArray = Array.isArray(historyData) 
        ? historyData 
        : (historyData?.data && Array.isArray(historyData.data)) 
          ? historyData.data 
          : [];

      if (dataArray && dataArray.length > 0) {
        const formattedHistory: Message[] = dataArray.map((msg: any) => {
          // Strictly check 'from_role' based on your API
          const isMyMessage = msg.from_role === 'user';

          return {
            id: msg.id?.toString() || Math.random().toString(),
            text: msg.message || '', 
            sender: isMyMessage ? 'me' : 'other', 
            timestamp: msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        
        setMessages(formattedHistory);
      } else {
        // Removed the dummy messages. It will just be empty now.
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load chat history', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // --- Send Message ---
  const sendMessage = async () => {
    if (inputText.trim().length === 0) return;

    const textToSend = inputText.trim();
    setInputText('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // 1. Optimistically add message to UI instantly
    const newMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, newMessage]);

    try {
      // 2. Send to API silently
      await chatServices.sendMessage({ message: textToSend });
      
      // 3. Immediately trigger a silent fetch to get the finalized list/bot replies
      fetchHistory(false);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optional: You could remove the message from state here if it fails to send
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender === 'me';
    const isNextSame = messages[index + 1]?.sender === item.sender;

    return (
      <View style={[
        styles.messageRow,
        isMe ? styles.rowEnd : styles.rowStart,
        { marginBottom: isNextSame ? 4 : 16 }
      ]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            {!isNextSame ? (
              <View style={[styles.avatarCircle, { backgroundColor: COLORS.headerAvatarBg }]}>
                <MaterialIcons name="support-agent" size={16} color="#fff" />
              </View>
            ) : (
              <View style={styles.avatarSpacer} />
            )}
          </View>
        )}

        <View style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleOther,
          isMe && !isNextSame ? { borderBottomRightRadius: 4 } : {},
          !isMe && !isNextSame ? { borderBottomLeftRadius: 4 } : {},
        ]}>
          <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isMe ? styles.timeMe : styles.timeOther]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <MaterialIcons name="support-agent" size={24} color="#fff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Support</Text>
              <Text style={styles.headerSubtitle}>Online</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="call-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Chat Area */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Start the conversation...</Text>
            </View>
          }
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={28} color={COLORS.accent} />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? COLORS.accent : COLORS.grayLight }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputText.trim() ? COLORS.white : '#A0A0A0'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#A0A0A0',
    fontSize: 16,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.headerAvatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.greenOnline,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  rowStart: {
    justifyContent: 'flex-start',
  },
  rowEnd: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    width: 28,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSpacer: {
    width: 28,
    height: 28,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleMe: {
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textOther: {
    color: COLORS.textDark,
  },
  textMe: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOther: {
    color: '#8E8E93',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attachButton: {
    padding: 10,
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: COLORS.textDark,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
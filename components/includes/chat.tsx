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

import chatServices from '@/services/api/methods/chatServices';

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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const historyData = await chatServices.getChatHistory();
      
      if (historyData && historyData.length > 0) {
        const formattedHistory: Message[] = historyData.map((msg: any) => ({
          id: msg.id?.toString() || Math.random().toString(),
          text: msg.text || msg.message || '', 
          sender: msg.isMe || msg.sender === 'user' ? 'me' : 'other', 
          timestamp: msg.createdAt 
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formattedHistory);
      } else {
        setMessages([
          {
            id: '1',
            text: 'Hello! Welcome to Rapid InvestSupport. How can I assist you with your portfolio today?',
            sender: 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load chat history', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // --- 2. Send Message via API ---
  const sendMessage = async () => {
    if (inputText.trim().length === 0) return;

    const textToSend = inputText.trim();
    
    setInputText('');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const newMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await chatServices.sendMessage({ message: textToSend });
      
      if (response && (response.reply || response.botMessage)) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const replyMessage: Message = {
          id: response.id?.toString() || (Date.now() + 1).toString(),
          text: response.reply || response.botMessage,
          sender: 'other',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, replyMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
  // --- Header Styles ---
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

  // --- List Styles ---
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

  // --- Avatar in List ---
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

  // --- Bubbles ---
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
  },
  bubbleMe: {
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },

  // --- Text ---
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

  // --- Input Area ---
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
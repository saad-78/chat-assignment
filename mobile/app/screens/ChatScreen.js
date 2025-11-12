import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '../store/slices/chatSlice';
import { getSocket } from '../sockets/socket';
import { fetchConversationWithUser } from '../api/chatService';

export default function ChatScreen({ route, navigation }) {
  const { userId, username } = route.params;
  
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    loadConversation();
  }, [userId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const data = await fetchConversationWithUser(userId, token);
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
        setLocalMessages(data.messages);
        setTimeout(() => scrollToBottom(), 200);
        
        markMessagesAsRead(data.conversationId, data.messages);
      } else {
        setLocalMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = (convId, messages) => {
    const socket = getSocket();
    if (!socket) return;

    messages.forEach(msg => {
      const senderId = msg.senderId?._id || msg.senderId;
      if (senderId !== user._id && msg.status !== 'read') {
        socket.emit('message:read', {
          messageId: msg._id,
          conversationId: convId
        });
      }
    });
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (!conversationId && newMessage.conversationId) {
        setConversationId(newMessage.conversationId);
      }

      setLocalMessages((prev) => {
        const exists = prev.some(m => m._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });

      dispatch(addMessage(newMessage));
      setTimeout(() => scrollToBottom(), 100);

      const senderId = newMessage.senderId?._id || newMessage.senderId;
      if (senderId !== user._id) {
        socket.emit('message:read', {
          messageId: newMessage._id,
          conversationId: newMessage.conversationId
        });
      }
    };

    const handleMessageRead = (data) => {
      setLocalMessages((prev) =>
        prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, status: 'read' }
            : msg
        )
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);

    socket.on('typing:start', (data) => {
      if (data.userId === userId) {
        setIsTyping(true);
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.userId === userId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [userId, conversationId, dispatch, user._id]);

  const scrollToBottom = () => {
    if (flatListRef.current && localMessages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const socket = getSocket();
    const messageData = {
      receiverId: userId,
      content: message.trim(),
      conversationId: conversationId || null,
    };

    socket.emit('message:send', messageData);
    setMessage('');
    handleStopTyping();
  };

  const handleTyping = (text) => {
    setMessage(text);
    const socket = getSocket();

    if (text.length > 0 && conversationId) {
      socket.emit('typing:start', { conversationId, receiverId: userId });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => handleStopTyping(), 1000);
    } else if (text.length === 0) {
      handleStopTyping();
    }
  };

  const handleStopTyping = () => {
    if (conversationId) {
      const socket = getSocket();
      socket.emit('typing:stop', { conversationId, receiverId: userId });
    }
  };

  const renderReadReceipt = (status) => {
    if (status === 'read') {
      return <Text style={styles.readReceipt}>✓✓</Text>;
    } else if (status === 'delivered') {
      return <Text style={styles.deliveredReceipt}>✓✓</Text>;
    } else {
      return <Text style={styles.sentReceipt}>✓</Text>;
    }
  };

  const renderMessage = ({ item }) => {
    const senderId = item.senderId?._id || item.senderId;
    const isMyMessage = senderId === user._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isMyMessage && styles.myTimestamp]}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isMyMessage && renderReadReceipt(item.status)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{username}</Text>
          {isTyping && <Text style={styles.typingIndicator}>typing...</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={localMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || `msg-${index}`}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No messages yet.{'\n'}Start the conversation!
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: 'bold',
    paddingRight: 10,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 5,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  myMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginRight: 5,
  },
  myTimestamp: {
    color: '#e0e0e0',
  },
  readReceipt: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  deliveredReceipt: {
    fontSize: 12,
    color: '#e0e0e0',
    fontWeight: 'bold',
  },
  sentReceipt: {
    fontSize: 12,
    color: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    lineHeight: 24,
  },
});

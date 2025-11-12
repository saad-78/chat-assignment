import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: {}, // { conversationId: [messages] }
  currentConversation: null,
  typingUsers: {},
  loading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const convId = message.conversationId;
      
      if (!convId) return;
      
      if (!state.conversations[convId]) {
        state.conversations[convId] = [];
      }
      
      // Prevent duplicates
      const exists = state.conversations[convId].some(m => m._id === message._id);
      if (!exists) {
        state.conversations[convId].push(message);
      }
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.conversations[conversationId] = messages;
    },
    getConversationMessages: (state, action) => {
      const convId = action.payload;
      return state.conversations[convId] || [];
    },
    setTyping: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {};
      }
      state.typingUsers[conversationId][userId] = isTyping;
    },
    clearChat: (state) => {
      state.conversations = {};
      state.currentConversation = null;
    },
  },
});

export const { 
  setCurrentConversation, 
  addMessage, 
  setMessages, 
  getConversationMessages,
  setTyping, 
  clearChat 
} = chatSlice.actions;

export default chatSlice.reducer;

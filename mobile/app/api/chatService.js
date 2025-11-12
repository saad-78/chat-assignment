import axios from 'axios';
import { API_URL } from '@env';

const API_BASE = `${API_URL}/api`;

export const fetchMessages = async (conversationId, token) => {
  const response = await axios.get(`${API_BASE}/conversations/${conversationId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchConversationWithUser = async (userId, token) => {
  try {
    console.log('🌐 Fetching conversation with user:', userId);
    const response = await axios.get(`${API_BASE}/conversations/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('✅ API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API error:', error.response?.data || error.message);
    throw error;
  }
};

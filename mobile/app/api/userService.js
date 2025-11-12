import axios from 'axios';
import { API_URL } from '@env';

const API_BASE = `${API_URL}/api`;

export const fetchUsers = async (token) => {
  const response = await axios.get(`${API_BASE}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

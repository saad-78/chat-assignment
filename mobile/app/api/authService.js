import axios from 'axios';
import { API_URL } from '@env';

const API_BASE = `${API_URL}/api`;

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE}/auth/register`, userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_BASE}/auth/login`, credentials);
  return response.data;
};

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Navigate to login (handled by app)
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  logout: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/api/auth/logout', { refreshToken });
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// MFA API
export const mfaAPI = {
  generateSecret: async () => {
    const response = await api.post('/api/mfa/generate');
    return response.data;
  },

  verifyAndEnable: async (token: string) => {
    const response = await api.post('/api/mfa/verify-enable', { token });
    return response.data;
  },

  verifyLogin: async (token: string, tempToken: string) => {
    const response = await api.post('/api/mfa/verify-login', {
      token,
      tempToken,
    });
    return response.data;
  },
};

// Account API
export const accountAPI = {
  list: async () => {
    const response = await api.get('/api/accounts');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/api/accounts/${id}`);
    return response.data;
  },

  create: async (data: { accountType: string; initialBalance?: number }) => {
    const response = await api.post('/api/accounts', data);
    return response.data;
  },
};

// Balance API
export const balanceAPI = {
  getAll: async () => {
    const response = await api.get('/api/balances');
    return response.data;
  },

  getAccount: async (id: string) => {
    const response = await api.get(`/api/balances/account/${id}`);
    return response.data;
  },

  getSummary: async (id: string) => {
    const response = await api.get(`/api/balances/account/${id}/summary`);
    return response.data;
  },
};

// Transaction API
export const transactionAPI = {
  list: async (params?: {
    accountId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/api/transactions', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.post(`/api/transactions/${id}/cancel`);
    return response.data;
  },
};

// Transfer API
export const transferAPI = {
  create: async (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
  }) => {
    const response = await api.post('/api/transfers', data);
    return response.data;
  },
};

export default api;



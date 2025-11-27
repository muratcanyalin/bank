import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');

      if (userData && token) {
        // Verify token is still valid
        try {
          const response = await authAPI.getMe();
          setUser(response.user);
        } catch (error) {
          // Token invalid - clear storage
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);

    if (response.mfaRequired) {
      // Handle MFA flow
      throw new Error('MFA_REQUIRED');
    }

    await AsyncStorage.setItem('accessToken', response.accessToken);
    await AsyncStorage.setItem('refreshToken', response.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    setUser(response.user);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    await authAPI.register(data);
    // Auto login after registration
    await login(data.email, data.password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



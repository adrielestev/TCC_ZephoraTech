import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter } from 'react-native';
import { AuthService } from '../features/auth/services/auth.service';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await SecureStore.getItemAsync('Zephora_token');

        if (storedToken) {
          const response = await AuthService.getMe();
          setUser(response);
        }
      } catch (error) {
        console.error('Falha ao restaurar sessão', error);
        await SecureStore.deleteItemAsync('Zephora_token');
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();

    const listener = DeviceEventEmitter.addListener('on401', () => {
      logout();
    });

    return () => listener.remove();
  }, []);

  const login = async (credentials) => {
    const response = await AuthService.login(credentials);

    if (response.token) {
      await SecureStore.setItemAsync('Zephora_token', response.token);
    }

    if (response.user) {
      setUser(response.user);
    } else {
      const userData = await AuthService.getMe();
      setUser(userData);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('Zephora_token');
    setUser(null);
  };

  const updateUserData = (newUserData) => {
    setUser({ ...user, ...newUserData });
  };

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, loading, login, logout, updateUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};

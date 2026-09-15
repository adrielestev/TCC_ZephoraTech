import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../features/auth/services/auth.service';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await AsyncStorage.getItem('@Zephora:token');
        
        if (storedToken) {
          const response = await AuthService.getMe();
          setUser(response); // response = userData dependendo de como a API envia
        }
      } catch (error) {
        console.error('Falha ao restaurar sessão', error);
        await AsyncStorage.removeItem('@Zephora:token');
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  const login = async (credentials) => {
    const response = await AuthService.login(credentials);
    // Supondo que a resposta traz { token, user } ou similar
    // Ajustaremos conforme o schema da API se necessário, mas o padrão é JWT.
    if (response.token) {
       await AsyncStorage.setItem('@Zephora:token', response.token);
    }
    // Caso a API retorne os dados do usuário logo no login, podemos setar. 
    // Se não retornar, podemos chamar getMe().
    if (response.user) {
      setUser(response.user);
    } else {
      const userData = await AuthService.getMe();
      setUser(userData);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@Zephora:token');
    setUser(null);
  };

  const updateUserData = (newUserData) => {
    setUser({ ...user, ...newUserData });
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, login, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

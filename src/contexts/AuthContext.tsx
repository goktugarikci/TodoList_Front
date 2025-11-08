// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/contexts/AuthContext.tsx
/// <reference types="vite/client" />

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { UserPublicInfo, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { playNotificationSound, requestNotificationPermission } from '../utils/notificationHelpers';

export const API_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AuthContextType {
  user: UserPublicInfo | null; 
  token: string | null; 
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean; 
  isLoading: boolean; 
  socket: Socket | null; 
  
  // YENİ: Google Callback için fonksiyon
  setTokenFromCallback: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  const updateToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
    }
  };

  const { data: user, isLoading: isLoadingUser, isError: isGetMeError } = useQuery<
    UserPublicInfo, 
    Error,          
    UserPublicInfo, 
    QueryKey        
  >({
    queryKey: ['me', token], 
    queryFn: authService.getMe, 
    enabled: !!token, 
    retry: false, 
    staleTime: 1000 * 60 * 15, 
    gcTime: 1000 * 60 * 60, 
  });

  useEffect(() => {
    if (isGetMeError) {
      console.error('Oturum doğrulama hatası (isError). Token geçersiz, logout yapılıyor.');
      updateToken(null);
    }
  }, [isGetMeError]); 

  useEffect(() => {
    if (token && user) { 
      const newSocket = io(API_SOCKET_URL, {
        auth: { token }
      });
      setSocket(newSocket);
      
      newSocket.on('connect', () => console.log('Socket.io bağlandı (ID:', newSocket.id, ')'));
      newSocket.on('disconnect', () => console.log('Socket.io bağlantısı kesildi.'));

      newSocket.on('new_notification', (notification) => {
          console.log('Yeni Bildirim:', notification);
          playNotificationSound();
          requestNotificationPermission(
            "Yeni Bildirim",
            notification.message || "Yeni bir bildiriminiz var."
          );
          toast.success(notification.message || 'Yeni bildiriminiz var!');
          
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          // queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      });

      return () => { 
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (socket) { 
      socket.disconnect();
      setSocket(null);
    }
  }, [token, user, queryClient]); 


  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    updateToken(response.token);
    await queryClient.invalidateQueries({ queryKey: ['me'] }); 
    return response;
  };

  const register = async (userData: RegisterRequest) => {
    const response = await authService.register(userData);
    updateToken(response.token);
    await queryClient.invalidateQueries({ queryKey: ['me'] }); 
    return response;
  };

  const logout = () => {
    updateToken(null);
    queryClient.setQueryData(['me'], null); 
    queryClient.clear(); 
    window.location.href = '/'; 
  };
  
  // YENİ: Google Callback'ten gelen token'ı ayarlar
  const setTokenFromCallback = (token: string) => {
    updateToken(token);
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const value: AuthContextType = {
    user: user || null, 
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user, 
    isLoading: isLoadingUser,
    socket,
    setTokenFromCallback, // YENİ
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
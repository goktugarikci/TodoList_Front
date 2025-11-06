// DÜZELTME: Vite'e özel 'import.meta' tiplerini TypeScript'e tanıtmak için
/// <reference types="vite/client" />

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// DÜZELTME: useQuery'nin doğru tipini (QueryKey) import ediyoruz
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { UserPublicInfo, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';
import { io, Socket } from 'socket.io-client';

// API'nizin ana adresini (sondaki /api olmadan) .env dosyanızdan alın
// Vite için VITE_API_URL=http://localhost:5000
export const API_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 1. Context Tipi
interface AuthContextType {
  user: UserPublicInfo | null; // Giriş yapmış kullanıcı bilgisi
  token: string | null; // Mevcut JWT
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean; // Giriş yapmış mı?
  isLoading: boolean; // Token doğrulama (sayfa yenileme) durumu
  socket: Socket | null; // Canlı WebSocket bağlantısı
}

// 2. Context'i Oluştur
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Hook (Kolay kullanım için)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  }
  return context;
};

// 4. Provider (Sağlayıcı) Bileşeni
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  // Token'ı state'e ve localStorage'a kaydetmek için bir yardımcı
  const updateToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
    }
  };

  // React Query: Token varsa, '/api/user/me' endpoint'ine istek atarak kullanıcıyı al
  const { data: user, isLoading: isLoadingUser, isError: isGetMeError } = useQuery<
    UserPublicInfo, // Başarı tipi
    Error,          // Hata tipi
    UserPublicInfo, // Data tipi
    QueryKey        // Key tipi
  >({
    queryKey: ['me', token], // 'me' sorgusu, token'a bağlı
    queryFn: authService.getMe, // Çalıştırılacak servis fonksiyonu
    enabled: !!token, // Sadece token varsa bu sorguyu çalıştır
    retry: false, // Başarısız olursa (örn: 401) tekrar deneme
    staleTime: 1000 * 60 * 15, // 15dk boyunca taze kabul edilir
    gcTime: 1000 * 60 * 60, // 'cacheTime' (v4) yerine 'gcTime' (v5)
    
    // DÜZELTME: 'onError' seçeneği v5'te kaldırıldı.
    // Hata yönetimi için aşağıdaki 'useEffect' kullanılacak.
    // onError: (error: Error) => { ... },
  });

  // DÜZELTME: useQuery'de 'onError' yerine 'isError' durumunu izleyen useEffect
  useEffect(() => {
    if (isGetMeError) {
      console.error('Oturum doğrulama hatası (isError). Token geçersiz, logout yapılıyor.');
      // Token geçersizse (401 vb.), logout yap
      updateToken(null);
    }
  }, [isGetMeError]); // 'isGetMeError' true olduğunda çalışır

  // Socket.io Bağlantı Yönetimi
  useEffect(() => {
    if (token) {
      const newSocket = io(API_SOCKET_URL, {
        auth: { token }
      });
      setSocket(newSocket);
      
      newSocket.on('connect', () => console.log('Socket.io bağlandı (ID:', newSocket.id, ')'));
      newSocket.on('disconnect', () => console.log('Socket.io bağlantısı kesildi.'));

      newSocket.on('new_notification', (notification) => {
          console.log('Yeni Bildirim:', notification);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });

      return () => { 
        newSocket.disconnect();
        setSocket(null);
      };
    }
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, queryClient]); // queryClient'ı da bağımlılıklara ekleyelim


  // Login fonksiyonu
  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    updateToken(response.token);
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    return response;
  };

  // Register fonksiyonu
  const register = async (userData: RegisterRequest) => {
    const response = await authService.register(userData);
    updateToken(response.token);
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    return response;
  };

  // Logout fonksiyonu
  const logout = () => {
    authService.logout();
    updateToken(null);
    queryClient.setQueryData(['me'], null);
  };

  // Context'in tüm uygulamaya sağlayacağı değerler
  // DÜZELTME: 'value' objesine AuthContextType tipini vererek tip uyuşmazlığını gider
  const value: AuthContextType = {
    user: user || null, // data 'undefined' olabilir, 'null'a çevir
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isLoading: isLoadingUser,
    socket,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
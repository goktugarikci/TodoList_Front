// src/api/axiosClient.ts
import axios from 'axios';

// API'nizin temel URL'si (.env dosyasından gelmeli)
// Vite kullanıyorsanız: VITE_API_BASE_URL=http://localhost:5000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (İstek Yakalayıcı)
// Bu, korumalı endpoint'lere gönderilen her isteğe token'ı otomatik ekler.
axiosClient.interceptors.request.use(
  (config) => {
    // Token'ı localStorage'dan (veya state management'tan) al
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Yanıt Yakalayıcı - Opsiyonel ama önerilir)
// 401 (Unauthorized) hatası alındığında kullanıcıyı otomatik logout yapabilir.
axiosClient.interceptors.response.use(
  (response) => {
    // Başarılı yanıtları doğrudan döndür
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token geçersiz veya süresi dolmuş
      console.error('Unauthorized request! Logging out.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      // Kullanıcıyı login sayfasına yönlendir
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
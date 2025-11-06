import axios from 'axios'; // Hata tipini (isAxiosError) kontrol etmek için
import axiosClient from '../api/axiosClient'; // Merkezi Axios istemcimiz
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserPublicInfo, // GET /api/user/me yanıtı için
  SetPasswordRequest, // PUT /api/auth/set-password body'si için
  ApiErrorResponse // API'den gelen { msg: "..." } formatı için
} from '../types/api';

/**
 * Kullanıcı girişi yapmak için API'ye istek gönderir.
 * Başarılı olursa, token'ı ve rolü localStorage'a kaydeder.
 * @param credentials { email, password } içeren LoginRequest objesi.
 * @returns Başarılı giriş yanıtı (AuthResponse).
 * @throws Hata durumunda (API hatası veya ağ hatası) bir Error fırlatır.
 */
const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    // API'nin /api/auth/login endpoint'ine POST isteği
    const response = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data && response.data.token) {
      // Başarılı girişte token'ı ve rolü yerel depolamaya kaydet
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_role', response.data.role);
    } else {
      // API 200 döndü ama token yoksa (beklenmedik durum)
      throw new Error('API yanıtında token bulunamadı.');
    }
    return response.data;
  } catch (error: any) {
    // API'den gelen spesifik {msg} hatasını yakala ve fırlat
    if (axios.isAxiosError(error) && error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    // Genel ağ veya sunucu hatası
    throw new Error('Giriş yapılamadı. Sunucu hatası veya ağ bağlantı sorunu.');
  }
};

/**
 * Yeni kullanıcı kaydı yapar.
 * Başarılı olursa, token'ı ve rolü localStorage'a kaydeder (otomatik giriş).
 * @param userData { name, email, password } içeren RegisterRequest objesi.
 * @returns Başarılı kayıt yanıtı (AuthResponse).
 * @throws Hata durumunda (örn: e-posta zaten kullanımda) bir Error fırlatır.
 */
const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    // API'nin /api/auth/register endpoint'ine POST isteği
    const response = await axiosClient.post<AuthResponse>('/auth/register', userData);
    
    if (response.data && response.data.token) {
      // Kayıt sonrası otomatik giriş için token'ı kaydet
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_role', response.data.role);
    } else {
      throw new Error('API yanıtında token bulunamadı.');
    }
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error('Kayıt olunamadı. Sunucu hatası.');
  }
};

/**
 * Kullanıcı çıkışı yapar. Token'ı ve rolü localStorage'dan temizler.
 * (Socket bağlantısını kesmek AuthContext/SocketContext içinde yapılmalıdır).
 */
const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
  
  // State'in tamamen sıfırlanması için sayfayı yenileyerek login'e yönlendirmek en güvenli yoldur.
  window.location.href = '/login'; 
};

/**
 * Giriş yapmış (token'ı olan) kullanıcının bilgilerini getirir.
 * Bu, uygulama açıldığında veya sayfa yenilendiğinde token'ı doğrulamak için kullanılır.
 * API: GET /api/user/me
 * @returns Giriş yapmış kullanıcının bilgileri (UserPublicInfo).
 * @throws Token geçersizse veya kullanıcı bulunamazsa Error fırlatır.
 */
const getMe = async (): Promise<UserPublicInfo> => {
  try {
    const response = await axiosClient.get<UserPublicInfo>('/user/me');
    // Token geçerliyse, rol bilgisini de güncel tutmak iyi bir pratik olabilir
    if (response.data && response.data.role) {
         localStorage.setItem('user_role', response.data.role);
    }
    return response.data;
  } catch (error: any) {
    // Hata (401 Unauthorized) zaten axios interceptor'ı tarafından yakalanıp
    // logout'a yönlendirebilir, ancak biz yine de hatayı fırlatalım.
    if (axios.isAxiosError(error) && error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error('Kullanıcı oturumu doğrulanamadı.');
  }
};

/**
 * Google ile giriş yapmış kullanıcının yerel parolasını ayarlar.
 * API: PUT /api/auth/set-password
 * @param passwordData { password } içeren SetPasswordRequest objesi.
 * @returns API'den gelen başarı mesajı.
 * @throws Hata durumunda Error fırlatır.
 */
const setPassword = async (passwordData: SetPasswordRequest): Promise<{ msg: string }> => {
  try {
    // API'den { msg: "..." } şeklinde bir yanıt bekliyoruz
    const response = await axiosClient.put<ApiErrorResponse>('/auth/set-password', passwordData);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error('Şifre ayarlanırken bir hata oluştu.');
  }
};

// Tüm auth fonksiyonlarını tek bir obje olarak dışa aktar
export const authService = {
  login,
  register,
  logout,
  getMe,
  setPassword,
  // Not: Google Login (GET /api/auth/google) bu dosyada DEĞİLDİR.
  // Bu işlem, bir React bileşeni (örn: <a href="http://localhost:5000/api/auth/google">)
  // veya window.location.href ile tarayıcı yönlendirmesi olarak ele alınır.
};
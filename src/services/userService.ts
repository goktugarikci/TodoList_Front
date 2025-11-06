// src/services/userService.ts

import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  ApiErrorResponse,
  UserPublicInfo,
  UpdateNameRequest,
  MyTaskSummary, 
  UpdateUsernameRequest,
} from '../types/api';

// types/api.ts'e eklemeniz gereken tipler:
//
// export interface UpdateUsernameRequest {
//   username: string;
// }
//
// export interface ChangePasswordRequest {
//   currentPassword: string;
//   newPassword: string;
// }
//
// API Yanıtı (Hem isim, hem username, hem de resim güncellediğinde bu döner)
// export interface UpdateProfileResponse {
//   msg: string;
//   user: UserPublicInfo;
// }


/**
 * Giriş yapmış (token'ı olan) kullanıcının bilgilerini getirir.
 * API: GET /api/user/me
 */
const getMe = async (): Promise<UserPublicInfo> => {
  try {
    const response = await axiosClient.get<UserPublicInfo>('/user/me');
    // Token geçerliyse, rol bilgisini de güncel tut
    if (response.data && response.data.role) {
      localStorage.setItem('user_role', response.data.role);
    }
    return response.data;
  } catch (error: unknown) {
    // 401 Unauthorized hatası interceptor tarafından yakalanıp logout'a yönlendirir,
    // ancak biz yine de hatayı fırlatalım.
    throw new Error(getErrorMessage(error, 'Kullanıcı oturumu doğrulanamadı.'));
  }
};

/**
 * Giriş yapmış kullanıcının parolasını değiştirir.
 * API: PUT /api/user/change-password
 */
const changePassword = async (data: { currentPassword: string, newPassword: string }): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.put<ApiErrorResponse>('/user/change-password', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Şifre değiştirilemedi.'));
  }
};

/**
 * Giriş yapmış kullanıcının görünen adını (name) günceller.
 * API: PUT /api/user/update-name
 */
const updateName = async (data: UpdateNameRequest): Promise<{ msg: string, user: UserPublicInfo }> => {
  try {
    const response = await axiosClient.put<{ msg: string, user: UserPublicInfo }>('/user/update-name', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'İsim güncellenemedi.'));
  }
};

/**
 * --- YENİ FONKSİYON ---
 * Giriş yapmış kullanıcının kullanıcı adını (username) günceller.
 * API: PUT /api/user/update-username
 */
const updateUsername = async (data: UpdateUsernameRequest): Promise<{ msg: string, user: UserPublicInfo }> => {
  try {
    const response = await axiosClient.put<{ msg: string, user: UserPublicInfo }>('/user/update-username', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Kullanıcı adı güncellenemedi.'));
  }
};


/**
 * Giriş yapmış kullanıcının profil resmini yükler.
 * API: POST /api/user/profile-image
 */
const uploadProfileImage = async (file: File): Promise<{ msg: string, user: UserPublicInfo }> => {
  const formData = new FormData();
  formData.append('profileImage', file); // Backend'deki routes/user.routes.js'in beklediği alan adı

  try {
    const response = await axiosClient.post<{ msg: string, user: UserPublicInfo }>(
      '/user/profile-image',
      formData,
      {
        // Axios, FormData gönderirken 'Content-Type': 'multipart/form-data' 
        // başlığını ve sınırları (boundary) otomatik olarak ayarlar.
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Profil resmi yüklenemedi.'));
  }
};

/**
 * Giriş yapmış kullanıcının atanmış tüm görevlerini getirir (filtrelenebilir/sıralanabilir).
 * API: GET /api/user/me/tasks
 */
const getMyAssignedTasks = async (params: {
  boardId?: string;
  status?: string;
  priority?: string;
  dueDateBefore?: string;
  dueDateAfter?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}): Promise<MyTaskSummary[]> => {
  try {
    const response = await axiosClient.get<MyTaskSummary[]>('/user/me/tasks', { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Atanmış görevler getirilemedi.'));
  }
};

// Not: getMyTimeEntries fonksiyonu, kod tekrarını önlemek için
// 'timeEntryService.ts' dosyasına taşındı.

export const userService = {
  getMe,
  changePassword,
  updateName,
  updateUsername, // YENİ
  uploadProfileImage,
  getMyAssignedTasks, 
};
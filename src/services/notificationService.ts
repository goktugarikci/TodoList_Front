import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type { PaginatedNotifications } from '../types/api';

interface GetNotificationParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/**
 * Kullanıcının bildirimlerini listeler (sayfalı, filtrelenmiş).
 * API: GET /api/notifications
 */
const getNotifications = async (params: GetNotificationParams = {}): Promise<PaginatedNotifications> => {
  try {
    const response = await axiosClient.get<PaginatedNotifications>('/notifications', { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bildirimler getirilemedi.'));
  }
};

/**
 * Tek bir bildirimi okundu olarak işaretler.
 * API: PATCH /api/notifications/:notificationId/read
 */
const markAsRead = async (notificationId: string): Promise<{ msg: string }> => {
  try {
    // PATCH metodu için body {} göndermek gerekebilir
    const response = await axiosClient.patch<{ msg: string }>(`/notifications/${notificationId}/read`, {});
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bildirim okundu olarak işaretlenemedi.'));
  }
};

/**
 * Tüm okunmamış bildirimleri okundu olarak işaretler.
 * API: POST /api/notifications/read-all
 */
const markAllAsRead = async (): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.post<{ msg: string }>('/notifications/read-all', {});
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Tüm bildirimler okundu olarak işaretlenemedi.'));
  }
};

export const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
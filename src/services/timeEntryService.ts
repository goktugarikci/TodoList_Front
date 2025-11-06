import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper'; // Hata yardımcısını import et
import type {
  TimeEntry,
  CreateManualTimeEntryRequest,
  StopTimeEntryRequest,
  PaginatedTimeEntries, // 'getMyTimeEntries' ve 'getEntriesForTask' tarafından kullanılacak
  TimeEntryWithUser,    // 'getEntriesForTask' tarafından kullanılacak
  TimeEntryWithTask     // 'getMyTimeEntries' tarafından kullanılacak
} from '../types/api';

/**
 * Bir görev için zamanlayıcıyı başlatır.
 * API: POST /api/tasks/:taskId/time-entries/start
 */
const startTimer = async (taskId: string): Promise<TimeEntry> => {
  try {
    const response = await axiosClient.post<TimeEntry>(`/tasks/${taskId}/time-entries/start`, {});
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zamanlayıcı başlatılamadı.'));
  }
};

/**
 * Bir görev için çalışan zamanlayıcıyı durdurur.
 * API: POST /api/tasks/:taskId/time-entries/stop
 */
const stopTimer = async (taskId: string, data: StopTimeEntryRequest = {}): Promise<TimeEntry> => {
  try {
    const response = await axiosClient.post<TimeEntry>(`/tasks/${taskId}/time-entries/stop`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zamanlayıcı durdurulamadı.'));
  }
};

/**
 * Bir göreve manuel zaman girişi ekler.
 * API: POST /api/tasks/:taskId/time-entries
 */
const addManualEntry = async (taskId: string, data: CreateManualTimeEntryRequest): Promise<TimeEntry> => {
  try {
    const response = await axiosClient.post<TimeEntry>(`/tasks/${taskId}/time-entries`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Manuel zaman girişi eklenemedi.'));
  }
};

/**
 * Bir görevin zaman kayıtlarını listeler (sayfalı).
 * API: GET /api/tasks/:taskId/time-entries
 * (Bu fonksiyon 'TimeEntryWithUser' tipini kullanır - 'PaginatedTimeEntries' içinde)
 */
const getEntriesForTask = async (taskId: string, page: number = 1, limit: number = 25): Promise<PaginatedTimeEntries> => {
  try {
    // API yanıtının 'PaginatedTimeEntries' tipinde olmasını bekliyoruz
    // ve bu tipin içindeki 'entries' dizisi 'TimeEntryWithUser[]' tipindedir.
    const response = await axiosClient.get<PaginatedTimeEntries>(`/tasks/${taskId}/time-entries`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görevin zaman kayıtları getirilemedi.'));
  }
};

/**
 * Giriş yapmış kullanıcının zaman kayıtlarını getirir (tarih aralığı, sayfalı).
 * API: GET /api/user/me/time-entries
 * (Bu fonksiyon 'TimeEntryWithTask' tipini kullanır - 'PaginatedTimeEntries' içinde)
 */
const getMyTimeEntries = async (params: { startDate?: string, endDate?: string, page?: number, limit?: number } = {}): Promise<PaginatedTimeEntries> => {
  try {
    // API yanıtının 'PaginatedTimeEntries' tipinde olmasını bekliyoruz
    // ve bu tipin içindeki 'entries' dizisi 'TimeEntryWithTask[]' tipindedir.
    const response = await axiosClient.get<PaginatedTimeEntries>('/user/me/time-entries', { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zaman kayıtlarınız getirilemedi.'));
  }
};

export const timeEntryService = {
  startTimer,
  stopTimer,
  addManualEntry,
  getEntriesForTask,
  getMyTimeEntries,
};
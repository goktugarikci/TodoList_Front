// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/services/timeEntryService.ts
import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  TimeEntry,
  CreateManualTimeEntryRequest,
  StopTimeEntryRequest,
  // DÜZELTME: Ayrı tipler kullanılıyor
  PaginatedTaskTimeEntries,
  PaginatedUserTimeEntries,
  TimeEntryWithUser,
  UpdateManualTimeEntryRequest
} from '../types/api';

/**
 * Bir görev için zamanlayıcıyı başlatır.
 * API: POST /api/tasks/:taskId/time-entries/start
 */
const startTimer = async (taskId: string): Promise<TimeEntryWithUser> => {
  try {
    const response = await axiosClient.post<TimeEntryWithUser>(`/tasks/${taskId}/time-entries/start`, {});
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zamanlayıcı başlatılamadı.'));
  }
};

/**
 * Bir görev için çalışan zamanlayıcıyı durdurur.
 * API: POST /api/tasks/:taskId/time-entries/stop
 */
const stopTimer = async (taskId: string, data: StopTimeEntryRequest = {}): Promise<TimeEntryWithUser> => {
  try {
    const response = await axiosClient.post<TimeEntryWithUser>(`/tasks/${taskId}/time-entries/stop`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zamanlayıcı durdurulamadı.'));
  }
};

/**
 * Bir göreve manuel zaman girişi ekler.
 * API: POST /api/tasks/:taskId/time-entries
 */
const addManualEntry = async (taskId: string, data: CreateManualTimeEntryRequest): Promise<TimeEntryWithUser> => {
  try {
    const response = await axiosClient.post<TimeEntryWithUser>(`/tasks/${taskId}/time-entries`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Manuel zaman girişi eklenemedi.'));
  }
};

/**
 * Bir görevin zaman kayıtlarını listeler (sayfalı).
 * API: GET /api/tasks/:taskId/time-entries
 */
const getEntriesForTask = async (taskId: string, page: number = 1, limit: number = 25): Promise<PaginatedTaskTimeEntries> => {
  try {
    // DÜZELTME: Doğru paginated tipi kullan
    const response = await axiosClient.get<PaginatedTaskTimeEntries>(`/tasks/${taskId}/time-entries`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görevin zaman kayıtları getirilemedi.'));
  }
};

/**
 * Giriş yapmış kullanıcının zaman kayıtlarını getirir.
 * API: GET /api/user/me/time-entries
 */
const getMyTimeEntries = async (params: { startDate?: string, endDate?: string, page?: number, limit?: number } = {}): Promise<PaginatedUserTimeEntries> => {
  try {
    // DÜZELTME: Doğru paginated tipi kullan
    const response = await axiosClient.get<PaginatedUserTimeEntries>('/user/me/time-entries', { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zaman kayıtlarınız getirilemedi.'));
  }
};

// === YENİ FONKSİYONLAR ===

/**
 * Mevcut bir zaman girişini günceller (Süre, Tarih, Not).
 * API: PUT /api/time-entries/:entryId
 */
const updateTimeEntry = async (entryId: string, data: UpdateManualTimeEntryRequest): Promise<TimeEntryWithUser> => {
  try {
    const response = await axiosClient.put<TimeEntryWithUser>(`/time-entries/${entryId}`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zaman kaydı güncellenemedi.'));
  }
};

/**
 * Mevcut bir zaman girişini siler.
 * API: DELETE /api/time-entries/:entryId
 */
const deleteTimeEntry = async (entryId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/time-entries/${entryId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zaman kaydı silinemedi.'));
  }
};
// === BİTİŞ ===


export const timeEntryService = {
  startTimer,
  stopTimer,
  addManualEntry,
  getEntriesForTask,
  getMyTimeEntries,
  // YENİ:
  updateTimeEntry,
  deleteTimeEntry,
};
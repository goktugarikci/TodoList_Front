import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
// DÜZELTME: CreateTaskListRequest artık 'api.ts' içinde mevcut
import type { TaskList, CreateTaskListRequest } from '../types/api';

/**
 * Bir panoya yeni bir görev listesi (sütun) oluşturur.
 * API: POST /api/tasklists
 *
 */
const createList = async (data: CreateTaskListRequest): Promise<TaskList> => {
  try {
    const response = await axiosClient.post<TaskList>('/tasklists', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Liste oluşturulamadı.'));
  }
};

/**
 * Bir görev listesinin başlığını günceller.
 * API: PUT /api/tasklists/:listId
 */
const updateListTitle = async (listId: string, title: string): Promise<TaskList> => {
  try {
    const response = await axiosClient.put<TaskList>(`/tasklists/${listId}`, { title });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Liste başlığı güncellenemedi.'));
  }
};

/**
 * Bir görev listesini (ve içindeki tüm görevleri) siler.
 * API: DELETE /api/tasklists/:listId
 */
const deleteList = async (listId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/tasklists/${listId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Liste silinemedi.'));
  }
};

export const taskListService = {
  createList,
  updateListTitle,
  deleteList,
};
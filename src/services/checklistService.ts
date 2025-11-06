import axiosClient from '../api/axiosClient';
import type {
  ChecklistItemDetailed,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  AssignRequest, // { assignUserId: string }
  UnassignRequest // { unassignUserId: string }
} from '../types/api';
import { getErrorMessage } from '../utils/errorHelper';


/**
 * Bir ana göreve yeni bir alt görev (checklist item) ekler.
 * API: POST /api/checklist/task/:taskId
 */
const createChecklistItem = async (taskId: string, data: CreateChecklistItemRequest): Promise<ChecklistItemDetailed> => {
  try {
    const response = await axiosClient.post<ChecklistItemDetailed>(`/checklist/task/${taskId}`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Alt görev eklenemedi.'));
  }
};

/**
 * Bir alt görevin tamamlanma durumunu (tikini) değiştirir.
 * API: PUT /api/checklist/:itemId/toggle
 */
const toggleChecklistItem = async (itemId: string): Promise<ChecklistItemDetailed> => {
  try {
    const response = await axiosClient.put<ChecklistItemDetailed>(`/checklist/${itemId}/toggle`, {});
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Alt görev durumu değiştirilemedi.'));
  }
};

/**
 * Bir alt görevin metnini veya bitiş tarihini günceller.
 * API: PUT /api/checklist/:itemId
 */
const updateChecklistItem = async (itemId: string, data: UpdateChecklistItemRequest): Promise<ChecklistItemDetailed> => {
  try {
    const response = await axiosClient.put<ChecklistItemDetailed>(`/checklist/${itemId}`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Alt görev güncellenemedi.'));
  }
};

/**
 * Bir alt görevi (ve bağlı resimlerini) siler.
 * API: DELETE /api/checklist/:itemId
 */
const deleteChecklistItem = async (itemId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/checklist/${itemId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Alt görev silinemedi.'));
  }
};

/**
 * Bir alt göreve kullanıcı atar.
 * API: POST /api/checklist/:itemId/assign
 */
const assignToChecklistItem = async (itemId: string, data: AssignRequest): Promise<ChecklistItemDetailed> => {
  try {
    const response = await axiosClient.post<ChecklistItemDetailed>(`/checklist/${itemId}/assign`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Alt göreve atama yapılamadı.'));
  }
};

/**
 * Bir alt görevden kullanıcı atamasını kaldırır.
 * API: POST /api/checklist/:itemId/unassign
 */
const unassignFromChecklistItem = async (itemId: string, data: UnassignRequest): Promise<ChecklistItemDetailed> => {
  try {
    const response = await axiosClient.post<ChecklistItemDetailed>(`/checklist/${itemId}/unassign`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Alt görev ataması kaldırılamadı.'));
  }
};

/**
 * Bir alt göreve resim(ler) yükler (Max 5).
 * API: POST /api/checklist/:itemId/images
 * @param files Yüklenecek dosya listesi (File[])
 */
const addImagesToChecklistItem = async (itemId: string, files: File[]): Promise<ChecklistItemDetailed> => {
  const formData = new FormData();
  if (files.length === 0) {
      throw new Error("Yüklenecek dosya seçilmedi.");
  }
  files.forEach(file => {
    formData.append('images', file); // API'nin beklediği alan adı 'images'
  });

  try {
    const response = await axiosClient.post<ChecklistItemDetailed>(
      `/checklist/${itemId}/images`,
      formData,
      {
        headers: {
          // 'Content-Type': 'multipart/form-data', // Axios bunu FormData için otomatik ayarlar
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Resimler yüklenemedi.'));
  }
};

/**
 * Bir alt görevden belirli bir resmi siler.
 * API: DELETE /api/checklist/image/:imageId
 */
const deleteChecklistImage = async (imageId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/checklist/image/${imageId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Resim silinemedi.'));
  }
};


export const checklistService = {
  createChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  assignToChecklistItem,
  unassignFromChecklistItem,
  addImagesToChecklistItem,
  deleteChecklistImage,
};  
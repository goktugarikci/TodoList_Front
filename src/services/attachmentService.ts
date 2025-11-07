// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/services/attachmentService.ts
import axiosClient from '../api/axiosClient';
// DÜZELTME: 'fro' -> 'from'
import { getErrorMessage } from '../utils/errorHelper'; 
import type { TaskAttachment } from '../types/api'; 

/**
 * Bir göreve bir veya daha fazla dosya eki yükler (Form-Data).
 * API: POST /api/tasks/:taskId/attachments
 * @param taskId - Dosyaların ekleneceği görevin ID'si
 * @param files - Yüklenecek dosya listesi (File[])
 */
const uploadAttachments = async (taskId: string, files: File[]): Promise<TaskAttachment[]> => {
  const formData = new FormData();
  if (files.length === 0) {
      throw new Error("Yüklenecek dosya seçilmedi.");
  }
  
  files.forEach(file => {
    formData.append('attachments', file); // API'nin beklediği alan adı 'attachments'
  });

  try {
    const response = await axiosClient.post<TaskAttachment[]>(
      `/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          // 'Content-Type': 'multipart/form-data', // Axios bunu FormData için otomatik ayarlar
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Dosya ekleri yüklenemedi.'));
  }
};

/**
 * Bir görevin tüm eklerini listeler.
 * API: GET /api/tasks/:taskId/attachments
 */
const getAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
  try {
    const response = await axiosClient.get<TaskAttachment[]>(`/tasks/${taskId}/attachments`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Dosya ekleri getirilemedi.'));
  }
};

/**
 * Bir dosya ekini siler (Yetki: Yükleyen veya Admin/Creator).
 * API: DELETE /api/attachments/:attachmentId
 */
const deleteAttachment = async (attachmentId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/attachments/${attachmentId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Dosya eki silinemedi.'));
  }
};

export const attachmentService = {
  uploadAttachments,
  getAttachments,
  deleteAttachment,
};
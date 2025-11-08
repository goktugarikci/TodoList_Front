// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/services/commentService.ts
import axiosClient from '../api/axiosClient';
import type {
  TaskComment,
  CreateCommentRequest
} from '../types/api';
import { getErrorMessage } from '../utils/errorHelper';

/**
 * Bir göreve yeni bir yorum ekler.
 * API: POST /api/tasks/:taskId/comments
 */
const createComment = async (taskId: string, data: CreateCommentRequest): Promise<TaskComment> => {
  try {
    const response = await axiosClient.post<TaskComment>(`/tasks/${taskId}/comments`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Yorum eklenemedi.'));
  }
};

/**
 * Bir görevin tüm yorumlarını listeler.
 * API: GET /api/tasks/:taskId/comments
 * DÜZELTME: Fonksiyon adı 'getCommentsForTask' olarak değiştirildi
 */
const getCommentsForTask = async (taskId: string): Promise<TaskComment[]> => {
  try {
    const response = await axiosClient.get<TaskComment[]>(`/tasks/${taskId}/comments`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Yorumlar getirilemedi.'));
  }
};

/**
 * Bir yorumu siler (Yetki: Yazan kişi veya Admin).
 * API: DELETE /api/comments/:commentId
 */
const deleteComment = async (commentId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/comments/${commentId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Yorum silinemedi.'));
  }
};

export const commentService = {
  createComment,
  // DÜZELTME: 'getCommentsForTask' eklendi (image_1b9172.png hatası)
  getCommentsForTask, 
  deleteComment,
};
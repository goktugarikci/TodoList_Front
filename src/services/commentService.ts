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
const addComment = async (taskId: string, data: CreateCommentRequest): Promise<TaskComment> => {
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
 */
const getComments = async (taskId: string): Promise<TaskComment[]> => {
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
  addComment,
  getComments,
  deleteComment,
};
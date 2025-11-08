// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/services/reactionService.ts
import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
// DÜZELTME: Backend artık ReactionGroupResponse yerine 'ReactionSummary' dizisi döndürüyor
import type { ReactionRequest, ReactionSummary } from '../types/api'; 

// DÜZELTME: API yanıt tipi
interface ReactionToggleResponse {
  message: string;
  reactions: ReactionSummary[];
}

/**
 * Bir göreve reaksiyon ekler veya kaldırır (toggle).
 * API: POST /api/tasks/:taskId/reactions
 * DÜZELTME: Dönüş tipi 'ReactionToggleResponse' olarak güncellendi
 */
const toggleTaskReaction = async (taskId: string, data: ReactionRequest): Promise<ReactionToggleResponse> => {
  try {
    const response = await axiosClient.post<ReactionToggleResponse>(`/tasks/${taskId}/reactions`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev reaksiyonu işlenemedi.'));
  }
};

/**
 * Bir yoruma reaksiyon ekler veya kaldırır (toggle).
 * API: POST /api/comments/:commentId/reactions
 * DÜZELTME: Dönüş tipi 'ReactionToggleResponse' olarak güncellendi
 */
const toggleCommentReaction = async (commentId: string, data: ReactionRequest): Promise<ReactionToggleResponse> => {
  try {
    const response = await axiosClient.post<ReactionToggleResponse>(`/comments/${commentId}/reactions`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Yorum reaksiyonu işlenemedi.'));
  }
};

export const reactionService = {
  toggleTaskReaction,
  toggleCommentReaction,
};
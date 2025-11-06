import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type { ReactionRequest, ReactionGroupResponse } from '../types/api';

/**
 * Bir göreve reaksiyon ekler veya kaldırır (toggle).
 * API: POST /api/tasks/:taskId/reactions
 */
const toggleTaskReaction = async (taskId: string, data: ReactionRequest): Promise<ReactionGroupResponse> => {
  try {
    const response = await axiosClient.post<ReactionGroupResponse>(`/tasks/${taskId}/reactions`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev reaksiyonu işlenemedi.'));
  }
};

/**
 * Bir yoruma reaksiyon ekler veya kaldırır (toggle).
 * API: POST /api/comments/:commentId/reactions
 */
const toggleCommentReaction = async (commentId: string, data: ReactionRequest): Promise<ReactionGroupResponse> => {
  try {
    const response = await axiosClient.post<ReactionGroupResponse>(`/comments/${commentId}/reactions`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Yorum reaksiyonu işlenemedi.'));
  }
};

export const reactionService = {
  toggleTaskReaction,
  toggleCommentReaction,
};
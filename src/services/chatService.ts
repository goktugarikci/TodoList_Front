import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  MessageWithAuthor,
  ConversationSummary,
  PaginatedDirectMessages
} from '../types/api';

/**
 * Bir panonun (grup sohbeti) mesaj geçmişini getirir.
 * API: GET /api/messages/board/:boardId
 */
const getGroupMessages = async (boardId: string): Promise<MessageWithAuthor[]> => {
  try {
    const response = await axiosClient.get<MessageWithAuthor[]>(`/messages/board/${boardId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Grup mesajları getirilemedi.'));
  }
};

/**
 * Kullanıcının özel konuşmalarını (DM listesi) getirir.
 * API: GET /api/dm/conversations
 */
const getMyConversations = async (): Promise<ConversationSummary[]> => {
  try {
    const response = await axiosClient.get<ConversationSummary[]>('/dm/conversations');
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Özel konuşmalar getirilemedi.'));
  }
};

/**
 * Belirli bir kullanıcıyla olan özel mesaj geçmişini getirir (sayfalı).
 * API: GET /api/dm/:userId2
 */
const getDirectMessages = async (userId2: string, page: number = 1, limit: number = 30): Promise<PaginatedDirectMessages> => {
  try {
    const response = await axiosClient.get<PaginatedDirectMessages>(`/dm/${userId2}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Mesaj geçmişi getirilemedi.'));
  }
};

export const chatService = {
  getGroupMessages,
  getMyConversations,
  getDirectMessages,
};
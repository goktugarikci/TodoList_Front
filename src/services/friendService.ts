import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  FriendInfo,
  FriendRequestResponse,
  SendFriendRequest,
  RespondFriendRequest,
  FriendRequest, // Prisma tipine göre (veya FriendRequestInfo)
} from '../types/api';

/**
 * Arkadaş listesini (online statüleriyle birlikte) getirir.
 * API: GET /api/friends
 */
const listFriends = async (): Promise<FriendInfo[]> => {
  try {
    const response = await axiosClient.get<FriendInfo[]>('/friends');
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Arkadaşlar getirilemedi.'));
  }
};

/**
 * Bekleyen (gelen/giden) arkadaşlık isteklerini listeler.
 * API: GET /api/friends/requests
 */
const listPendingRequests = async (): Promise<FriendRequestResponse> => {
  try {
    const response = await axiosClient.get<FriendRequestResponse>('/friends/requests');
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'İstekler getirilemedi.'));
  }
};

/**
 * Kullanıcı adı veya e-posta ile arkadaşlık isteği gönderir.
 * API: POST /api/friends/request
 */
const sendFriendRequest = async (data: SendFriendRequest): Promise<FriendRequest> => {
  try {
    const response = await axiosClient.post<FriendRequest>('/friends/request', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'İstek gönderilemedi.'));
  }
};

/**
 * Bir arkadaşlık isteğini yanıtlar (Kabul/Red).
 * API: PUT /api/friends/requests/:requestId
 */
const respondToRequest = async (requestId: string, data: RespondFriendRequest): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.put<{ msg: string }>(`/friends/requests/${requestId}`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'İstek yanıtlanamadı.'));
  }
};

/**
 * Bir arkadaşı siler (Unfriend).
 * API: DELETE /api/friends/:friendId
 */
const removeFriend = async (friendId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/friends/${friendId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Arkadaş silinemedi.'));
  }
};

export const friendService = {
  listFriends,
  listPendingRequests,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
};
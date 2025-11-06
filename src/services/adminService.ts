import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  AdminBoardSummary,
  BoardDetailed,
  AdminUserSummary,
  AdminUserDetailed,
  SystemStats,
  PaginatedActivityLogs,
  BulkMessageRequest,
  ChangeUserRoleRequest,
  SetUserStatusRequest,
  TransferOwnershipRequest,
  ApiErrorResponse
} from '../types/api';

// === Pano Yönetimi ===
const getAllBoards = async (): Promise<AdminBoardSummary[]> => {
  try {
    const response = await axiosClient.get<AdminBoardSummary[]>('/admin/boards');
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Tüm panolar getirilemedi.')); }
};

const getBoardDetailsAdmin = async (boardId: string): Promise<BoardDetailed> => {
  try {
    const response = await axiosClient.get<BoardDetailed>(`/admin/boards/${boardId}`);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Pano detayı getirilemedi.')); }
};

const deleteAnyBoard = async (boardId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<ApiErrorResponse>(`/admin/boards/${boardId}`);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Pano silinemedi.')); }
};

const transferBoardOwnership = async (boardId: string, data: TransferOwnershipRequest): Promise<{ msg: string, board: any }> => {
  try {
    const response = await axiosClient.patch<{ msg: string, board: any }>(`/admin/boards/${boardId}/transfer-ownership`, data);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Sahiplik aktarılamadı.')); }
};

// === Kullanıcı Yönetimi ===
const getAllUsers = async (): Promise<AdminUserSummary[]> => {
  try {
    const response = await axiosClient.get<AdminUserSummary[]>('/admin/users');
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Kullanıcılar getirilemedi.')); }
};

const getUserDetailsAdmin = async (userId: string): Promise<AdminUserDetailed> => {
  try {
    const response = await axiosClient.get<AdminUserDetailed>(`/admin/users/${userId}`);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Kullanıcı detayı getirilemedi.')); }
};

const changeUserRole = async (userId: string, data: ChangeUserRoleRequest): Promise<AdminUserSummary> => {
  try {
    const response = await axiosClient.put<AdminUserSummary>(`/admin/users/${userId}/role`, data);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Kullanıcı rolü değiştirilemedi.')); }
};

const setUserStatus = async (userId: string, data: SetUserStatusRequest): Promise<AdminUserSummary> => {
  try {
    const response = await axiosClient.put<AdminUserSummary>(`/admin/users/${userId}/status`, data);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Kullanıcı durumu değiştirilemedi.')); }
};

const deleteUser = async (userId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<ApiErrorResponse>(`/admin/users/${userId}`);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Kullanıcı silinemedi.')); }
};

// === İçerik Yönetimi ===
const deleteAnyComment = async (commentId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<ApiErrorResponse>(`/admin/comments/${commentId}`);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Yorum silinemedi.')); }
};

const deleteAnyAttachment = async (attachmentId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<ApiErrorResponse>(`/admin/attachments/${attachmentId}`);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Ek silinemedi.')); }
};

// === Raporlama ===
const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await axiosClient.get<SystemStats>('/admin/stats');
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Sistem istatistikleri getirilemedi.')); }
};

const getActivityLogs = async (params: { userId?: string, actionType?: string, startDate?: string, endDate?: string, page?: number, limit?: number } = {}): Promise<PaginatedActivityLogs> => {
  try {
    const response = await axiosClient.get<PaginatedActivityLogs>('/admin/activity', { params });
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Aktivite logları getirilemedi.')); }
};

// === Diğer ===
const sendBulkMessage = async (data: BulkMessageRequest): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.post<ApiErrorResponse>('/admin/bulk-message', data);
    return response.data;
  } catch (error: unknown) { throw new Error(getErrorMessage(error, 'Toplu mesaj gönderilemedi.')); }
};


export const adminService = {
  getAllBoards,
  getBoardDetailsAdmin,
  deleteAnyBoard,
  transferBoardOwnership,
  getAllUsers,
  getUserDetailsAdmin,
  changeUserRole,
  setUserStatus,
  deleteUser,
  deleteAnyComment,
  deleteAnyAttachment,
  getSystemStats,
  getActivityLogs,
  sendBulkMessage,
};
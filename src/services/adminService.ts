// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/services/adminService.ts
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
  ApiErrorResponse,
  
  // DÜZELTME: Eksik tipler eklendi
  SupportTicket,
  SupportTicketSummary,
  SupportTicketDetailed,
  TicketStatus,
  AssignTicketRequest,
  ChangeUserRoleRequest, // (Bu tiplerin 'types/api.ts' dosyanızda olduğunu varsayıyorum)
  SetUserStatusRequest,
  TransferOwnershipRequest
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

// === YENİ: Destek Bileti Admin Servisleri ===
// (supportService.ts'den buraya taşındı)

/**
 * (Admin) Tüm destek biletlerini listeler.
 * API: GET /api/support/tickets
 */
const getAllTickets = async (): Promise<SupportTicketSummary[]> => {
  try {
    const response = await axiosClient.get<SupportTicketSummary[]>('/support/tickets');
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Destek biletleri getirilemedi.'));
  }
};

/**
 * (Admin) Tek bir destek biletinin detaylarını getirir.
 * API: GET /api/support/tickets/:ticketId
 */
const getTicketById = async (ticketId: string): Promise<SupportTicketDetailed> => {
  try {
    const response = await axiosClient.get<SupportTicketDetailed>(`/support/tickets/${ticketId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bilet detayı getirilemedi.'));
  }
};

/**
 * (Admin) Bir biletin durumunu günceller.
 * API: PUT /api/support/tickets/:ticketId/status
 */
const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<SupportTicket> => {
  try {
    const response = await axiosClient.put<SupportTicket>(`/support/tickets/${ticketId}/status`, { status });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bilet durumu güncellenemedi.'));
  }
};

/**
 * (Admin) Bir bileti bir admine atar.
 * DÜZELTME: Rota '/admin/support/...' olmalı
 * API: PUT /api/admin/support/tickets/:ticketId/assign
 */
const assignTicket = async (ticketId: string, data: AssignTicketRequest): Promise<SupportTicket> => {
  try {
    const response = await axiosClient.put<SupportTicket>(`/admin/support/tickets/${ticketId}/assign`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bilet atanamadı.'));
  }
};

/**
 * (Admin) Bir destek biletini siler.
 * DÜZELTME: Rota '/admin/support/...' olmalı
 * API: DELETE /api/admin/support/tickets/:ticketId
 */
const deleteTicket = async (ticketId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/admin/support/tickets/${ticketId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bilet silinemedi.'));
  }
};
// === BİTİŞ ===


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
  // YENİ EKLENENLER:
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  deleteTicket,
};
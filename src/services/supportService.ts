import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  SupportTicket,
  SupportTicketDetailed,
  SupportTicketSummary,
  SupportTicketComment,
  CreateCommentRequest,
  AssignTicketRequest,
  TicketStatus
} from '../types/api';

/**
 * Yeni bir destek bileti oluşturur (Form-Data).
 * API: POST /api/support/tickets
 * @param formData FormData objesi (subject, description, submittedByName, submittedByEmail, images?)
 */
const createTicket = async (formData: FormData): Promise<SupportTicket> => {
  try {
    const response = await axiosClient.post<SupportTicket>(
      '/support/tickets',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Destek bileti oluşturulamadı.'));
  }
};

/**
 * Bir destek biletine yorum ekler (Bileti açan veya Admin).
 * API: POST /api/support/tickets/:ticketId/comments
 */
const addComment = async (ticketId: string, data: CreateCommentRequest): Promise<SupportTicketComment> => {
  try {
    const response = await axiosClient.post<SupportTicketComment>(`/support/tickets/${ticketId}/comments`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Yorum eklenemedi.'));
  }
};

// --- ADMIN Servisleri (Admin paneli için) ---

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
 * API: PUT /api/support/tickets/:ticketId/assign
 */
const assignTicket = async (ticketId: string, data: AssignTicketRequest): Promise<SupportTicket> => {
  try {
    const response = await axiosClient.put<SupportTicket>(`/support/tickets/${ticketId}/assign`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bilet atanamadı.'));
  }
};

/**
 * (Admin) Bir destek biletini siler.
 * API: DELETE /api/support/tickets/:ticketId
 */
const deleteTicket = async (ticketId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/support/tickets/${ticketId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bilet silinemedi.'));
  }
};

export const supportService = {
  createTicket,
  addComment,
  getAllTickets, // Admin
  getTicketById, // Admin
  updateTicketStatus, // Admin
  assignTicket, // Admin
  deleteTicket, // Admin
};
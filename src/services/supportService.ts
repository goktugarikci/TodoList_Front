// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/services/supportService.ts
import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type {
  SupportTicket,
  SupportTicketDetailed,
  SupportTicketSummary,
  SupportTicketComment,
  CreateCommentRequest,
  // DÜZELTME: Admin istekleri adminService'e taşındı
  // AssignTicketRequest, 
  // TicketStatus
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

// --- ADMIN Servisleri (adminService.ts'e taşındı) ---
// (getAllTickets, getTicketById, updateTicketStatus, assignTicket, deleteTicket)

export const supportService = {
  createTicket,
  addComment,
  // Admin fonksiyonları buradan kaldırıldı
};
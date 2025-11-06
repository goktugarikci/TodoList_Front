import axios from 'axios';
import axiosClient from '../api/axiosClient';
import type {
  ApiErrorResponse,
  BoardSummary,
  BoardDetailed,
  BoardMembership,
  CreateBoardRequest,
  UpdateBoardRequest,
  AddMemberRequest,
  RemoveMemberRequest,
  ChangeRoleRequest,
  ReorderListItemRequest,
  PaginatedActivityLogs,
  BoardReportData,
  Webhook // Webhook tipini de types/api.ts'e eklediğinizi varsayarak
} from '../types/api';

/**
 * Hata mesajını axios hatasından ayıklar.
 * @param error Fırlatılan hata objesi
 * @param defaultMessage Varsayılan hata mesajı
 * @returns API'den gelen { msg: "..." } veya varsayılan mesaj
 */
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error) && error.response?.data?.msg) {
    return (error.response.data as ApiErrorResponse).msg;
  }
  return defaultMessage;
};

// ===================================================================
// 1. PANO (BOARD) ANA İŞLEMLERİ
// ===================================================================

/**
 * Yeni bir Pano (Grup) oluşturur.
 * API: POST /api/boards
 */
const createBoard = async (data: CreateBoardRequest): Promise<BoardDetailed> => {
  try {
    const response = await axiosClient.post<BoardDetailed>('/boards', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Pano oluşturulamadı.'));
  }
};

/**
 * Giriş yapmış kullanıcının üye olduğu panoları listeler.
 * API: GET /api/boards/myboards
 */
const getMyBoards = async (): Promise<BoardSummary[]> => {
  try {
    const response = await axiosClient.get<BoardSummary[]>('/boards/myboards');
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Panolarınız getirilemedi.'));
  }
};

/**
 * Belirli bir panonun tüm detaylarını (listeler, görevler vb.) getirir.
 * Filtreleme ve sıralama parametrelerini destekler.
 * API: GET /api/boards/:boardId
 */
const getBoardById = async (boardId: string, params?: Record<string, string>): Promise<BoardDetailed> => {
  try {
    const response = await axiosClient.get<BoardDetailed>(`/boards/${boardId}`, { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Pano detayları getirilemedi.'));
  }
};

/**
 * Pano adını günceller (Yetki: Admin veya Creator).
 * API: PUT /api/boards/:boardId
 */
const updateBoard = async (boardId: string, data: UpdateBoardRequest): Promise<BoardDetailed> => {
  try {
    const response = await axiosClient.put<BoardDetailed>(`/boards/${boardId}`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Pano güncellenemedi.'));
  }
};

/**
 * Panoyu kalıcı olarak siler (Yetki: Sadece Oluşturan Kişi).
 * API: DELETE /api/boards/:boardId
 */
const deleteBoard = async (boardId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/boards/${boardId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Pano silinemedi.'));
  }
};

// ===================================================================
// 2. ÜYE (MEMBER) YÖNETİMİ
// ===================================================================

/**
 * Panoya e-posta ile yeni üye ekler (Yetki: Creator veya Admin).
 * API: POST /api/boards/:boardId/members
 */
const addMemberByEmail = async (boardId: string, data: AddMemberRequest): Promise<BoardMembership> => {
  try {
    const response = await axiosClient.post<BoardMembership>(`/boards/${boardId}/members`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Üye eklenemedi.'));
  }
};

/**
 * Panodan üye çıkarır (Yetki: Creator veya Admin).
 * API: DELETE /api/boards/:boardId/members
 */
const removeMember = async (boardId: string, data: RemoveMemberRequest): Promise<{ msg: string }> => {
  try {
    // Axios 'delete' metodunun body göndermesi için 'data' objesi kullan
    const response = await axiosClient.delete<{ msg: string }>(`/boards/${boardId}/members`, {
      data: data
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Üye çıkarılamadı.'));
  }
};

/**
 * Pano üyesinin rolünü değiştirir (Yetki: Admin).
 * API: PUT /api/boards/:boardId/members/:memberUserId/role
 */
const changeMemberRole = async (boardId: string, memberUserId: string, data: ChangeRoleRequest): Promise<BoardMembership> => {
  try {
    const response = await axiosClient.put<BoardMembership>(`/boards/${boardId}/members/${memberUserId}/role`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Üye rolü değiştirilemedi.'));
  }
};

// ===================================================================
// 3. LİSTE (TASKLIST) SIRALAMA
// ===================================================================

/**
 * Panodaki listelerin (sütunların) sırasını günceller (Sürükle-bırak için).
 * API: PUT /api/boards/:boardId/lists/reorder
 * Yetki: EDITOR veya üstü
 */
const reorderLists = async (boardId: string, data: ReorderListItemRequest[]): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.put<{ msg: string }>(`/boards/${boardId}/lists/reorder`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Liste sırası güncellenemedi.'));
  }
};

// ===================================================================
// 4. PANoya BAĞLI DİĞER ENDPOINT'LER
// ===================================================================

/**
 * Panonun aktivite loglarını getirir.
 * API: GET /api/boards/:boardId/activity
 * Yetki: VIEWER veya üstü
 */
const getBoardActivity = async (boardId: string, page: number = 1, limit: number = 20): Promise<PaginatedActivityLogs> => {
    try {
        const response = await axiosClient.get<PaginatedActivityLogs>(`/boards/${boardId}/activity`, {
            params: { page, limit }
        });
        return response.data;
    } catch (error: unknown) {
        throw new Error(getErrorMessage(error, 'Aktivite logları getirilemedi.'));
    }
};

/**
 * Pano bazlı raporları getirir.
 * API: GET /api/boards/:boardId/reports
 * Yetki: EDITOR veya üstü
 */
const getBoardReports = async (boardId: string, reportType: string, startDate?: string, endDate?: string): Promise<BoardReportData> => {
    try {
        const params: any = { reportType };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await axiosClient.get<BoardReportData>(`/boards/${boardId}/reports`, { params });
        return response.data;
    } catch (error: unknown) {
        throw new Error(getErrorMessage(error, 'Pano raporu getirilemedi.'));
    }
};

/**
 * Panonun webhook'larını listeler.
 * API: GET /api/boards/:boardId/webhooks
 * Yetki: ADMIN
 */
const getBoardWebhooks = async (boardId: string): Promise<Webhook[]> => {
    try {
        const response = await axiosClient.get<Webhook[]>(`/boards/${boardId}/webhooks`);
        return response.data;
    } catch (error: unknown) {
        throw new Error(getErrorMessage(error, 'Webhook\'lar getirilemedi.'));
    }
};


// Tüm fonksiyonları tek bir obje olarak dışa aktar
export const boardService = {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMemberByEmail,
  removeMember,
  changeMemberRole,
  reorderLists,
  getBoardActivity,
  getBoardReports,
  getBoardWebhooks,
};
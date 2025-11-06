import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type { BoardReportData, UserReportData } from '../types/api';

interface GetBoardReportParams {
  reportType: 'completion' | 'overdue' | 'memberPerformance' | string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

interface GetUserReportParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Pano bazlı raporları getirir.
 * API: GET /api/boards/:boardId/reports
 */
const getBoardReports = async (boardId: string, params: GetBoardReportParams): Promise<BoardReportData> => {
  try {
    const response = await axiosClient.get<BoardReportData>(`/boards/${boardId}/reports`, { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Pano raporu getirilemedi.'));
  }
};

/**
 * Kullanıcı bazlı raporları getirir.
 * API: GET /api/reports/users/:userId
 */
const getUserReports = async (userId: string, params: GetUserReportParams = {}): Promise<UserReportData> => {
  try {
    const response = await axiosClient.get<UserReportData>(`/reports/users/${userId}`, { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Kullanıcı raporu getirilemedi.'));
  }
};

export const reportService = {
  getBoardReports,
  getUserReports,
};
import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type { PaginatedActivityLogs } from '../types/api';

interface GetActivityParams {
  page?: number;
  limit?: number;
}

/**
 * Bir panonun aktivite loglarını getirir (sayfalı).
 * API: GET /api/boards/:boardId/activity
 */
const getBoardActivity = async (boardId: string, params: GetActivityParams = {}): Promise<PaginatedActivityLogs> => {
  try {
    const response = await axiosClient.get<PaginatedActivityLogs>(`/boards/${boardId}/activity`, { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Pano aktiviteleri getirilemedi.'));
  }
};

/**
 * Bir görevin aktivite loglarını getirir (sayfalı).
 * API: GET /api/tasks/:taskId/activity
 */
const getTaskActivity = async (taskId: string, params: GetActivityParams = {}): Promise<PaginatedActivityLogs> => {
  try {
    const response = await axiosClient.get<PaginatedActivityLogs>(`/tasks/${taskId}/activity`, { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev aktiviteleri getirilemedi.'));
  }
};

export const activityService = {
  getBoardActivity,
  getTaskActivity,
  // Not: GET /api/admin/activity endpoint'i adminService.ts içindedir.
};
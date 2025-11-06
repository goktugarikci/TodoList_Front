import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type { CalendarEvent, GanttData } from '../types/api';

interface GetDataParams {
  boardIds?: string[];
  startDate: string; // YYYY-MM-DD (Takvim için zorunlu)
  endDate: string; // YYYY-MM-DD (Takvim için zorunlu)
}

/**
 * Takvim görünümü için görevleri/alt görevleri getirir.
 * API: GET /api/calendar
 */
const getCalendarData = async (params: GetDataParams): Promise<CalendarEvent[]> => {
  try {
    // Axios, 'boardIds' dizisini 'boardIds[]=...' olarak otomatik formatlar
    const response = await axiosClient.get<CalendarEvent[]>('/calendar', { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Takvim verisi getirilemedi.'));
  }
};

/**
 * Zaman Çizelgesi/Gantt görünümü için görevleri ve bağımlılıkları getirir.
 * API: GET /api/timeline
 */
const getTimelineData = async (params: Omit<GetDataParams, 'startDate' | 'endDate'> & { startDate?: string, endDate?: string }): Promise<GanttData> => {
  try {
    const response = await axiosClient.get<GanttData>('/timeline', { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Zaman çizelgesi verisi getirilemedi.'));
  }
};

export const viewService = {
  getCalendarData,
  getTimelineData,
};
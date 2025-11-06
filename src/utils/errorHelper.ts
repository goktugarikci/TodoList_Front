// src/utils/errorHelper.ts
import axios from 'axios';
import type { ApiErrorResponse } from '../types/api';

/**
 * Hata mesajını axios hatasından ayıklar.
 * @param error Fırlatılan hata objesi
 * @param defaultMessage Varsayılan hata mesajı
 * @returns API'den gelen { msg: "..." } veya varsayılan mesaj
 */
export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error) && error.response?.data?.msg) {
    return (error.response.data as ApiErrorResponse).msg;
  }
  // Ağ hatası veya başka bir genel hata
  if (error instanceof Error) {
      return error.message;
  }
  return defaultMessage;
};
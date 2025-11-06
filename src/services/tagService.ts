import axiosClient from '../api/axiosClient';
import { getErrorMessage } from '../utils/errorHelper';
import type { Tag } from '../types/api';

interface CreateTagRequest {
  name: string;
  color: string;
  boardId: string;
}

/**
 * Bir panoya yeni bir etiket oluşturur.
 * API: POST /api/tags
 */
const createTag = async (data: CreateTagRequest): Promise<Tag> => {
  try {
    const response = await axiosClient.post<Tag>('/tags', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Etiket oluşturulamadı.'));
  }
};

/**
 * Bir etiketi siler.
 * API: DELETE /api/tags/:tagId
 */
const deleteTag = async (tagId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/tags/${tagId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Etiket silinemedi.'));
  }
};

export const tagService = {
  createTag,
  deleteTag,
};
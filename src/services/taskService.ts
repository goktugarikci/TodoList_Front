import axios from 'axios';
import axiosClient from '../api/axiosClient';
import type {
  ApiErrorResponse,
  TaskDetailed,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  AssignRequest,
  UnassignRequest,
  DependencyRequest,
  DependencyResponse,
} from '../types/api';

/**
 * Hata mesajını axios hatasından ayıklar.
 * @param error Fırlatılan hata objesi
 * @param defaultMessage Varsayılan hata mesajı
 * @returns API'den gelen { msg: "..." } veya varsayılan mesaj
 */
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error) && error.response?.data?.msg) {
    // API'den gelen spesifik hata mesajını kullan
    return (error.response.data as ApiErrorResponse).msg;
  }
  // Değilse, genel bir mesaj döndür
  return defaultMessage;
};

/**
 * Yeni bir görev (kart) oluşturur.
 * API: POST /api/tasks
 */
const createTask = async (data: CreateTaskRequest): Promise<TaskDetailed> => {
  try {
    const response = await axiosClient.post<TaskDetailed>('/tasks', data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev oluşturulamadı.'));
  }
};

/**
 * Bir görevin detaylarını (başlık, öncelik, tarihler, etiketler, durum vb.) günceller.
 * API: PUT /api/tasks/:taskId
 */
const updateTask = async (taskId: string, data: UpdateTaskRequest): Promise<TaskDetailed> => {
  try {
    const response = await axiosClient.put<TaskDetailed>(`/tasks/${taskId}`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev güncellenemedi.'));
  }
};

/**
 * Bir görevi kalıcı olarak siler.
 * API: DELETE /api/tasks/:taskId
 */
const deleteTask = async (taskId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/tasks/${taskId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev silinemedi.'));
  }
};

/**
 * Bir görevi başka bir listeye (sütuna) taşır.
 * API: PATCH /api/tasks/:taskId/move
 */
const moveTask = async (taskId: string, data: MoveTaskRequest): Promise<TaskDetailed> => {
  try {
    const response = await axiosClient.patch<TaskDetailed>(`/tasks/${taskId}/move`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Görev taşınamadı.'));
  }
};

/**
 * Bir göreve kullanıcı atar.
 * API: POST /api/tasks/:taskId/assign
 */
const assignTask = async (taskId: string, data: AssignRequest): Promise<TaskDetailed> => {
  try {
    const response = await axiosClient.post<TaskDetailed>(`/tasks/${taskId}/assign`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Kullanıcı atanamadı.'));
  }
};

/**
 * Bir görevden kullanıcı atamasını kaldırır.
 * API: POST /api/tasks/:taskId/unassign
 */
const unassignTask = async (taskId: string, data: UnassignRequest): Promise<TaskDetailed> => {
  try {
    const response = await axiosClient.post<TaskDetailed>(`/tasks/${taskId}/unassign`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Kullanıcı ataması kaldırılamadı.'));
  }
};

/**
 * Bir göreve bağımlılık (engelleme veya bekleme) ekler.
 * API: POST /api/tasks/:taskId/dependencies
 */
const addDependency = async (taskId: string, data: DependencyRequest): Promise<TaskDetailed> => {
  try {
    // API'nin güncellenmiş görevi (TaskDetailed) döndürdüğünü varsayıyoruz
    const response = await axiosClient.post<TaskDetailed>(`/tasks/${taskId}/dependencies`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bağımlılık eklenemedi.'));
  }
};

/**
 * Bir görevden bağımlılığı kaldırır.
 * API: DELETE /api/tasks/:taskId/dependencies/:dependencyTaskId
 */
const removeDependency = async (taskId: string, dependencyTaskId: string): Promise<{ msg: string }> => {
  try {
    const response = await axiosClient.delete<{ msg: string }>(`/tasks/${taskId}/dependencies/${dependencyTaskId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bağımlılık kaldırılamadı.'));
  }
};

/**
 * Bir görevin bağımlılıklarını (engellediği ve beklediği görevler) listeler.
 * API: GET /api/tasks/:taskId/dependencies
 */
const getDependencies = async (taskId: string): Promise<DependencyResponse> => {
  try {
    const response = await axiosClient.get<DependencyResponse>(`/tasks/${taskId}/dependencies`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Bağımlılıklar getirilemedi.'));
  }
};



// Tüm task fonksiyonlarını tek bir obje olarak dışa aktar
export const taskService = {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  assignTask,
  unassignTask,
  addDependency,
  removeDependency,
  getDependencies,
};
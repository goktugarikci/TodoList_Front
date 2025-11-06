import React, { useState, useEffect, Fragment } from 'react';
import type { TaskDetailed, BoardDetailed, UserAssigneeDto, UserPublicInfo, ChecklistItemDetailed, TaskApprovalStatus } from '../../types/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { taskService } from '../../services/taskService';
import { checklistService } from '../../services/checklistService'; // YENİ
import { getErrorMessage } from '../../utils/errorHelper';
import Modal from '../common/Modal'; // Koyu temalı Modal'ı kullan
import Spinner from '../common/Spinner';
import { toast } from 'react-hot-toast';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react'; // Üye atama için

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDetailed | null;
  board: BoardDetailed | null; // YENİ: Üye listesini almak için
}

/**
 * Görev 2: Görev Detay Modalı
 * Ad değiştirme, silme, tamamlama, atama, checklist işlemleri
 */
const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, board }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [editableTitle, setEditableTitle] = useState(task?.title || '');
  const [editableDescription, setEditableDescription] = useState(task?.description || '');
  
  // YENİ: Checklist için state
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingChecklistItem, setEditingChecklistItem] = useState<ChecklistItemDetailed | null>(null);

  // Modal her açıldığında/task değiştiğinde state'i güncelle
  useEffect(() => {
    if (task) {
      setEditableTitle(task.title);
      setEditableDescription(task.description || '');
    }
  }, [task]);

  if (!task || !board) return null; // Task veya Board yüklenmemişse hiçbir şey gösterme
  
  const boardId = task.taskList.boardId;

  // --- Mutasyonlar (İstek 2'deki eylemler) ---

  // Görevi Silme
  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task.id),
    onSuccess: () => {
      // 'boardDetails' önbelleğinden bu görevi manuel olarak kaldır
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.filter(t => t.id !== task.id)
        }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Görev silindi.');
      onClose(); // Modalı kapat
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev silinemedi.')),
  });

  // Görevi Güncelleme (Ad, Açıklama, Durum vb.)
  const updateTaskMutation = useMutation({
    // DÜZELTME: 'Partial<TaskDetailed>' tipini 'UpdateTaskRequest' tipine uyması için daralt
    mutationFn: (data: { title?: string, description?: string | null, approvalStatus?: TaskApprovalStatus }) => 
      taskService.updateTask(task.id, data),
    onSuccess: (updatedTask) => {
      // 'boardDetails' önbelleğini anlık olarak güncelle
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      // Başlık için 'blur' sonrası state'i senkronize et
      setEditableTitle(updatedTask.title);
      setEditableDescription(updatedTask.description || '');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev güncellenemedi.')),
  });
  
  // --- YENİ: Checklist (Alt Başlık) Mutasyonları ---
  
  // Checklist Item Ekle
  const createChecklistItemMutation = useMutation({
    mutationFn: (text: string) => checklistService.createChecklistItem(task.id, { text }),
    onSuccess: (newItem) => {
      // 'boardDetails' cache'ini anlık güncelle
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task.id ? { ...t, checklistItems: [...t.checklistItems, newItem] } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      setNewChecklistItem('');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev eklenemedi.')),
  });
  
  // Checklist Item Toggle (Tamamlandı İşaretle)
  const toggleChecklistItemMutation = useMutation({
    mutationFn: (itemId: string) => checklistService.toggleChecklistItem(itemId),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task.id ? {
            ...t,
            checklistItems: t.checklistItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
          } : t))
        }));
        return { ...oldData, lists: newListData };
      });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev durumu güncellenemedi.')),
  });
  
  // Checklist Item Sil
  const deleteChecklistItemMutation = useMutation({
    mutationFn: (itemId: string) => checklistService.deleteChecklistItem(itemId),
    onSuccess: (_, itemId) => { // 'variables' (itemId) ikinci parametredir
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task.id ? {
            ...t,
            checklistItems: t.checklistItems.filter(item => item.id !== itemId)
          } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Alt görev silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev silinemedi.')),
  });

  // --- YENİ: Kullanıcı Atama/Çıkarma Mutasyonları ---
  const assignTaskMutation = useMutation({
    mutationFn: (assignUserId: string) => taskService.assignTask(task.id, { assignUserId }),
    onSuccess: (updatedTask) => {
      // 'boardDetails' cache'ini anlık güncelle
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === updatedTask.id ? { ...t, assignees: updatedTask.assignees } : t))
        }));
        return { ...oldData, lists: newListData };
      });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Kullanıcı atanamadı.')),
  });

  const unassignTaskMutation = useMutation({
    mutationFn: (unassignUserId: string) => taskService.unassignTask(task.id, { unassignUserId }),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === updatedTask.id ? { ...t, assignees: updatedTask.assignees } : t))
        }));
        return { ...oldData, lists: newListData };
      });
    },
     onError: (err) => toast.error(getErrorMessage(err, 'Atama kaldırılamadı.')),
  });

  // --- Handler Fonksiyonları ---

  const handleTitleBlur = () => {
    if (editableTitle.trim() && editableTitle !== task.title) {
      updateTaskMutation.mutate({ title: editableTitle });
    } else {
      setEditableTitle(task.title);
    }
  };
  
  const handleDescriptionBlur = () => {
    if (editableDescription !== (task.description || '')) {
      updateTaskMutation.mutate({ description: editableDescription });
    }
  };

  const handleToggleCompleted = () => {
    const newStatus = task.approvalStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
    updateTaskMutation.mutate({ approvalStatus: newStatus });
  };
  
  const handleDeleteTask = () => {
    if (window.confirm(`'${task.title}' görevini kalıcı olarak silmek istediğinizden emin misiniz?`)) {
      deleteTaskMutation.mutate();
    }
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistItem.trim()) {
      createChecklistItemMutation.mutate(newChecklistItem.trim());
    }
  };

  // Atanmamış üyeleri bul (atama menüsü için)
  const assignedUserIds = new Set(task.assignees.map(a => a.id));
  const unassignedMembers = board.members.filter(m => !assignedUserIds.has(m.user.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Görev Detayları" size="lg">
      <div className="grid grid-cols-3 gap-6">
        
        {/* --- Sol Sütun (Detaylar) --- */}
        <div className="col-span-3 md:col-span-2 space-y-4">
          
          {/* Görev Başlığı (İsim Değiştirme) */}
          <input
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-2xl font-bold bg-transparent text-zinc-100 focus:outline-none focus:bg-zinc-900 rounded-md px-2 py-1"
          />
          
          {/* Görev Açıklaması */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Açıklama</label>
            <textarea
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Görev açıklaması ekle..."
              className="w-full h-24 p-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md focus:outline-none focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          {/* Alt Görevler (Checklist) */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-zinc-100">Alt Görevler</h4>
            <div className="space-y-2">
              {task.checklistItems.map(item => (
                <div key={item.id} className="flex items-center group">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => toggleChecklistItemMutation.mutate(item.id)}
                    className="h-4 w-4 text-amber-400 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500"
                  />
                  <span className={`flex-1 ml-3 text-sm ${item.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    {item.text}
                  </span>
                  {/* TODO: Atanmış PP Görseli */}
                  <button 
                    onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                    className="p-1 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddChecklistItem} className="flex space-x-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Yeni alt görev ekle..."
                className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md"
              />
              <button type="submit" disabled={createChecklistItemMutation.isPending} className="px-3 py-2 bg-zinc-700 text-zinc-100 rounded-md hover:bg-zinc-600">
                {createChecklistItemMutation.isPending ? <Spinner size="sm" /> : 'Ekle'}
              </button>
            </form>
          </div>

          {/* Görsel Ekleme (Ekler) */}
          {/* ... (Şimdilik placeholder) ... */}
          
        </div>

        {/* --- Sağ Sütun (Eylemler) --- */}
        <div className="col-span-3 md:col-span-1 space-y-3">
          <h4 className="text-sm font-medium text-zinc-400">Eylemler</h4>

          {/* Tamamlandı Durumu */}
          <button
            onClick={handleToggleCompleted}
            className={`w-full flex items-center justify-center px-4 py-2 font-medium rounded-md transition-colors ${
              task.approvalStatus === 'APPROVED'
                ? 'bg-green-700 text-white hover:bg-green-800'
                // Butonun varsayılan (tamamlanmamış) hali
                : 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600'
            }`}
          >
            {task.approvalStatus === 'APPROVED' ? '✓ Tamamlandı' : 'Tamamlandı Olarak İşaretle'}
          </button>
          
          {/* Kullanıcı Atama/Çıkarma */}
          <div className="space-y-2">
             <label className="block text-sm font-medium text-zinc-400">Atananlar</label>
             <div className="p-2 bg-zinc-900 rounded-md max-h-40 overflow-y-auto">
                {/* Atanmış Kişiler */}
                {task.assignees.map(assignee => (
                  <div key={assignee.id} className="flex items-center justify-between group">
                    <div className="flex items-center">
                      <img
                        className="w-6 h-6 rounded-full object-cover"
                        src={assignee.avatarUrl ? `${API_SOCKET_URL}${assignee.avatarUrl}` : `https://ui-avatars.com/api/?name=${assignee.name}`}
                        alt={assignee.name}
                      />
                      <span className="ml-2 text-sm text-zinc-100">{assignee.name}</span>
                    </div>
                    <button 
                      onClick={() => unassignTaskMutation.mutate(assignee.id)}
                      className="p-1 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))}
                {/* Atanmamış Kişileri Ekleme Menüsü */}
                <Menu as="div" className="relative mt-2">
                  <Menu.Button className="w-full text-sm text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 rounded-md p-2">
                    + Üye Ata...
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                  >
                    <Menu.Items className="absolute w-full mt-1 max-h-48 overflow-y-auto rounded-md bg-zinc-900 border border-zinc-700 shadow-lg z-10">
                      {unassignedMembers.length > 0 ? (
                        unassignedMembers.map(member => (
                          <Menu.Item key={member.user.id}>
                            {({ active }) => (
                              <button
                                onClick={() => assignTaskMutation.mutate(member.user.id)}
                                className={`${active ? 'bg-zinc-700' : ''} w-full text-left text-zinc-100 group flex items-center px-3 py-2 text-sm`}
                              >
                                {member.user.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-zinc-500">Atanacak başka üye yok.</div>
                      )}
                    </Menu.Items>
                  </Transition>
                </Menu>
             </div>
          </div>

          {/* Görevi Silme */}
          <button
            onClick={handleDeleteTask}
            disabled={deleteTaskMutation.isPending}
            className="w-full flex items-center justify-center px-4 py-2 font-medium text-red-400 bg-zinc-700 rounded-md hover:bg-red-600 hover:text-white transition-colors"
          >
            {deleteTaskMutation.isPending ? <Spinner size="sm" /> : 'Görevi Sil'}
          </button>
        </div>
        
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
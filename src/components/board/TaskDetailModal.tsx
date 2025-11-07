// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/TaskDetailModal.tsx
import React, { useState, useEffect, Fragment, useRef } from 'react';
import type { TaskDetailed, BoardDetailed, UserAssigneeDto, UserPublicInfo, ChecklistItemDetailed, TaskApprovalStatus, TaskAttachment, ReactionSummary } from '../../types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query'; 
import { taskService } from '../../services/taskService';
import { checklistService } from '../../services/checklistService';
import { attachmentService } from '../../services/attachmentService';
import { reactionService } from '../../services/reactionService'; // YENİ
import { getErrorMessage } from '../../utils/errorHelper';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { toast } from 'react-hot-toast';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { ModalView } from '../../pages/BoardDetailPage';
import TaskComments from './TaskComments';
import TaskTimeTracker from './TaskTimeTracker';
import ReactionManager from '../common/ReactionManager'; // YENİ

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDetailed | null;
  board: BoardDetailed | null; 
  initialView?: ModalView;
}

// Ek (Attachment) Bileşeni
const AttachmentItem: React.FC<{
  attachment: TaskAttachment;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ attachment, onDelete, isDeleting }) => {
  const isImage = attachment.fileType?.startsWith('image/');
  const fileUrl = `${API_SOCKET_URL}${attachment.url}`;

  return (
    <div className="relative group w-24 h-24 bg-zinc-700 rounded-md overflow-hidden">
      {isImage ? (
        <img src={fileUrl} alt={attachment.fileName} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-2">
          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          <span className="text-xs text-zinc-300 mt-1 text-center truncate" title={attachment.fileName}>
            {attachment.fileName}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-white hover:text-amber-400" title="Görüntüle/İndir">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        </a>
        <button 
          onClick={() => onDelete(attachment.id)} 
          disabled={isDeleting}
          className="p-1 text-white hover:text-red-500 disabled:opacity-50" 
          title="Eki Sil"
        >
          {isDeleting ? <Spinner size="sm" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>}
        </button>
      </div>
    </div>
  );
};


const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, board, initialView = 'details' }) => {
  // --- 1. Hooks (Koşulsuz, en üstte) ---
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [editableTitle, setEditableTitle] = useState(task?.title || '');
  const [editableDescription, setEditableDescription] = useState(task?.description || '');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  const boardId = board?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // === DÜZELTME (TypeScript Hatası): Scroll (kaydırma) ref'leri kaldırıldı ===
  
  // --- 2. Cache Güncelleme Yardımcısı ---
  const updateChecklistItemInCache = (updatedItem: ChecklistItemDetailed) => {
    if (!boardId) return;
    queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
      if (!oldData) return oldData;
      const newListData = oldData.lists.map(list => ({
        ...list,
        tasks: list.tasks.map(t => (t.id === task!.id ? {
          ...t,
          checklistItems: (t.checklistItems || []).map(item => (item.id === updatedItem.id ? updatedItem : item))
        } : t))
      }));
      return { ...oldData, lists: newListData };
    });
  };

  // --- 3. Mutasyonlar (Tümü en üstte tanımlanmalı) ---
  
  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task!.id),
    onSuccess: () => {
      if (!boardId) return;
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({ ...list, tasks: list.tasks.filter(t => t.id !== task!.id) }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Görev silindi.');
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev silinemedi.')),
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: { title?: string, description?: string | null, approvalStatus?: TaskApprovalStatus }) => 
      taskService.updateTask(task!.id, data),
    onSuccess: (updatedTask) => {
      if (!boardId) return;
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({ ...list, tasks: list.tasks.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)) }));
        return { ...oldData, lists: newListData };
      });
      setEditableTitle(updatedTask.title);
      setEditableDescription(updatedTask.description || '');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev güncellenemedi.')),
  });

  // === DÜZELTME (Gecikme Sorunu): Kişi Atama (Optimistic Update) ===
  const assignTaskMutation = useMutation({
    mutationFn: (assignUserId: string) => taskService.assignTask(task!.id, { assignUserId }),
    onMutate: async (assignUserId) => {
      await queryClient.cancelQueries({ queryKey: ['boardDetails', boardId] });
      const previousData = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId]);
      if (previousData && board) {
        const userToAssign = board.members.find(m => m.user.id === assignUserId)?.user;
        if (userToAssign) {
          queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], {
            ...previousData,
            lists: previousData.lists.map(l => ({
              ...l,
              tasks: l.tasks.map(t => (t.id === task!.id ? { ...t, assignees: [...t.assignees, userToAssign] } : t))
            }))
          });
        }
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      toast.error(getErrorMessage(err, 'Kullanıcı atanamadı.'));
      if (context?.previousData) {
        queryClient.setQueryData(['boardDetails', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
  });

  // === DÜZELTME (Gecikme Sorunu): Kişi Çıkarma (Optimistic Update) ===
  const unassignTaskMutation = useMutation({
    mutationFn: (unassignUserId: string) => taskService.unassignTask(task!.id, { unassignUserId }),
    onMutate: async (unassignUserId) => {
      await queryClient.cancelQueries({ queryKey: ['boardDetails', boardId] });
      const previousData = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId]);
      if (previousData) {
        queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], {
          ...previousData,
          lists: previousData.lists.map(l => ({
            ...l,
            tasks: l.tasks.map(t => (t.id === task!.id ? { ...t, assignees: t.assignees.filter(a => a.id !== unassignUserId) } : t))
          }))
        });
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      toast.error(getErrorMessage(err, 'Atama kaldırılamadı.'));
      if (context?.previousData) {
        queryClient.setQueryData(['boardDetails', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
  });

  const createChecklistItemMutation = useMutation({
    mutationFn: (text: string) => checklistService.createChecklistItem(task!.id, { text }),
    onSuccess: (newItem) => {
      if (!boardId) return;
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task!.id ? { ...t, checklistItems: [...(t.checklistItems || []), newItem] } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      setNewChecklistItem('');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev eklenemedi.')),
  });
  
  const toggleChecklistItemMutation = useMutation({
    mutationFn: (itemId: string) => checklistService.toggleChecklistItem(itemId),
    onSuccess: (updatedItem) => updateChecklistItemInCache(updatedItem),
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev durumu güncellenemedi.')),
  });
  
  const deleteChecklistItemMutation = useMutation({
    mutationFn: (itemId: string) => checklistService.deleteChecklistItem(itemId),
    onSuccess: (_, itemId) => { 
      if (!boardId) return;
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task!.id ? {
            ...t,
            checklistItems: (t.checklistItems || []).filter(item => item.id !== itemId)
          } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Alt görev silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev silinemedi.')),
  });

  // Alt Göreve Kişi Atama (Optimistic Update)
  const assignChecklistItemMutation = useMutation({
    mutationFn: ({ itemId, assignUserId }: { itemId: string, assignUserId: string }) =>
      checklistService.assignToChecklistItem(itemId, { assignUserId }),
    onMutate: async ({ itemId, assignUserId }) => {
      await queryClient.cancelQueries({ queryKey: ['boardDetails', boardId] });
      const previousData = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId]);
      if (previousData && board) {
        const userToAssign = board.members.find(m => m.user.id === assignUserId)?.user;
        if (userToAssign) {
          const newChecklistItem = previousData.lists
            .flatMap(l => l.tasks)
            .find(t => t.id === task!.id)
            ?.checklistItems.find(item => item.id === itemId);
          if (newChecklistItem) {
            updateChecklistItemInCache({ ...newChecklistItem, assignees: [...newChecklistItem.assignees, userToAssign] });
          }
        }
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      toast.error(getErrorMessage(err, 'Atama yapılamadı.'));
      if (context?.previousData) {
        queryClient.setQueryData(['boardDetails', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
  });

  // Alt Görevden Kişi Çıkarma (Optimistic Update)
  const unassignChecklistItemMutation = useMutation({
    mutationFn: ({ itemId, unassignUserId }: { itemId: string, unassignUserId: string }) =>
      checklistService.unassignFromChecklistItem(itemId, { unassignUserId }),
    onMutate: async ({ itemId, unassignUserId }) => {
      await queryClient.cancelQueries({ queryKey: ['boardDetails', boardId] });
      const previousData = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId]);
      if (previousData) {
         const newChecklistItem = previousData.lists
            .flatMap(l => l.tasks)
            .find(t => t.id === task!.id)
            ?.checklistItems.find(item => item.id === itemId);
         if (newChecklistItem) {
            updateChecklistItemInCache({ ...newChecklistItem, assignees: newChecklistItem.assignees.filter(a => a.id !== unassignUserId) });
         }
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      toast.error(getErrorMessage(err, 'Atama kaldırılamadı.'));
      if (context?.previousData) {
        queryClient.setQueryData(['boardDetails', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (files: File[]) => attachmentService.uploadAttachments(task!.id, files),
    onSuccess: (newAttachments) => {
      if (!boardId) return;
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task!.id ? { ...t, attachments: [...(t.attachments || []), ...newAttachments] } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Dosyalar eklendi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, "Dosya yüklenemedi.")),
  });
  
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.deleteAttachment(attachmentId),
    onSuccess: (_, attachmentId) => {
      if (!boardId) return;
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.map(t => (t.id === task!.id ? {
            ...t,
            // DÜZELTME (image_dc4028.png): 'attachments' undefined olabilir
            attachments: (t.attachments || []).filter(att => att.id !== attachmentId)
          } : t))
        }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Ek silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, "Ek silinemedi.")),
  });
  
  // YENİ: Görev Reaksiyonu Mutasyonu (Optimistic)
  const toggleTaskReactionMutation = useMutation({
    mutationFn: (data: { taskId: string, emoji: string }) => 
      reactionService.toggleTaskReaction(data.taskId, { emoji: data.emoji }),
    
    onMutate: async ({ taskId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['boardDetails', boardId] });
      const previousData = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId]);

      if (previousData) {
        queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], {
          ...previousData,
          lists: previousData.lists.map(l => ({
            ...l,
            tasks: l.tasks.map(t => {
              if (t.id !== taskId) return t;

              const existingReactionIndex = (t.reactions || []).findIndex(
                r => r.emoji === emoji && r.userId === user!.id
              );
              
              let newReactions: ReactionSummary[];
              if (existingReactionIndex > -1) {
                newReactions = t.reactions.filter((r) => !(r.emoji === emoji && r.userId === user!.id));
              } else {
                const newReaction: ReactionSummary = {
                  id: `temp-reaction-${Date.now()}`,
                  emoji,
                  userId: user!.id,
                  user: { id: user!.id, name: user!.name }
                };
                newReactions = [...(t.reactions || []), newReaction];
              }
              return { ...t, reactions: newReactions };
            })
          }))
        });
      }
      return { previousData };
    },
    onError: (err, vars, context) => {
      toast.error(getErrorMessage(err, 'Tepki verilemedi.'));
      if (context?.previousData) {
        queryClient.setQueryData(['boardDetails', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
  });

  // --- 4. UseEffect'ler (Mutasyonlardan sonra) ---
  useEffect(() => {
    if (task) {
      setEditableTitle(task.title);
      setEditableDescription(task.description || '');
    }
  }, [task]);
  
  // DÜZELTME (image_fb25fe.png): Hatalı scroll useEffect'i kaldırıldı.

  // --- 5. Erken Çıkış (Tüm Hook'lardan sonra) ---
  if (!task || !board) {
    return null;
  }
  
  // --- 6. Handler Fonksiyonları ---
  const handleTitleBlur = () => {
    if (editableTitle.trim() && editableTitle !== task.title) { updateTaskMutation.mutate({ title: editableTitle }); } 
    else { setEditableTitle(task.title); }
  };
  const handleDescriptionBlur = () => {
    if (editableDescription !== (task.description || '')) { updateTaskMutation.mutate({ description: editableDescription }); }
  };
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistItem.trim()) { createChecklistItemMutation.mutate(newChecklistItem.trim()); }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) { uploadAttachmentMutation.mutate(Array.from(files)); }
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };
  const handleDeleteAttachment = (attachmentId: string) => {
    if (window.confirm("Bu eki kalıcı olarak silmek istediğinizden emin misiniz?")) { deleteAttachmentMutation.mutate(attachmentId); }
  };

  // --- 7. Hesaplamalar (Render için) ---
  const taskAssigneeIds = new Set((task.assignees || []).map(a => a.id));
  const unassignedBoardMembers = board.members.filter(m => !taskAssigneeIds.has(m.user.id));

  // === ARAYÜZ (VIEW) YÖNETİMİ ===
  const modalConfig = {
    // 1. Görevi Düzenle (Başlık/Açıklama)
    details: {
      title: 'Görevi Düzenle',
      size: 'lg',
      component: (
        <div className="space-y-4">
          <input
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-2xl font-bold bg-transparent text-zinc-100 focus:outline-none focus:bg-zinc-900 rounded-md px-2 py-1"
          />
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
          {/* YENİ: Görev Reaksiyonları */}
          <ReactionManager
            reactions={task.reactions || []}
            currentUserId={user!.id}
            onToggleReaction={(emoji) => toggleTaskReactionMutation.mutate({ taskId: task.id, emoji })}
          />
        </div>
      )
    },
    // 2. Kişi Ata / Yönet
    assignees: {
      title: 'Kişi Ata / Yönet',
      size: 'md',
      component: (
        <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Atananlar Listesi */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Atananlar</label>
            <div className="p-2 bg-zinc-900 rounded-md min-h-[4rem]">
              {(task.assignees || []).length > 0 ? (
                (task.assignees || []).map(assignee => (
                  <div key={assignee.id} className="flex items-center justify-between group p-1.5 rounded-md hover:bg-zinc-700">
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
                      disabled={unassignTaskMutation.isPending}
                      className="p-1 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {unassignTaskMutation.isPending && unassignTaskMutation.variables === assignee.id ? <Spinner size="sm" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center p-2">Henüz kimse atanmamış.</p>
              )}
             </div>
          </div>
          
          {/* Pano Üyeleri Listesi */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Panodaki Diğer Üyeler</label>
             <div className="p-2 bg-zinc-900 rounded-md max-h-48 overflow-y-auto">
                {unassignedBoardMembers.length > 0 ? (
                  unassignedBoardMembers.map(member => (
                    <div key={member.user.id} className="flex items-center justify-between group p-1.5 rounded-md hover:bg-zinc-700">
                      <div className="flex items-center">
                        <img
                          className="w-6 h-6 rounded-full object-cover"
                          src={member.user.avatarUrl ? `${API_SOCKET_URL}${member.user.avatarUrl}` : `https://ui-avatars.com/api/?name=${member.user.name}`}
                          alt={member.user.name}
                        />
                        <span className="ml-2 text-sm text-zinc-100">{member.user.name}</span>
                      </div>
                      <button 
                        onClick={() => assignTaskMutation.mutate(member.user.id)}
                        disabled={assignTaskMutation.isPending}
                        className="p-1 text-zinc-500 hover:text-green-500 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {assignTaskMutation.isPending && assignTaskMutation.variables === member.user.id ? <Spinner size="sm" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>}
                      </button>
                    </div>
                  ))
                ) : (
                   <p className="text-sm text-zinc-500 text-center p-2">Atanacak başka üye yok.</p>
                )}
             </div>
          </div>
        </div>
      )
    },
    // 3. Görsel Ekle / Yönet
    attachments: {
      title: 'Görsel Ekle / Yönet',
      size: 'lg',
      component: (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-zinc-100">Ekler</h4>
          <div className="flex flex-wrap gap-2">
            {(task.attachments || []).map(att => (
              <AttachmentItem 
                key={att.id} 
                attachment={att} 
                onDelete={handleDeleteAttachment}
                isDeleting={deleteAttachmentMutation.isPending && deleteAttachmentMutation.variables === att.id}
              />
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAttachmentMutation.isPending}
              className="w-24 h-24 bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-md flex flex-col items-center justify-center text-zinc-400 hover:border-amber-400 hover:text-amber-400 transition-colors"
            >
              {uploadAttachmentMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span className="text-xs mt-1">Görsel Ekle</span>
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple 
              accept="image/*,application/pdf,.doc,.docx"
              className="hidden"
            />
          </div>
        </div>
      )
    },
    // 4. Alt Görevleri Yönet
    checklist: {
      title: 'Alt Görevleri Yönet',
      size: 'lg',
      component: (
         <div className="space-y-2">
          <h4 className="text-lg font-semibold text-zinc-100">Alt Görevler</h4>
          {/* DÜZELTME (image_82e3d6.png): Kaydırma ve yükseklik buraya (içeriğe) eklendi */}
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
            {(task.checklistItems || []).map(item => {
              const itemAssigneeIds = new Set((item.assignees || []).map(a => a.id));
              const unassignedChecklistMembers = board.members.filter(m => !itemAssigneeIds.has(m.user.id));
              
              return (
                <div key={item.id} className="flex items-center group -ml-1 pr-1 hover:bg-zinc-700 rounded-md">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => toggleChecklistItemMutation.mutate(item.id)}
                    className="h-4 w-4 text-amber-400 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500 ml-1"
                  />
                  
                  <span className={`flex-1 ml-3 text-sm ${item.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    {item.text}
                  </span>
                  
                  <div className="flex items-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {(item.assignees || []).map(assignee => (
                       <button 
                          key={assignee.id}
                          onClick={() => unassignChecklistItemMutation.mutate({itemId: item.id, unassignUserId: assignee.id})}
                          title={`Atamayı kaldır: ${assignee.name}`}
                        >
                          <img
                            className="w-5 h-5 rounded-full object-cover border border-zinc-900"
                            src={assignee.avatarUrl ? `${API_SOCKET_URL}${assignee.avatarUrl}` : `https://ui-avatars.com/api/?name=${assignee.name}&size=20`}
                          />
                        </button>
                    ))}
                    
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-1 rounded-full text-zinc-400 hover:bg-zinc-600 hover:text-zinc-100" title="Alt göreve ata">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      </Menu.Button>
                      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                        <Menu.Items className="absolute right-0 bottom-full mb-1 w-48 max-h-48 overflow-y-auto rounded-md bg-zinc-900 border border-zinc-700 shadow-lg z-20">
                          {unassignedBoardMembers.length > 0 ? (
                            unassignedBoardMembers.map(member => (
                              <Menu.Item key={member.user.id}>
                                {({ active }) => (
                                  <button
                                    onClick={() => assignChecklistItemMutation.mutate({itemId: item.id, assignUserId: member.user.id})}
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
                    
                    <button 
                      onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                      className="p-1 text-zinc-400 hover:bg-zinc-600 hover:text-red-500 rounded-full"
                      title="Alt görevi sil"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Yeni Alt Görev Ekleme Formu */}
          <form onSubmit={handleAddChecklistItem} className="flex space-x-2 pt-2 border-t border-zinc-700">
            <input
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Yeni alt görev ekle..."
              className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md"
            />
            {/* DÜZELTME: Yazım hatası (image_05fc3f.png) */}
            <button type="submit" disabled={createChecklistItemMutation.isPending} className="px-3 py-2 bg-zinc-700 text-zinc-100 rounded-md hover:bg-zinc-600">
              {createChecklistItemMutation.isPending ? <Spinner size="sm" /> : 'Ekle'}
            </button>
          </form>
        </div>
      )
    },
    // 5. Yorumlar
    comments: {
      title: 'Yorumlar',
      size: 'lg',
      component: (
        // DÜZELTME (image_82e3d6.png): Kaydırma ve yükseklik buraya (dış sarmalayıcıya) eklendi
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <TaskComments 
            taskId={task!.id} 
            taskTitle={task!.title} 
            boardId={boardId!}
          />
        </div>
      )
    },
    // 6. Zaman Takibi
    time: {
      title: 'Zaman Takibi',
      size: 'lg',
      component: (
        <TaskTimeTracker 
          taskId={task!.id}
          boardId={boardId!}
        />
      )
    }
  };

  // Aktif görünümü ve başlığı seç
  const currentView = modalConfig[initialView] || modalConfig.details;

  // --- 8. JSX (Render) ---
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentView.title} size={currentView.size as any}>
      {currentView.component}
    </Modal>
  );
};

export default TaskDetailModal;
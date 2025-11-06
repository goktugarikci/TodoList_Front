// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/TaskList.tsx
import React, { useState, Fragment, useRef, useEffect } from 'react';
import type { TaskList as TaskListType, BoardDetailed, TaskDetailed, TaskApprovalStatus, ChecklistItemDetailed } from '../../types/api'; 
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../services/taskService';
import { taskListService } from '../../services/taskListService'; 
import { checklistService } from '../../services/checklistService';
import { getErrorMessage } from '../../utils/errorHelper';
import TaskCard from './TaskCard'; 
import Spinner from '../common/Spinner';
import { toast } from 'react-hot-toast';
import { Menu, Transition } from '@headlessui/react'; 
// DÜZELTME: ModalView tipini import et
import { ModalView } from '../../pages/BoardDetailPage';

interface TaskListProps {
  list: TaskListType;
  onOpenModal: (task: TaskDetailed, view: ModalView) => void; 
}

const TaskList: React.FC<TaskListProps> = ({ list, onOpenModal }) => {
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false); 
  
  const [isRenamingList, setIsRenamingList] = useState(false);
  const [currentListTitle, setCurrentListTitle] = useState(list.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenamingList && renameInputRef.current) {
      renameInputRef.current.select();
    }
  }, [isRenamingList]);
  
  // --- Önbelleği (Cache) güncellemek için yardımcı fonksiyonlar ---
  const updateTaskInCache = (updatedTask: TaskDetailed) => {
    queryClient.setQueryData<BoardDetailed>(['boardDetails', list.boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(l => ({
          ...l,
          tasks: l.tasks.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        }));
        return { ...oldData, lists: newListData };
      });
  };
  
  const updateChecklistItemInCache = (updatedItem: ChecklistItemDetailed) => {
    queryClient.setQueryData<BoardDetailed>(['boardDetails', list.boardId], (oldData) => {
      if (!oldData) return oldData;
      const newListData = oldData.lists.map(l => ({
        ...l,
        tasks: l.tasks.map(t => (t.id === updatedItem.taskId ? { 
          ...t,
          checklistItems: (t.checklistItems || []).map(item => (item.id === updatedItem.id ? updatedItem : item))
        } : t))
      }));
      return { ...oldData, lists: newListData };
    });
  };


  // --- Görev Mutasyonları (TaskCard'a gönderilecek) ---

  const createTaskMutation = useMutation({
    mutationFn: () => taskService.createTask({
      title: newTaskTitle,
      taskListId: list.id,
    }),
    onSuccess: (newTask) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', list.boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map((l: TaskListType) => {
          if (l.id === list.id) {
            const newTaskWithDefaults: TaskDetailed = {
              ...newTask,
              checklistItems: [], 
              attachments: [],
              _count: { checklistItems: 0, comments: 0, attachments: 0 }, 
            };
            return { ...l, tasks: [...l.tasks, newTaskWithDefaults] };
          }
          return l;
        });
        return { ...oldData, lists: newListData };
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev oluşturulamadı.')),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', list.boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map(l => ({
          ...l,
          tasks: l.tasks.filter(t => t.id !== taskId)
        }));
        return { ...oldData, lists: newListData };
      });
      toast.success('Görev silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev silinemedi.')),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string, newStatus: TaskApprovalStatus }) => 
      taskService.updateTask(taskId, { approvalStatus: newStatus }),
    onSuccess: (updatedTask) => {
      updateTaskInCache(updatedTask); 
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Görev durumu güncellenemedi.')),
  });
  
  // Alt Görev (Checklist) Onaylama Mutasyonu
  const toggleChecklistItemMutation = useMutation({
    mutationFn: (itemId: string) => checklistService.toggleChecklistItem(itemId),
    onSuccess: (updatedItem) => {
      updateChecklistItemInCache(updatedItem);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Alt görev durumu güncellenemedi.')),
  });


  // --- Liste (Sütun) Mutasyonları ---
  
  const updateListTitleMutation = useMutation({
    mutationFn: () => taskListService.updateListTitle(list.id, currentListTitle),
    onSuccess: (updatedList) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', list.boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.map((l) => (l.id === list.id ? { ...l, title: updatedList.title } : l));
        return { ...oldData, lists: newListData };
      });
      setIsRenamingList(false);
      toast.success('Liste adı güncellendi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Liste adı güncellenemedi.')),
  });

  const deleteListMutation = useMutation({
    mutationFn: () => taskListService.deleteList(list.id),
    onSuccess: () => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', list.boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListData = oldData.lists.filter((l) => l.id !== list.id);
        return { ...oldData, lists: newListData };
      });
      toast.success('Liste silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Liste silinemedi.')),
  });

  // --- Handler Fonksiyonları ---
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate();
    }
  };
  
  const handleRenameListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentListTitle.trim() && currentListTitle !== list.title) {
      updateListTitleMutation.mutate();
    } else {
      setIsRenamingList(false);
      setCurrentListTitle(list.title); 
    }
  };
  
  const handleDeleteList = () => {
    if (window.confirm(`'${list.title}' listesini silmek istediğinizden emin misiniz? İçindeki tüm görevler kalıcı olarak silinecektir.`)) {
      deleteListMutation.mutate();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm("Bu görevi kalıcı olarak silmek istediğinizden emin misiniz?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleToggleComplete = (task: TaskDetailed) => {
    const newStatus = task.approvalStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
    updateTaskStatusMutation.mutate({ taskId: task.id, newStatus: newStatus });
  };
  
  const handleToggleChecklistItem = (itemId: string) => {
    toggleChecklistItemMutation.mutate(itemId);
  };
  

  return (
    <div className="flex-shrink-0 w-72 h-full bg-zinc-800 rounded-lg shadow-md p-3 flex flex-col">
      
      {/* Liste Başlığı ve Menüsü */}
      <div className="flex justify-between items-center mb-3 px-1">
        {isRenamingList ? (
          <form onSubmit={handleRenameListSubmit} className="flex-1">
            <input
              ref={renameInputRef}
              type="text"
              value={currentListTitle}
              onChange={(e) => setCurrentListTitle(e.target.value)}
              onBlur={handleRenameListSubmit} 
              className="w-full px-2 py-1 border border-amber-400 bg-zinc-900 text-zinc-100 rounded-md"
            />
          </form>
        ) : (
          <h3 
            className="text-lg font-semibold text-zinc-100 cursor-pointer" 
            onClick={() => setIsRenamingList(true)}
          >
            {list.title}
          </h3>
        )}
        
        <Menu as="div" className="relative ml-2 flex-shrink-0">
          <Menu.Button className="p-1 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-zinc-700 rounded-md bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-zinc-700 z-10">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsRenamingList(true)}
                      className={`${active ? 'bg-zinc-700' : ''} text-zinc-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      İsmini Değiştir
                    </button>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDeleteList}
                      disabled={deleteListMutation.isPending}
                      className={`${active ? 'bg-red-600 text-white' : 'text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                    >
                      {deleteListMutation.isPending ? <Spinner size="sm" /> : 'Listeyi Sil'}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>


      {/* Görev (Alt Başlık) Listesi */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {list.tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onOpenModal={(view) => onOpenModal(task, view)}
            onDeleteTask={() => handleDeleteTask(task.id)}
            onToggleComplete={() => handleToggleComplete(task)}
            onToggleChecklistItem={handleToggleChecklistItem}
          />
        ))}
      </div>

      {/* Yeni Görev (Alt Başlık) Ekle Formu */}
      <div className="mt-3">
        {isAddingTask ? (
          <form onSubmit={handleAddTaskSubmit} className="space-y-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Görev başlığı girin..."
              autoFocus
              className="w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400"
            />
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {createTaskMutation.isPending ? <Spinner size="sm" /> : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="p-2 text-zinc-400 hover:text-zinc-100"
              >
                İptal
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingTask(true)}
            className="w-full px-3 py-2 text-sm text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 rounded-md transition-colors text-left"
          >
            + Görev Ekle
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskList;
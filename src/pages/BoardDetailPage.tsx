// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/pages/BoardDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../services/boardService';
import { taskListService } from '../services/taskListService'; 
import { taskService } from '../services/taskService'; // Görev taşıma için
import { getErrorMessage } from '../utils/errorHelper';
import Spinner from '../components/common/Spinner';
import { useAuth, API_SOCKET_URL } from '../contexts/AuthContext';
import type { BoardDetailed, TaskList as TaskListType, TaskDetailed } from '../types/api'; 
import TaskList from '../components/board/TaskList';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useLayout } from '../components/layout/ProtectedLayout'; 
import BoardSettingsPanel from '../components/board/BoardSettingsPanel';
import BoardInfoModal from '../components/board/BoardInfoModal'; 
import { toast } from 'react-hot-toast';
import GroupChatWidget from '../components/chat/GroupChatWidget';
import TaskDetailModal from '../components/board/TaskDetailModal';
import NotificationBell from '../components/layout/NotificationBell';

// DND (Sürükle ve Bırak) Kütüphaneleri
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
// Portal (Sürüklerken kartın görünümü için)
import { createPortal } from 'react-dom';
import TaskCard from '../components/board/TaskCard'; // Sürüklenen kartı göstermek için

// DÜZELTME (image_05a1ed.png): Tip 'export' ediliyor
export type ModalView = 'details' | 'assignees' | 'attachments' | 'checklist' | 'comments' | 'time';
interface ModalState {
  task: TaskDetailed | null;
  view?: ModalView;
}
// Aktif sürüklenen öğenin tipini (Liste mi Görev mi?) belirlemek için
type ActiveDragType = 'List' | 'Task' | null;

const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, logout } = useAuth();
  const { openSettings, openFriends } = useLayout(); 
  const queryClient = useQueryClient();
  
  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const [isBoardInfoModalOpen, setIsBoardInfoModalOpen] = useState(false);
  
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  const [modalState, setModalState] = useState<ModalState>({ task: null, view: 'details' });
  
  // DND State'leri
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<ActiveDragType>(null);
  const [activeDragTask, setActiveDragTask] = useState<TaskDetailed | null>(null); // Sürüklenen görev (Görünüm için)

  const { 
    data: board, 
    isLoading, 
    error 
  } = useQuery<BoardDetailed>({
    queryKey: ['boardDetails', boardId],
    queryFn: () => boardService.getBoardById(boardId!),
    enabled: !!boardId,
  });

  const myRole = board?.members.find(m => m.user.id === user?.id)?.role;
  const isBoardAdmin = myRole === 'ADMIN';

  // --- Mutasyonlar ---

  const createListMutation = useMutation({
    mutationFn: () => taskListService.createList({
      title: newListTitle,
      boardId: boardId!,
    }),
    onSuccess: (newList) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        const newListWithTasks: TaskListType = { ...newList, tasks: [] };
        return { ...oldData, lists: [...oldData.lists, newListWithTasks] };
      });
      setNewListTitle('');
      setIsAddingList(false);
      toast.success('Liste eklendi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Liste eklenemedi.')),
  });
  
  // Liste Sıralama (Optimistic)
  const reorderListMutation = useMutation({
    mutationFn: (data: { boardId: string, lists: TaskListType[] }) => 
      boardService.reorderLists(data.boardId, data.lists.map((list, index) => ({ listId: list.id, order: index }))),
    onMutate: async ({ lists }) => {
      await queryClient.cancelQueries({ queryKey: ['boardDetails', boardId] });
      const previousData = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId]);
      if(previousData) {
        queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], { ...previousData, lists });
      }
      return { previousData };
    },
    onError: (err, vars, context) => {
      toast.error('Liste sırası güncellenemedi.');
      if (context?.previousData) {
        queryClient.setQueryData(['boardDetails', boardId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
  });

  // Görev Taşıma (Optimistic)
  const moveTaskMutation = useMutation({
    mutationFn: (data: { taskId: string, newTaskListId: string, newOrder: number }) => 
      taskService.moveTask(data.taskId, { newTaskListId: data.newTaskListId, newOrder: data.newOrder }),
    onError: (err) => {
      toast.error('Görev taşınamadı, pano yenileniyor.');
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boardDetails', boardId] });
    }
  });


  // --- DND Handler Fonksiyonları ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // 5px sürüklemeden sonra başla
    useSensor(KeyboardSensor)
  );

  // Sürükleme başladığında
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as ActiveDragType;
    setActiveDragId(active.id as string);
    setActiveDragType(type);

    if (type === 'Task' && board) {
      const task = board.lists.flatMap(l => l.tasks).find(t => t.id === active.id);
      setActiveDragTask(task || null);
    }
  };

  // Bir görev listeler arasında sürüklendiğinde (henüz bırakılmadı)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || activeDragType !== 'Task') return;

    const activeListId = active.data.current?.listId;
    const overListId = over.data.current?.listId || (over.data.current?.type === 'List' ? over.id : null);
    
    if (!activeListId || !overListId || activeListId === overListId) return;
    
    // Optimistic: Kartı yeni listeye anlık olarak taşı
    queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
      if (!oldData) return oldData;
      
      let foundTask: TaskDetailed | undefined;
      let newLists = oldData.lists.map(list => {
        if (list.id === activeListId) {
          foundTask = list.tasks.find(t => t.id === active.id);
          return { ...list, tasks: list.tasks.filter(t => t.id !== active.id) };
        }
        return list;
      });
      
      if (foundTask) {
        // === DÜZELTME: Görevi taşırken 'taskListId'sini de güncelle ===
        const movedTask = { ...foundTask, taskListId: overListId as string };
        // === BİTİŞ ===

        newLists = newLists.map(list => {
          if (list.id === overListId) {
            // Yeni listeye ekle (şimdilik en başa)
            return { ...list, tasks: [movedTask, ...list.tasks] };
          }
          return list;
        });
      }
      return { ...oldData, lists: newLists };
    });
  };

  // Sürükleme bittiğinde
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveDragId(null);
      setActiveDragType(null);
      setActiveDragTask(null);
      return;
    }

    if (!board) return;

    // 1. Durum: LİSTE (SÜTUN) SÜRÜKLEME
    if (activeDragType === 'List') {
      const oldIndex = board.lists.findIndex(l => l.id === active.id);
      const newIndex = board.lists.findIndex(l => l.id === over.id);
      
      if (oldIndex !== newIndex) {
        const newOrderedLists = arrayMove(board.lists, oldIndex, newIndex);
        reorderListMutation.mutate({ boardId: board.id, lists: newOrderedLists });
      }
    }

    // 2. Durum: GÖREV (KART) SÜRÜKLEME
    if (activeDragType === 'Task') {
      const activeListId = active.data.current?.listId;
      // 'over' bir kart (Task) veya boş bir liste (List) olabilir
      const overListId = over.data.current?.listId || (over.data.current?.type === 'List' ? over.id as string : null);
      
      if (!activeListId || !overListId) return;

      // en güncel listeyi cache'den al
      const updatedLists = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId])?.lists || board.lists;
      const activeTask = updatedLists.flatMap(l => l.tasks).find(t => t.id === active.id);
      
      if (!activeTask) return;
      
      // Optimistic cache güncellemesi (Lokal)
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;

        // 1. Görevi eski listeden çıkar
        const listsAfterRemoval = oldData.lists.map(list => ({
          ...list,
          tasks: list.tasks.filter(t => t.id !== active.id)
        }));

        // 2. Görevi yeni listeye ekle
        const listsAfterAddition = listsAfterRemoval.map(list => {
          if (list.id === overListId) {
            const overTaskIndex = list.tasks.findIndex(t => t.id === over.id);
            const newIndex = (overTaskIndex === -1) 
              ? list.tasks.length // Boş listeye eklendiyse sona
              : (over.data.current?.type === 'Task' ? overTaskIndex : 0); // Kartın üstü mü, listenin mi?
            
            const newTasks = [...list.tasks];
            newTasks.splice(newIndex, 0, { ...activeTask, taskListId: overListId }); // 'taskListId'yi güncelle
            return { ...list, tasks: newTasks.map((t, i) => ({ ...t, order: i })) }; // 'order'ı güncelle
          }
          return list;
        });
        
        return { ...oldData, lists: listsAfterAddition };
      });
      
      // 3. API'yi çağır (Sunucuya sıralamayı bildir)
      const finalLists = queryClient.getQueryData<BoardDetailed>(['boardDetails', boardId])!.lists;
      const finalList = finalLists.find(l => l.id === overListId);
      const newOrderInList = finalList?.tasks.findIndex(t => t.id === active.id) ?? 0;
      
      moveTaskMutation.mutate({
        taskId: active.id as string,
        newTaskListId: overListId,
        newOrder: newOrderInList
      });
    }
    
    // Sürükleme state'ini temizle
    setActiveDragId(null);
    setActiveDragType(null);
    setActiveDragTask(null);
  };

  
  // --- Diğer Handler Fonksiyonları ---
  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      createListMutation.mutate();
    }
  };
  const handleOpenModal = (task: TaskDetailed, view: ModalView = 'details') => {
    setModalState({ task, view });
  };
  const handleCloseTaskModal = () => {
    setModalState({ task: null, view: 'details' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dotted-pattern">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dotted-pattern text-red-400">
        <h2 className="text-2xl mb-4">Hata</h2>
        <p>{getErrorMessage(error, 'Pano yüklenemedi.')}</p>
        <Link to="/boards" className="mt-4 px-4 py-2 bg-amber-400 text-zinc-900 rounded-md">
          Panolarıma Geri Dön
        </Link>
      </div>
    );
  }
  
  if (!board) {
    return (
       <div className="flex items-center justify-center h-screen bg-dotted-pattern text-zinc-400">
        Pano bulunamadı.
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col h-screen bg-dotted-pattern text-zinc-100">
          
          {/* Header (Görsel kayma hatası düzeltildi) */}
          <header className="flex justify-between items-center p-4 bg-zinc-800 border-b border-zinc-700 shadow-md">
            <div className="flex items-center">
              <Link to="/boards" className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors" title="Tüm Panolar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              </Link>
              <h1 
                className="text-2xl font-bold text-amber-400 ml-4 cursor-pointer"
                onClick={() => setIsBoardInfoModalOpen(true)}
              >
                {board.name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {isBoardAdmin && (
                <button
                  onClick={() => setIsBoardSettingsOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  title="Pano Ayarları"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
              )}
              
              <NotificationBell />
              
              <button
                onClick={openFriends}
                className="px-4 py-2 bg-amber-400 text-zinc-900 font-semibold rounded-md hover:bg-amber-500 transition-colors flex items-center"
                title="Arkadaşlar ve Sohbet"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-2.37M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
              </button>
              
              <Menu as="div" className="relative">
                <Menu.Button className="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors flex items-center justify-center">
                  <img
                    src={user?.avatarUrl ? `${API_SOCKET_URL}${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user?.name || '?'}`}
                    alt="Profil"
                    className="w-full h-full rounded-full object-cover"
                  />
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
                            onClick={openSettings}
                            className={`${active ? 'bg-zinc-700' : ''} text-zinc-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            Ayarlar
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="px-1 py-1">
                       <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`${active ? 'bg-red-600 text-white' : 'text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                          >
                            Çıkış Yap
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </header>

          {/* Ana Pano Alanı (Listeler/Sütunlar) */}
          <main className="flex-1 flex gap-4 p-4 overflow-x-auto">
            
            <SortableContext items={board.lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
              {board.lists.map(list => (
                <TaskList 
                  key={list.id} 
                  list={list} 
                  onOpenModal={handleOpenModal}
                />
              ))}
            </SortableContext>

            {/* "Yeni Liste Ekle" Formu */}
            <div className="flex-shrink-0 w-72">
              {isAddingList ? (
                <form onSubmit={handleAddListSubmit} className="p-3 bg-zinc-800 rounded-lg shadow-md space-y-2">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Liste başlığı girin..."
                    autoFocus
                    className="w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={createListMutation.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {createListMutation.isPending ? <Spinner size="sm" /> : 'Liste Ekle'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="p-2 text-zinc-400 hover:text-zinc-100"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingList(true)}
                  className="w-full h-12 flex items-center justify-center bg-zinc-800 bg-opacity-50 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Yeni Liste Ekle
                </button>
              )}
            </div>
          </main>
        </div>

        {/* DND: Sürükleme bindirmesi (Kartın hayaleti) */}
        {createPortal(
          <DragOverlay>
            {activeDragType === 'Task' && activeDragTask ? (
              <TaskCard 
                task={activeDragTask} 
                onOpenModal={() => {}}
                onDeleteTask={() => {}}
                onToggleComplete={() => {}}
                onToggleChecklistItem={() => {}}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* GÖREV DETAY MODALI */}
      <TaskDetailModal 
        isOpen={!!modalState.task}
        onClose={handleCloseTaskModal}
        task={modalState.task} 
        board={board}
        initialView={modalState.view} 
      />

      {/* Diğer Paneller */}
      <GroupChatWidget boardId={board.id} boardName={board.name} />
      {isBoardAdmin && (
        <BoardSettingsPanel 
          isOpen={isBoardSettingsOpen}
          onClose={() => setIsBoardSettingsOpen(false)}
          board={board}
        />
      )}
      <BoardInfoModal
        isOpen={isBoardInfoModalOpen}
        onClose={() => setIsBoardInfoModalOpen(false)}
        board={board}
        isCurrentUserAdmin={isBoardAdmin}
      />
    </>
  );
};

export default BoardDetailPage;
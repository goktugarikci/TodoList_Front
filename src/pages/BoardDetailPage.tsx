// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/pages/BoardDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../services/boardService';
import { taskListService } from '../services/taskListService'; 
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

// DÜZELTME: Tip 'export' ediliyor
export type ModalView = 'details' | 'assignees' | 'attachments' | 'checklist';
interface ModalState {
  task: TaskDetailed | null;
  view?: ModalView;
}

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

  // --- Handler Fonksiyonları ---
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
      <div className="flex flex-col h-screen bg-dotted-pattern text-zinc-100">
        
        {/* Header */}
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
            )}
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

        {/* Ana Pano Alanı */}
        <main className="flex-1 flex gap-4 p-4 overflow-x-auto">
          
          {board.lists.map(list => (
            <TaskList 
              key={list.id} 
              list={list} 
              onOpenModal={handleOpenModal}
            />
          ))}

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

      {/* GÖREV DETAY MODALI */}
      <TaskDetailModal 
        isOpen={!!modalState.task}
        onClose={handleCloseTaskModal}
        task={modalState.task} 
        board={board}
        initialView={modalState.view} // Hangi görünümün açılacağını bildir
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
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../services/boardService';
import { taskListService } from '../services/taskListService'; // YENİ: Liste servisi
import { getErrorMessage } from '../utils/errorHelper';
import Spinner from '../components/common/Spinner';
import { useAuth, API_SOCKET_URL } from '../contexts/AuthContext';
import type { BoardDetailed, TaskList as TaskListType, TaskDetailed } from '../types/api'; // TaskDetailed eklendi
import TaskList from '../components/board/TaskList';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useLayout } from '../components/layout/ProtectedLayout'; 
import BoardSettingsPanel from '../components/board/BoardSettingsPanel';
import BoardInfoModal from '../components/board/BoardInfoModal'; 
import { toast } from 'react-hot-toast';
import GroupChatWidget from '../components/chat/GroupChatWidget';
// YENİ: Görev Detay Modalını import et
import TaskDetailModal from '../components/board/TaskDetailModal';

const BoardDetailPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, logout } = useAuth();
  const { openSettings, openFriends } = useLayout(); 
  const queryClient = useQueryClient();
  
  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const [isBoardInfoModalOpen, setIsBoardInfoModalOpen] = useState(false);
  
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  // YENİ: Tıklanan görevi (alt başlık) tutan state
  const [selectedTask, setSelectedTask] = useState<TaskDetailed | null>(null);

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

  // Liste (Sütun) Ekleme Mutasyonu
  const createListMutation = useMutation({
    mutationFn: () => taskListService.createList({
      title: newListTitle,
      boardId: boardId!,
    }),
    onSuccess: (newList) => {
      queryClient.setQueryData<BoardDetailed>(['boardDetails', boardId], (oldData) => {
        if (!oldData) return oldData;
        // API'den dönen 'TaskList' objesi 'tasks' dizisini içermez.
        // 'TaskList' tipimiz 'tasks' içerdiği için manuel ekliyoruz.
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

  // --- YENİ: Görev/Kart Tıklama Handler'ı (İstek 2) ---
  const handleTaskClick = (task: TaskDetailed) => {
    setSelectedTask(task); // Tıklanan görevi state'e ata (Modal'ı açar)
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null); // State'i temizle (Modal'ı kapatır)
  };
  // --- BİTİŞ ---

  if (isLoading) { /* ... (Yükleniyor) ... */ }
  if (error) { /* ... (Hata) ... */ }
  if (!board) { /* ... (Pano bulunamadı) ... */ }

  return (
    <>
      <div className="flex flex-col h-screen bg-dotted-pattern text-zinc-100">
        
        {/* Header (Aynı kalır) */}
        <header className="flex justify-between items-center p-4 bg-zinc-800 border-b border-zinc-700 shadow-md">
          {/* ... (Header'ın tüm içeriği aynı kalır: Yeşil Buton, Sarı Başlık, Kullanıcı Menüsü) ... */}
        </header>

        {/* Ana Pano Alanı (Listeler/Sütunlar) */}
        <main className="flex-1 flex gap-4 p-4 overflow-x-auto">
          
          {/* GÜNCELLENDİ: 'onTaskClick' prop'u eklendi */}
          {board.lists.map(list => (
            <TaskList 
              key={list.id} 
              list={list} 
              onTaskClick={handleTaskClick} // Fonksiyonu prop olarak ilet
            />
          ))}

          {/* "Yeni Liste Ekle" Formu (Aynı kalır) */}
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

      {/* --- YENİ: GÖREV DETAY MODALI (İstek 2) --- */}
      <TaskDetailModal 
        isOpen={!!selectedTask} // selectedTask varsa 'true'
        onClose={handleCloseTaskModal}
        task={selectedTask} 
        board={board} // YENİ: 'board' prop'u eklendi
      />
      {/* --- BİTİŞ --- */}

      {/* Grup Sohbeti Penceresi */}
      <GroupChatWidget boardId={board.id} boardName={board.name} />

      {/* Pano Ayarları Paneli */}
      {isBoardAdmin && (
        <BoardSettingsPanel 
          isOpen={isBoardSettingsOpen}
          onClose={() => setIsBoardSettingsOpen(false)}
          board={board}
        />
      )}

      {/* Pano Bilgileri Modalı */}
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
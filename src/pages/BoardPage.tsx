import React, { useState } from 'react';
// API_SOCKET_URL, resim linklerini (http://localhost:5000) çözmek için import edildi
import { useAuth, API_SOCKET_URL } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../services/boardService';
import { getErrorMessage } from '../utils/errorHelper';
import UserSettingsModal from '../components/settings/UserSettingsModal';
import FriendsPanel from '../components/friends/FriendsPanel';
import Spinner from '../components/common/Spinner';
import { useNavigate } from 'react-router-dom';
import type { BoardSummary, CreateBoardRequest, BoardRole } from '../types/api';
import Modal from '../components/common/Modal';

// Backend'in (board.controller.js) /myboards için döndüğü GÜNCEL veri tipi
interface UserBoardSummary extends Omit<BoardSummary, '_count' | 'createdAt'> {
  membership: {
    role: BoardRole;
  };
  _count: {
    members: number;
  };
}

const BoardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState<'INDIVIDUAL' | 'GROUP'>('GROUP');

  // --- Veri Çekme (react-query) ---
  const { data: userBoards, isLoading: isLoadingBoards, error: boardsError } = useQuery<UserBoardSummary[]>({
    queryKey: ['userBoards', user?.id],
    queryFn: () => boardService.getMyBoards() as Promise<UserBoardSummary[]>,
    enabled: !!user?.id,
  });

  // --- Veri Güncelleme (react-query) ---
  const createBoardMutation = useMutation({
    mutationFn: (data: CreateBoardRequest) => boardService.createBoard(data),
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['userBoards'] });
      setIsNewBoardModalOpen(false);
      setNewBoardName('');
      navigate(`/board/${newBoard.id}`);
    },
    onError: (err) => {
      alert(`Pano oluşturulamadı: ${getErrorMessage(err, 'Bilinmeyen hata')}`);
    }
  });

  // --- Handler Fonksiyonları ---
  const handleCreateBoardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      createBoardMutation.mutate({ name: newBoardName, type: newBoardType });
    }
  };

  const handleGoToBoard = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  return (
    <>
      {/* ANA GÜNCELLEME: 
        Arka plan 'bg-dotted-pattern' (Siyah + Sarı Noktalar)
        Varsayılan metin rengi 'text-zinc-100' (Beyaz/Açık Gri)
      */}
      <div className="min-h-screen bg-dotted-pattern text-zinc-100 p-8">
        
        {/* Header: 'bg-zinc-800' (Koyu Gri Panel Rengi) */}
        <header className="flex justify-between items-center mb-10 bg-zinc-800 p-4 rounded-lg shadow-lg border border-zinc-700">
          
          {/* Başlık (Görünür Metin Rengi) */}
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center">
            {user?.avatarUrl && (
              <img
                src={`${API_SOCKET_URL}${user.avatarUrl}`} // Backend URL
                alt="Profil"
                className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-amber-400" // Sarı border
              />
            )}
            {/* Yazı rengi 'text-zinc-100' (Beyaz) */}
            Merhaba, {user?.name}!
          </h1>
          
          {/* BUTON GÜNCELLEMELERİ (İsteğinize göre renkli) */}
          <div className="flex items-center space-x-2">
            
            {/* "Yeni Pano" Butonu (Yeşil - bg-green-600) */}
            <button
              onClick={() => setIsNewBoardModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              title="Yeni Pano Oluştur"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              <span className="hidden sm:inline ml-2">Yeni Pano</span>
            </button>
            
            {/* "Arkadaşlar" Butonu (Sarı - bg-amber-400) */}
            <button
              onClick={() => setIsFriendsPanelOpen(true)}
              className="px-4 py-2 bg-amber-400 text-zinc-900 font-semibold rounded-md hover:bg-amber-500 transition-colors flex items-center"
              title="Arkadaşlar ve Sohbet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-2.37M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
              <span className="hidden sm:inline ml-2">Arkadaşlar</span>
            </button>
            
            {/* "Ayarlar" Butonu (Mavi - bg-blue-600) */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              title="Ayarlar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span className="hidden sm:inline ml-2">Ayarlar</span>
            </button>
            
            {/* "Çıkış Yap" Butonu (Kırmızı - bg-red-600) */}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
              title="Çıkış Yap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              <span className="hidden sm:inline ml-2">Çıkış Yap</span>
            </button>
          </div>
        </header>
        
        <main className="container mx-auto">
          <section className="mb-10">
            {/* METİN RENGİ GÜNCELLEMESİ (text-zinc-100) */}
            <h2 className="text-3xl font-semibold text-zinc-100 mb-6">Panolarınız</h2>
            
            {isLoadingBoards && (
              <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            )}
            
            {boardsError && (
              <p className="text-lg text-red-500 text-center">
                Panolar yüklenirken hata oluştu: {getErrorMessage(boardsError, "Bilinmeyen hata")}
              </p>
            )}

            {/* Pano Kartları (Koyu Tema) */}
            {userBoards && userBoards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {userBoards.map(board => (
                  <div 
                    key={board.id} 
                    // Pano Kartları (Koyu Gri) ve Sarı Vurgu
                    className="bg-zinc-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-amber-400"
                    onClick={() => handleGoToBoard(board.id)}
                  >
                    <h3 className="text-xl font-bold text-zinc-100 mb-2 truncate" title={board.name}>
                      {board.name}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-3 h-10 overflow-hidden">
                      {board.type === 'GROUP' ? 'Grup Panosu' : 'Bireysel Pano'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-700">
                      <span title={`Rolünüz: ${board.membership.role}`}>
                        Rolünüz: <span className="font-semibold text-amber-400 uppercase">{board.membership.role}</span>
                      </span>
                      <span>
                        Üye Sayısı: {board._count.members}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pano Yoksa (Koyu Tema) */}
            {userBoards && userBoards.length === 0 && (
              <div className="bg-zinc-800 p-8 rounded-lg shadow-lg text-center">
                {/* METİN RENGİ GÜNCELLEMESİ (text-zinc-400) */}
                <p className="text-zinc-400 text-lg mb-4">Henüz hiçbir panonun üyesi değilsiniz.</p>
                {/* BUTON GÜNCELLEMESİ (bg-amber-400) */}
                <button
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="px-6 py-3 bg-amber-400 text-zinc-900 text-lg font-bold rounded-md hover:bg-amber-500 transition-colors"
                >
                  İlk Panonu Oluştur
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
      
      {/* Ayarlar Paneli (Koyu tema için güncellenmiş SlideOverPanel'i kullanır) */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      {/* Arkadaşlar Paneli (Koyu tema için güncellenmiş SlideOverPanel'i kullanır) */}
      <FriendsPanel
        isOpen={isFriendsPanelOpen}
        onClose={() => setIsFriendsPanelOpen(false)}
      />

      {/* Yeni Pano Oluşturma Modal'ı (Koyu tema için güncellenmiş Modal'ı kullanır) */}
      <Modal
        isOpen={isNewBoardModalOpen}
        onClose={() => setIsNewBoardModalOpen(false)}
        title="Yeni Pano Oluştur"
        size="sm"
      >
        <form onSubmit={handleCreateBoardSubmit} className="space-y-4">
          <div>
            <label htmlFor="boardName" className="block text-sm font-medium text-zinc-400">Pano Adı</label>
            <input
              id="boardName" type="text" value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Pano Tipi</label>
            <select
              value={newBoardType}
              onChange={(e) => setNewBoardType(e.target.value as 'INDIVIDUAL' | 'GROUP')}
              className="mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400"
            >
              <option value="GROUP">Grup Panosu (Çoklu Kullanıcı)</option>
              <option value="INDIVIDUAL">Bireysel Pano (Sadece Ben)</option>
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsNewBoardModalOpen(false)}
              className="mr-3 px-4 py-2 text-sm font-medium text-zinc-100 bg-zinc-700 rounded-md hover:bg-zinc-600"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createBoardMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {createBoardMutation.isPending && <Spinner size="sm" className="mr-2" />}
              Oluştur
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BoardPage;
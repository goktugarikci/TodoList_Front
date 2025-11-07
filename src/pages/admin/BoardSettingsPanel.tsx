// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/BoardSettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { boardService } from '../../services/boardService';
import { getErrorMessage } from '../../utils/errorHelper';
import SlideOverPanel from '../../components/common/SlideOverPanel';
import Spinner from '../../components/common/Spinner';
import { useNavigate } from 'react-router-dom';
import type { BoardDetailed, UserPublicInfo, BoardRole } from '../../types/api';
import { toast } from 'react-hot-toast'; 
// YENİ: Toplu mesaj bileşeni
import BulkNotificationSender from '../../components/board/BulkNotificationSender'; 

interface BoardSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  board: BoardDetailed | null; 
}

const BoardSettingsPanel: React.FC<BoardSettingsPanelProps> = ({ isOpen, onClose, board }) => {
  const { user } = useAuth(); // 'user.role' (ADMIN mi?) kontrolü için
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [boardName, setBoardName] = useState(board?.name || '');
  const [memberEmail, setMemberEmail] = useState(''); 

  useEffect(() => {
    if (board && isOpen) {
      setBoardName(board.name);
    }
  }, [board, isOpen]);

  // --- Mutasyonlar (API İstekleri) ---
  const updateNameMutation = useMutation({
    mutationFn: (newName: string) => boardService.updateBoard(board!.id, { name: newName }),
    onSuccess: (updatedBoard) => {
      queryClient.setQueryData(['boardDetails', board!.id], updatedBoard);
      queryClient.invalidateQueries({ queryKey: ['userBoards'] });
      toast.success('Pano adı güncellendi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: () => boardService.deleteBoard(board!.id),
    onSuccess: () => {
      toast.success('Pano silindi.');
      queryClient.invalidateQueries({ queryKey: ['userBoards'] }); 
      navigate('/boards'); 
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });
  
  const addMemberMutation = useMutation({
    mutationFn: (email: string) => boardService.addMemberByEmail(board!.id, { email }),
    onSuccess: () => {
      toast.success('Üye eklendi.');
      queryClient.invalidateQueries({ queryKey: ['boardDetails', board!.id] }); 
      setMemberEmail('');
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: (userIdToRemove: string) => boardService.removeMember(board!.id, { userIdToRemove }),
    onSuccess: () => {
      toast.success('Üye çıkarıldı.');
      queryClient.invalidateQueries({ queryKey: ['boardDetails', board!.id] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });
  
  const changeRoleMutation = useMutation({
    mutationFn: ({ memberUserId, role }: { memberUserId: string; role: BoardRole }) => 
      boardService.changeMemberRole(board!.id, memberUserId, { role }),
    onSuccess: () => {
      toast.success('Rol güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['boardDetails', board!.id] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });


  // --- Handler Fonksiyonları ---
  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (boardName.trim() && boardName !== board?.name) {
      updateNameMutation.mutate(boardName.trim());
    }
  };

  const handleDeleteBoard = () => {
    if (window.confirm(`'${board?.name}' panosunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      deleteBoardMutation.mutate();
    }
  };
  
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberEmail.trim()) {
      addMemberMutation.mutate(memberEmail.trim());
    }
  };
  
  const handleRemoveMember = (member: UserPublicInfo) => {
    if (window.confirm(`'${member.name}' kişisini panodan çıkarmak istediğinizden emin misiniz?`)) {
      removeMemberMutation.mutate(member.id);
    }
  };
  
  const handleChangeRole = (memberUserId: string, newRole: BoardRole) => {
    changeRoleMutation.mutate({ memberUserId, role: newRole });
  };

  if (!board) return null;

  const isBoardCreator = board.createdBy?.id === user?.id;
  const isGlobalAdmin = user?.role === 'ADMIN'; // YENİ: Global admin kontrolü

  // --- TEMA (Manuel Tailwind) ---
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400";
  const labelClasses = "block text-sm font-medium text-zinc-300";
  const sectionTitleClasses = "text-lg font-medium text-zinc-100 mb-4";
  const sectionBorderClasses = "border-b pb-6 border-zinc-700";

  return (
    <SlideOverPanel isOpen={isOpen} onClose={onClose} title="Pano Ayarları" size="md">
      <div className="space-y-8">
        
        {/* Pano Adı Güncelleme */}
        <section className={sectionBorderClasses}>
          <h4 className={sectionTitleClasses}>Genel Ayarlar</h4>
          <form onSubmit={handleUpdateName} className="space-y-3">
            <div>
              <label htmlFor="boardName" className={labelClasses}>Pano Adı</label>
              <input
                id="boardName" type="text" value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                required disabled={updateNameMutation.isPending}
                className={inputClasses}
              />
            </div>
            <button
              type="submit"
              disabled={updateNameMutation.isPending || boardName === board.name}
              className="w-full flex justify-center px-4 py-2 font-semibold text-zinc-900 bg-amber-400 rounded-md hover:bg-amber-500 disabled:opacity-50"
            >
              {updateNameMutation.isPending ? <Spinner size="sm" /> : 'Pano Adını Güncelle'}
            </button>
          </form>
        </section>

        {/* Üye Yönetimi (Kişi Ekle/Çıkar) */}
        <section className={sectionBorderClasses}>
          <h4 className={sectionTitleClasses}>Üye Yönetimi</h4>
          <form onSubmit={handleAddMember} className="flex space-x-2 mb-4">
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Üye e-postası..."
              disabled={addMemberMutation.isPending}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {addMemberMutation.isPending ? <Spinner size="sm" /> : 'Ekle'}
            </button>
          </form>

          <ul className="divide-y divide-zinc-700 max-h-60 overflow-y-auto pr-2">
            {board.members.map(member => (
              <li key={member.user.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={member.user.avatarUrl ? `${API_SOCKET_URL}${member.user.avatarUrl}` : `https://ui-avatars.com/api/?name=${member.user.name}`}
                    alt={member.user.name}
                  />
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{member.user.name}</p>
                    <p className="text-sm text-zinc-400 truncate">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <select 
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.user.id, e.target.value as BoardRole)}
                    disabled={changeRoleMutation.isPending || board.createdBy?.id === member.user.id}
                    className="text-xs bg-zinc-700 text-zinc-100 rounded-md border-zinc-600 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-50"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="MEMBER">Member</option>
                    <option value="COMMENTER">Commenter</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button 
                    onClick={() => handleRemoveMember(member.user)}
                    disabled={removeMemberMutation.isPending || board.createdBy?.id === member.user.id}
                    className="p-1 text-zinc-400 hover:text-red-500 disabled:opacity-50" 
                    title={board.createdBy?.id === member.user.id ? "Pano sahibi çıkarılamaz" : "Üyeyi Çıkar"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* YENİ: Toplu Bildirim (Sadece Global Admin görebilir) */}
        {isGlobalAdmin && (
          <section className={sectionBorderClasses}>
            <h4 className={sectionTitleClasses}>Toplu Bildirim Gönder</h4>
            <p className="text-xs text-zinc-400 mb-3">Bu bildirim, seçtiğiniz hedef kitledeki (bu pano veya tüm kullanıcılar) herkese anlık olarak gönderilecektir.</p>
            <BulkNotificationSender boardId={board.id} />
          </section>
        )}

        {/* Tehlikeli Alan (Panoyu Sil) */}
        <section>
          <h4 className="text-lg font-medium text-red-500 mb-4">Tehlikeli Alan</h4>
          <button
            onClick={handleDeleteBoard}
            disabled={deleteBoardMutation.isPending || !isBoardCreator}
            className="w-full flex justify-center px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            title={!isBoardCreator ? "Panoyu sadece oluşturan kişi silebilir." : "Panoyu Kalıcı Olarak Sil"}
          >
            {deleteBoardMutation.isPending ? <Spinner size="sm" /> : 'Panoyu Kalıcı Olarak Sil'}
          </button>
          {!isBoardCreator && (
            <p className="text-xs text-zinc-400 mt-2 text-center">Panoyu sadece oluşturan kişi ({board.createdBy?.name || '...'}) silebilir.</p>
          )}
        </section>
        
      </div>
    </SlideOverPanel>
  );
};

export default BoardSettingsPanel;
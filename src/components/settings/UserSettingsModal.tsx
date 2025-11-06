import React, { useState, useRef, useEffect } from 'react';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { boardService } from '../../services/boardService';
import { getErrorMessage } from '../../utils/errorHelper';
import SlideOverPanel from '../common/SlideOverPanel';
import Spinner from '../common/Spinner';
import { useNavigate } from 'react-router-dom';
import type { UserPublicInfo, BoardSummary, BoardRole } from '../../types/api';
import { toast } from 'react-hot-toast'; // Hata/başarı bildirimleri için

// Backend'in (board.controller.js) /myboards için döndüğü yeni veri tipi
interface UserBoardSummary extends Omit<BoardSummary, '_count' | 'createdAt'> {
  membership: {
    role: BoardRole;
  };
  _count: {
    members: number;
  };
}

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Yükleme ve hata durumlarını yönetmek için yardımcı hook
const useUpdateProcessor = (successMessage: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = async (action: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    try {
      await action();
      toast.success(successMessage); // Başarı bildirimi
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Bilinmeyen bir hata oluştu.');
      setError(errorMsg);
      toast.error(errorMsg); // Hata bildirimi
    } finally {
      setIsLoading(false);
    }
  };
  return { isLoading, error, process, setError };
};


const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form state'leri
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form bölümleri için yüklenme/hata durumları
  const nameUpdater = useUpdateProcessor('İsim başarıyla güncellendi!');
  const usernameUpdater = useUpdateProcessor('Kullanıcı adı başarıyla güncellendi!');
  const passwordUpdater = useUpdateProcessor('Şifre başarıyla değiştirildi!');
  const avatarUpdater = useUpdateProcessor('Profil resmi güncellendi!');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setUsername(user.username || '');
    }
    if (!isOpen) {
      // Panel kapandığında formları ve hataları temizle
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      nameUpdater.setError(null);
      usernameUpdater.setError(null);
      passwordUpdater.setError(null);
      avatarUpdater.setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  // --- Veri Çekme (Panolarım) ---
  const { data: userBoards, isLoading: isLoadingBoards, error: boardsError } = useQuery<UserBoardSummary[]>({
    queryKey: ['userBoards', user?.id],
    queryFn: () => boardService.getMyBoards() as Promise<UserBoardSummary[]>,
    enabled: isOpen && !!user?.id,
  });

  // --- Mutasyonlar (Pano Eylemleri) ---
  const leaveBoardMutation = useMutation({
    mutationFn: (boardId: string) => boardService.removeMember(boardId, { userIdToRemove: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBoards'] });
      toast.success('Panodan ayrıldınız.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hata')),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => boardService.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBoards'] });
      toast.success('Pano silindi.');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hata')),
  });
  
  // --- Handler Fonksiyonları ---
  const invalidateUserCache = (updatedUser: UserPublicInfo) => {
    queryClient.setQueryData(['me'], updatedUser);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nameUpdater.process(async () => {
      const { user: updatedUser } = await userService.updateName({ name });
      invalidateUserCache(updatedUser);
    });
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    usernameUpdater.process(async () => {
      const { user: updatedUser } = await userService.updateUsername({ username });
      invalidateUserCache(updatedUser);
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      passwordUpdater.setError('Yeni şifreler uyuşmuyor.');
      return;
    }
    passwordUpdater.process(async () => {
      await userService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarUpdater.process(async () => {
      const { user: updatedUser } = await userService.uploadProfileImage(file);
      invalidateUserCache(updatedUser);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleLeaveBoard = (boardId: string, boardName: string) => {
    if (window.confirm(`'${boardName}' panosundan ayrılmak istediğinizden emin misiniz?`)) {
      leaveBoardMutation.mutate(boardId);
    }
  };

  const handleDeleteBoard = (boardId: string, boardName: string) => {
    if (window.confirm(`'${boardName}' panosunu KALICI OLARAK silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      deleteBoardMutation.mutate(boardId);
    }
  };

  const handleGoToBoard = (boardId: string) => {
    onClose();
    navigate(`/board/${boardId}`);
  };

  // --- TEMA GÜNCELLEMESİ ---
  // Input ve Butonlar için standart Tailwind sınıfları
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400";
  const labelClasses = "block text-sm font-medium text-zinc-300";
  const sectionTitleClasses = "text-lg font-medium text-zinc-100 mb-4";
  const sectionBorderClasses = "border-b pb-6 border-zinc-700";
  const errorText = "text-xs text-red-400";
  // Ana Eylem Butonu (Sarı)
  const primaryButtonClasses = "w-full flex justify-center px-4 py-2 font-semibold text-zinc-900 bg-amber-400 rounded-md hover:bg-amber-500 disabled:opacity-50";
  // İkincil Eylem Butonu (Gri)
  const secondaryButtonClasses = "w-full flex justify-center px-4 py-2 font-semibold text-zinc-100 bg-zinc-700 rounded-md hover:bg-zinc-600 disabled:opacity-50";

  return (
    // İSTEK: Başlık "Profil Ayarları" olarak değiştirildi
    <SlideOverPanel isOpen={isOpen} onClose={onClose} title="Profil Ayarları" size="lg">
      
      <div className="space-y-8">
        
        {/* --- 1. Bölüm: Profil Resmi --- */}
        <section className={`flex flex-col items-center space-y-3 pb-6 ${sectionBorderClasses}`}>
          <img
            src={user?.avatarUrl ? `${API_SOCKET_URL}${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
            alt="Profil Resmi"
            className="w-28 h-28 rounded-full object-cover ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-800"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUpdater.isLoading}
            className="text-sm font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            {avatarUpdater.isLoading ? <Spinner size="sm" /> : 'Resmi Değiştir'}
          </button>
          <input
            type="file" ref={fileInputRef} onChange={handleFileChange}
            accept="image/png, image/jpeg, image/gif" className="hidden"
          />
          {avatarUpdater.error && <p className={errorText}>{avatarUpdater.error}</p>}
        </section>

        {/* --- 2. Bölüm: Hesap Bilgileri (2 Sütunlu) --- */}
        <section className={sectionBorderClasses}>
          <h4 className={sectionTitleClasses}>Hesap Bilgileri</h4>
          
          <div className="mb-4">
            <label htmlFor="email" className={labelClasses}>E-posta (Değiştirilemez)</label>
            <input
              id="email" type="email" value={user?.email || ''} disabled
              className="mt-1 block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm bg-zinc-900 text-zinc-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Sütun 1: Görünen İsim */}
            <form onSubmit={handleNameSubmit} className="space-y-3">
              <div>
                <label htmlFor="name" className={labelClasses}>Görünen İsim</label>
                <input
                  id="name" type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  required disabled={nameUpdater.isLoading}
                  className={inputClasses}
                />
              </div>
              <button
                type="submit"
                disabled={nameUpdater.isLoading || name === (user?.name || '')}
                className={primaryButtonClasses} // Sarı Buton
              >
                {nameUpdater.isLoading ? <Spinner size="sm" /> : 'İsmi Güncelle'}
              </button>
              {nameUpdater.error && <p className={errorText}>{nameUpdater.error}</p>}
            </form>

            {/* Sütun 2: Kullanıcı Adı (@) */}
            <form onSubmit={handleUsernameSubmit} className="space-y-3">
              <div>
                <label htmlFor="username" className={labelClasses}>Kullanıcı Adı (@)</label>
                <input
                  id="username" type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3} required disabled={usernameUpdater.isLoading}
                  className={inputClasses}
                />
              </div>
              <button
                type="submit"
                disabled={usernameUpdater.isLoading || username === (user?.username || '')}
                className={primaryButtonClasses} // Sarı Buton
              >
                {usernameUpdater.isLoading ? <Spinner size="sm" /> : 'Kullanıcı Adını Güncelle'}
              </button>
              {usernameUpdater.error && <p className={errorText}>{usernameUpdater.error}</p>}
            </form>
          </div>
        </section>
        
        {/* --- 3. Bölüm: Panolarım --- */}
        <section className={sectionBorderClasses}>
          <h4 className={sectionTitleClasses}>Panolarım</h4>
          {isLoadingBoards ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : boardsError ? (
            <p className="text-sm text-red-400">Panolar yüklenirken hata oluştu: {getErrorMessage(boardsError, "Bilinmeyen hata")}</p>
          ) : userBoards && userBoards.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {userBoards.map(board => (
                <li key={board.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-md shadow-sm border border-zinc-700">
                  <div className="flex-1 min-w-0">
                    <span onClick={() => handleGoToBoard(board.id)} className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer truncate" title={board.name}>
                      {board.name}
                    </span>
                    <p className="text-xs text-zinc-400 truncate">
                      Rolünüz: <span className="font-semibold uppercase">{board.membership.role}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4 flex-shrink-0">
                    {board.membership.role === 'ADMIN' ? (
                      <button onClick={() => handleDeleteBoard(board.id, board.name)} disabled={deleteBoardMutation.isPending} className="p-2 text-zinc-400 hover:text-red-500 rounded-full hover:bg-zinc-700 disabled:opacity-50" title="Panoyu Sil">
                         {deleteBoardMutation.isPending ? <Spinner size="sm" /> : ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> )}
                      </button>
                    ) : (
                      <button onClick={() => handleLeaveBoard(board.id, board.name)} disabled={leaveBoardMutation.isPending} className="p-2 text-zinc-400 hover:text-amber-500 rounded-full hover:bg-zinc-700 disabled:opacity-50" title="Panodan Ayrıl">
                        {leaveBoardMutation.isPending ? <Spinner size="sm" /> : ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Henüz hiçbir panonun üyesi değilsiniz.</p>
          )}
        </section>

        {/* --- 4. Bölüm: Şifre Değiştirme --- */}
        <section>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <h4 className={sectionTitleClasses}>Şifre Değiştir</h4>
            <div>
              <label className={labelClasses}>Mevcut Şifre</label>
              <input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={passwordUpdater.isLoading} 
                     className={inputClasses}/>
            </div>
            <div>
              <label className={labelClasses}>Yeni Şifre</label>
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={passwordUpdater.isLoading} 
                     className={inputClasses}/>
            </div>
            <div>
              <label className={labelClasses}>Yeni Şifre (Tekrar)</label>
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={passwordUpdater.isLoading} 
                     className={inputClasses}/>
            </div>
            <button
              type="submit"
              disabled={passwordUpdater.isLoading}
              className={secondaryButtonClasses} // Gri Buton
            >
              {passwordUpdater.isLoading ? <Spinner size="sm" /> : 'Şifreyi Değiştir'}
            </button>
            {passwordUpdater.error && <p className={errorText}>{passwordUpdater.error}</p>}
          </form>
        </section>
      </div>
    </SlideOverPanel>
  );
};

export default UserSettingsModal;
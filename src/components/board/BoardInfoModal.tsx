import React, { Fragment } from 'react'; // Fragment eklendi
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import SlideOverPanel from '../common/SlideOverPanel';
import Spinner from '../common/Spinner';
// GÜNCELLENDİ: FriendInfo tipi de eklendi
import type { BoardDetailed, BoardRole, UserPublicInfo, FriendInfo } from '../../types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { friendService } from '../../services/friendService';
import { boardService } from '../../services/boardService'; // 'removeMember' için eklendi
import { getErrorMessage } from '../../utils/errorHelper';
import { useChat } from '../../contexts/ChatContext';
import { toast } from 'react-hot-toast'; // react-hot-toast import
import { Menu, Transition } from '@headlessui/react'; // HeadlessUI Menu eklendi
import { getAvatarUrl } from '../../utils/getAvatarUrl';

interface BoardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: BoardDetailed | null;
  isCurrentUserAdmin: boolean;
}

const BoardInfoModal: React.FC<BoardInfoModalProps> = ({ isOpen, onClose, board, isCurrentUserAdmin }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chat = useChat();

  // Arkadaşlık isteği gönderme mutasyonu
  const sendFriendRequestMutation = useMutation({
    // DÜZELTME: API 'identifier' (email/username) bekliyor, 'id' değil
    mutationFn: (identifier: string) => friendService.sendFriendRequest({ identifier }),
    onSuccess: () => {
      toast.success('Arkadaşlık isteği gönderildi!');
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Arkadaşlık isteği gönderilemedi.")),
  });

  // YENİ: Üye Çıkarma Mutasyonu
  const removeMemberMutation = useMutation({
    mutationFn: (userIdToRemove: string) => boardService.removeMember(board!.id, { userIdToRemove }),
    onSuccess: () => {
      toast.success('Üye çıkarıldı.');
      // 'boardDetails' cache'ini anında yenile
      queryClient.invalidateQueries({ queryKey: ['boardDetails', board!.id] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Üye çıkarılamadı.")),
  });
  
  if (!board) return null;

  // Pano sahibini bul
  const boardOwner = board.members.find(m => m.user.id === board.createdBy?.id);

  // --- YENİ HANDLER'LAR (Popover Menü için) ---
  const handleSendFriendRequest = (memberUser: UserPublicInfo) => {
    // DÜZELTME (Hata): API 'id' değil, 'email' veya 'username' bekliyor
    const identifier = memberUser.username || memberUser.email;
    sendFriendRequestMutation.mutate(identifier);
  };

  const handleSendMessage = (memberUser: UserPublicInfo) => {
    // 'isOnline' durumunu bul (opsiyonel ama daha iyi)
    const friends = queryClient.getQueryData<FriendInfo[]>(['friends']);
    const friendStatus = friends?.find(f => f.id === memberUser.id);
    const userToChat = {
      ...memberUser,
      isOnline: friendStatus?.isOnline || false
    };
    chat.openChat(userToChat);
    onClose(); // Modalı kapat
  };

  const handleRemoveMember = (memberUser: UserPublicInfo) => {
    if (window.confirm(`'${memberUser.name}' kişisini panodan çıkarmak istediğinizden emin misiniz?`)) {
      removeMemberMutation.mutate(memberUser.id);
    }
  };
  
  // DÜZELTME (Hata): toast.info yerine toast() kullan
  const handleSelfClick = () => {
    toast('Bu sensin!');
  };
  
  // --- TEMA (Manuel Tailwind) ---
  const sectionTitleClasses = "text-lg font-medium text-amber-400 mb-3";
  const textClasses = "text-zinc-300 text-sm";
  const labelClasses = "block text-sm font-medium text-zinc-400";
  const valueClasses = "mt-1 text-zinc-100 font-semibold";
  const memberNameClasses = "text-zinc-100 font-medium truncate";
  const memberRoleClasses = "text-zinc-400 text-xs uppercase";

  return (
    <SlideOverPanel isOpen={isOpen} onClose={onClose} title="Pano Bilgileri" size="md">
      <div className="space-y-6">
        
        {/* Pano Detayları */}
        <section className="pb-4 border-b border-zinc-700">
          <h3 className={sectionTitleClasses}>{board.name}</h3>
          <p className={textClasses}>
            {/* 'description' alanı şemada yok, o yüzden göstermiyoruz */}
            Bu pano {board.type === 'GROUP' ? 'bir grup panosudur' : 'bireysel bir panodur'}.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <div>
              <span className={labelClasses}>Oluşturan:</span>
              <p className={valueClasses}>{boardOwner?.user.name || 'Bilinmiyor'}</p>
            </div>
            <div>
              <span className={labelClasses}>Üye Sayısı:</span>
              <p className={valueClasses}>{board.members.length}</p>
            </div>
          </div>
        </section>

        {/* --- GÜNCELLENMİŞ: Üye Listesi (Z-Index Düzeltmesi) --- */}
        <section>
          <h3 className={sectionTitleClasses}>Üyeler ({board.members.length})</h3>
          {/* Z-Index Düzeltmesi: 'max-h-80' ve 'overflow-y-auto' buradan kaldırıldı
            Ana panel (SlideOverPanel) zaten kaydırılabilir.
          */}
          <ul className="divide-y divide-zinc-700">
            {board.members.map((member) => {
              const isSelf = member.user.id === user?.id;
              const isOwner = member.user.id === board.createdBy?.id;

              return (
                <li key={member.user.id}>
                  {/* Headless UI Menu (Açılır Menü) */}
                  <Menu as="div" className="relative">
                    
                    {/* Menüyü açan buton (tüm satır) */}
                    <Menu.Button
                      as="div"
                      // DÜZELTME: Kendine tıklayınca 'toast' göstermesi için 'disabled' kaldırıldı
                      onClick={isSelf ? handleSelfClick : undefined}
                      className={`py-3 flex items-center justify-between ${isSelf ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-700 rounded-md px-2 -mx-2 group'}`}
                    >
                      {/* Üye Bilgisi (Avatar, İsim, Rol) */}
                      <div className="flex items-center min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-600"
                            src={getAvatarUrl(member.user.avatarUrl)}
                            alt={member.user.name}
                          />
                        </div>
                        <div className="ml-3 min-w-0">
                          <p className={memberNameClasses}>{member.user.name} {isSelf && <span className="text-zinc-500">(Sen)</span>}</p>
                          <p className={memberRoleClasses}>{member.role}</p>
                        </div>
                      </div>
                      
                      {/* Yükleniyorsa Spinner göster */}
                      {(sendFriendRequestMutation.isPending && sendFriendRequestMutation.variables === (member.user.username || member.user.email)) ||
                       (removeMemberMutation.isPending && removeMemberMutation.variables === member.user.id) ? (
                        <Spinner size="sm" />
                      ) : (
                        !isSelf && ( // Kendim değilsem, tıkla-menüsü-aç ikonunu göster
                          <svg className="w-5 h-5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                        )
                      )}
                    </Menu.Button>

                    {/* Açılır Menü İçeriği */}
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      {/* Z-Index Düzeltmesi: 'z-10' eklendi */}
                      <Menu.Items className="absolute left-1/2 -translate-x-1/2 mt-1 w-56 origin-top-center divide-y divide-zinc-700 rounded-md bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-zinc-700 z-10">
                        <div className="px-1 py-1">
                          {/* Mesaj Gönder */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleSendMessage(member.user)}
                                className={`${active ? 'bg-blue-600 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                Mesaj Gönder
                              </button>
                            )}
                          </Menu.Item>
                          {/* Arkadaş Ekle */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleSendFriendRequest(member.user)}
                                className={`${active ? 'bg-blue-600 text-white' : 'text-zinc-100'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              >
                                Arkadaş Ekle
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                        
                        {/* Admin'e Özel: Gruptan Çıkar */}
                        {isCurrentUserAdmin && !isOwner && (
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleRemoveMember(member.user)}
                                  className={`${active ? 'bg-red-600 text-white' : 'text-red-400'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
                                >
                                  Gruptan Çıkar
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </li>
              );
            })}
          </ul>
        </section>
        
      </div>
    </SlideOverPanel>
  );
};

export default BoardInfoModal;
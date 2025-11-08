// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/friends/FriendsPanel.tsx
import React, { useState } from 'react';
// DÜZELTME (image_4579e5.png): API_SOCKET_URL import'u kaldırıldı
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendService } from '../../services/friendService';
import { chatService } from '../../services/chatService';
import { getErrorMessage } from '../../utils/errorHelper';
import SlideOverPanel from '../common/SlideOverPanel';
import Spinner from '../common/Spinner';
import { useChat } from '../../contexts/ChatContext';
import type { 
  FriendInfo, 
  FriendRequestResponse, 
  ConversationSummary, 
  UserAssigneeDto,
  UserPublicInfo 
} from '../../types/api';
import { toast } from 'react-hot-toast';
// YENİ (image_4579e5.png): Profil fotoğrafı URL yardımcısı import edildi
import { getAvatarUrl } from '../../utils/getAvatarUrl';

// ChatContext'ten gelen beklenen tip (Arkadaş veya değil)
type ChatUser = (UserAssigneeDto | UserPublicInfo | FriendInfo) & { isOnline?: boolean };

type ActiveTab = 'FRIENDS' | 'CONVERSATIONS' | 'REQUESTS' | 'ADD_FRIEND';

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendsPanel: React.FC<FriendsPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('FRIENDS');
  const chat = useChat(); // Chat context'i

  // 1. Arkadaş Listesi (Online statüleri için)
  const { data: friends, isLoading: isLoadingFriends } = useQuery<FriendInfo[]>({
    queryKey: ['friends', user?.id],
    queryFn: friendService.listFriends,
    enabled: isOpen, // Sadece panel açıkken çek
  });

  // 2. Bekleyen İstekler
  const { data: requests, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery<FriendRequestResponse>({
    queryKey: ['friendRequests', user?.id],
    queryFn: friendService.listPendingRequests,
    enabled: isOpen && (activeTab === 'REQUESTS'),
    staleTime: 1000 * 60, // 1 dakika taze kalsın
  });

  // 3. Mevcut Sohbetler (DM)
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations', user?.id],
    queryFn: chatService.getMyConversations,
    enabled: isOpen && (activeTab === 'CONVERSATIONS'),
    staleTime: 1000 * 60,
  });

  // --- Eylemler (Mutasyonlar) ---

  // Arkadaş Çıkarma
  const removeFriendMutation = useMutation({
    mutationFn: friendService.removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Sohbetleri de etkileyebilir
      toast.success('Arkadaşlıktan çıkarıldı.');
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });

  // İstek Yanıtlama
  const respondRequestMutation = useMutation({
    mutationFn: ({ requestId, response }: { requestId: string; response: 'ACCEPT' | 'DECLINE' }) =>
      friendService.respondToRequest(requestId, { response }),
    onSuccess: (_, variables) => { // 'variables' ile hangi butona basıldığını al
      refetchRequests(); // İstek listesini yenile
      queryClient.invalidateQueries({ queryKey: ['friends'] }); // Arkadaş listesini de yenile
      if (variables.response === 'ACCEPT') {
        toast.success('Arkadaşlık isteği kabul edildi.');
      } else {
        toast.error('Arkadaşlık isteği reddedildi.');
      }
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });

  // --- Arayüz Fonksiyonları ---
  const handleRemoveFriend = (friend: FriendInfo) => {
    if (window.confirm(`'${friend.name}' kişisini arkadaşlıktan çıkarmak istediğinizden emin misiniz?`)) {
      removeFriendMutation.mutate(friend.id);
    }
  };

  const handleRespondRequest = (requestId: string, response: 'ACCEPT' | 'DECLINE') => {
    respondRequestMutation.mutate({ requestId, response });
  };
  
  const handleStartChat = (userToChat: ChatUser) => {
    chat.openChat(userToChat); // ChatContext'e tam objeyi gönder
    onClose(); // Arkadaşlar panelini kapat
  };

  // --- Arayüz Çizimi (Render) ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'FRIENDS':
        return (
          <FriendList
            friends={friends}
            isLoading={isLoadingFriends}
            onStartChat={handleStartChat}
            onRemoveFriend={handleRemoveFriend}
          />
        );
      case 'CONVERSATIONS':
        return (
          <ConversationList
            conversations={conversations}
            isLoading={isLoadingConversations}
            onStartChat={handleStartChat}
            friendsCache={friends} // 'isOnline' durumunu bulmak için
          />
        );
      case 'REQUESTS':
        return (
          <RequestList
            data={requests}
            isLoading={isLoadingRequests}
            onRespond={handleRespondRequest}
            isLoadingResponse={respondRequestMutation.isPending}
          />
        );
      case 'ADD_FRIEND':
        return <AddFriendForm onSuccess={() => setActiveTab('REQUESTS')} />;
      default:
        return null;
    }
  };

  return (
    <SlideOverPanel isOpen={isOpen} onClose={onClose} title="Arkadaşlar ve Sohbet" size="md">
      {/* Sekme Başlıkları (Koyu Tema) */}
      <div className="border-b border-zinc-700">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          <TabButton name="Arkadaşlarım" isActive={activeTab === 'FRIENDS'} onClick={() => setActiveTab('FRIENDS')} />
          <TabButton name="Sohbetler" isActive={activeTab === 'CONVERSATIONS'} onClick={() => setActiveTab('CONVERSATIONS')} count={conversations?.reduce((acc, c) => acc + c.unreadCount, 0)} />
          <TabButton name="İstekler" isActive={activeTab === 'REQUESTS'} onClick={() => setActiveTab('REQUESTS')} count={requests?.received.length} />
          <TabButton name="Arkadaş Ekle" isActive={activeTab === 'ADD_FRIEND'} onClick={() => setActiveTab('ADD_FRIEND')} />
        </nav>
      </div>
      <div className="pt-4">
        {renderTabContent()}
      </div>
    </SlideOverPanel>
  );
};

// --- Alt Bileşenler (Koyu Tema Güncellemeleri) ---

// Sekme Butonu
const TabButton: React.FC<{ name: string, isActive: boolean, onClick: () => void, count?: number }> = ({ name, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className={`${
      isActive
        ? 'border-amber-400 text-amber-400' // Aktif sekme (Sarı)
        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-500' // Pasif sekme
    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
  >
    {name}
    {(count && count > 0) ? (
      <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
        isActive ? 'bg-amber-400 bg-opacity-20 text-amber-400' : 'bg-zinc-700 text-zinc-200'
      }`}>
        {count}
      </span>
    ) : null}
  </button>
);

// 1. Arkadaş Listesi (Aktif kullanıcılar)
const FriendList: React.FC<{
  friends?: FriendInfo[],
  isLoading: boolean,
  onStartChat: (user: FriendInfo) => void,
  onRemoveFriend: (friend: FriendInfo) => void
}> = ({ friends, isLoading, onStartChat, onRemoveFriend }) => {
  if (isLoading) return <div className="flex justify-center"><Spinner /></div>;
  if (!friends || friends.length === 0) return <p className="text-zinc-400">Henüz arkadaşınız yok.</p>;
  
  return (
    <ul className="divide-y divide-zinc-700"> {/* Sınır rengi güncellendi */}
      {friends.map(friend => (
        <li key={friend.id} className="py-3 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="relative">
              <img
                className="h-10 w-10 rounded-full object-cover"
                // DÜZELTME (image_4579e5.png): getAvatarUrl kullan
                src={getAvatarUrl(friend.avatarUrl, friend.name)}
                alt={friend.name}
              />
              {friend.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-zinc-800" title="Çevrimiçi" />
              )}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{friend.name}</p>
              <p className="text-sm text-zinc-400 truncate">@{friend.username || '...'}</p>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-2">
            <button onClick={() => onStartChat(friend)} className="p-2 text-zinc-500 hover:text-blue-400" title="Sohbet Başlat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </button>
            <button onClick={() => onRemoveFriend(friend)} className="p-2 text-zinc-500 hover:text-red-500" title="Arkadaşlıktan Çıkar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

// 2. Mevcut Sohbet Listesi
const ConversationList: React.FC<{
  conversations?: ConversationSummary[],
  isLoading: boolean,
  onStartChat: (user: ChatUser) => void,
  friendsCache?: FriendInfo[] 
}> = ({ conversations, isLoading, onStartChat, friendsCache }) => {
  if (isLoading) return <div className="flex justify-center"><Spinner /></div>;
  if (!conversations || conversations.length === 0) return <p className="text-zinc-400">Aktif sohbetiniz bulunmuyor.</p>;

  return (
    <ul className="divide-y divide-zinc-700"> {/* Sınır rengi güncellendi */}
      {conversations.map(convo => {
        const friendStatus = friendsCache?.find(f => f.id === convo.otherUser.id);
        const userToChat: ChatUser = {
          ...convo.otherUser,
          isOnline: friendStatus?.isOnline || false
        };
        
        return (
          <li key={convo.conversationId} onClick={() => onStartChat(userToChat)} className="py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-700 rounded-md px-2 -mx-2">
            <div className="flex items-center min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  // DÜZELTME (image_4579e5.png): getAvatarUrl kullan
                  src={getAvatarUrl(convo.otherUser.avatarUrl, convo.otherUser.name)}
                  alt={convo.otherUser.name}
                />
                {userToChat.isOnline && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-zinc-800" title="Çevrimiçi" />
                )}
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">{convo.otherUser.name}</p>
                <p className="text-sm text-zinc-400 truncate">{convo.lastMessage?.text || '...'}</p>
              </div>
            </div>
            {convo.unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                {convo.unreadCount}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// 3. İstek Listesi
const RequestList: React.FC<{
  data?: FriendRequestResponse,
  isLoading: boolean,
  onRespond: (id: string, response: 'ACCEPT' | 'DECLINE') => void,
  isLoadingResponse: boolean
}> = ({ data, isLoading, onRespond, isLoadingResponse }) => {
  if (isLoading) return <div className="flex justify-center"><Spinner /></div>;
  
  const receivedRequests = data?.received || [];
  const sentRequests = data?.sent || [];

  return (
    <div className="space-y-6">
      {/* Alınan İstekler */}
      <div>
        <h3 className="text-lg font-medium text-zinc-100 mb-2">Alınan İstekler ({receivedRequests.length})</h3>
        {receivedRequests.length > 0 ? (
          <ul className="divide-y divide-zinc-700">
            {receivedRequests.map(req => (
              <li key={req.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    // DÜZELTME (image_4579e5.png): getAvatarUrl kullan
                    src={getAvatarUrl(req.requester?.avatarUrl, req.requester?.name)}
                    alt={req.requester?.name}
                  />
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{req.requester?.name}</p>
                    <p className="text-sm text-zinc-400 truncate">@{req.requester?.username || '...'}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex space-x-2">
                  <button onClick={() => onRespond(req.id, 'ACCEPT')} disabled={isLoadingResponse} className="p-2 text-zinc-400 hover:text-green-500 disabled:opacity-50" title="Kabul Et">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </button>
                  <button onClick={() => onRespond(req.id, 'DECLINE')} disabled={isLoadingResponse} className="p-2 text-zinc-400 hover:text-red-500 disabled:opacity-50" title="Reddet">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400 text-sm">Bekleyen arkadaşlık isteğiniz yok.</p>
        )}
      </div>
      
      {/* Gönderilen İstekler */}
      <div>
        <h3 className="text-lg font-medium text-zinc-100 mb-2">Gönderilen İstekler ({sentRequests.length})</h3>
        {sentRequests.length > 0 ? (
           <ul className="divide-y divide-zinc-700">
            {sentRequests.map(req => (
              <li key={req.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    // DÜZELTME (image_4579e5.png): getAvatarUrl kullan
                    src={getAvatarUrl(req.receiver?.avatarUrl, req.receiver?.name)}
                    alt={req.receiver?.name}
                  />
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{req.receiver?.name}</p>
                    <p className="text-sm text-zinc-400 truncate">Bekleniyor...</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400 text-sm">Yanıt bekleyen isteğiniz yok.</p>
        )}
      </div>
    </div>
  );
};

// 4. Arkadaş Ekle Formu
const AddFriendForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: friendService.sendFriendRequest,
    onSuccess: () => {
      setSuccess('Arkadaşlık isteği gönderildi!');
      setIdentifier('');
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      onSuccess();
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Hata"));
      setSuccess(null);
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (identifier.trim()) {
      mutation.mutate({ identifier: identifier.trim() });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-zinc-300">
          Kullanıcı Adı veya E-posta
        </label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          disabled={mutation.isPending}
          className="mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400"
          placeholder="kullaniciadi veya email@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full flex justify-center px-4 py-2 font-semibold text-zinc-900 bg-amber-400 rounded-md hover:bg-amber-500 disabled:opacity-50"
      >
        {mutation.isPending ? <Spinner size="sm" /> : 'İstek Gönder'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
    </form>
  );
};


export default FriendsPanel;
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth, API_SOCKET_URL } from './AuthContext';
import { toast } from 'react-hot-toast';
import type { 
  DirectMessageWithSender, 
  UserAssigneeDto, 
  UserPublicInfo, 
  PaginatedDirectMessages,
  FriendInfo 
} from '../types/api';
import { useQueryClient, InfiniteData } from '@tanstack/react-query'; 

type ChatUser = (UserAssigneeDto | UserPublicInfo | FriendInfo) & { isOnline?: boolean };
type UnreadCounts = Record<string, number>;

interface ChatContextType {
  activeChatUser: ChatUser | null;
  unreadCounts: UnreadCounts;
  isMinimized: boolean;
  openChat: (user: ChatUser) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat, ChatProvider içinde kullanılmalıdır.');
  }
  return context;
};

// Sesli bildirim (public/notification.mp3)
const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.play().catch(e => console.warn("Ses çalma hatası:", e));
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { socket, user } = useAuth();
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [isMinimized, setIsMinimized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = (newMessage: DirectMessageWithSender) => {
      
      const isMeSender = newMessage.senderId === user.id;
      const otherUserId = isMeSender ? newMessage.receiverId : newMessage.senderId;
      const cacheKey = ['directMessages', otherUserId];

      // --- HATA DÜZELTMESİ (Hizalama ve Anlık Gönderme Sorunu) ---
      // API 'desc' (en yeni) gönderir. 'useInfiniteQuery' de 'pages[0]' en yeni sayfadır.
      // Yeni mesaj (en yeni veri) 'pages[0].messages' dizisinin BAŞINA eklenmelidir.
      queryClient.setQueryData<InfiniteData<PaginatedDirectMessages>>(
        cacheKey, 
        (oldData: InfiniteData<PaginatedDirectMessages> | undefined) => { // 'any' hatası düzeltildi
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return {
              pages: [{ 
                messages: [newMessage], 
                currentPage: 1, 
                totalPages: 1, 
                totalMessages: 1 
              }],
              pageParams: [1]
            };
          }
          
          const newData = { ...oldData };
          const newPages = [...newData.pages];
          
          newPages[0] = {
            ...newPages[0],
            messages: [newMessage, ...newPages[0].messages] // Yeni mesajı ilk sayfanın başına ekle
          };
          
          return { ...newData, pages: newPages };
        }
      );
      // --- HATA DÜZELTMESİ BİTTİ ---
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // --- Bildirim Mantığı ---
      if (isMeSender) return; // Gönderen biz isek bildirim/ses ÇALMA
      
      if (activeChatUser?.id === newMessage.senderId && !isMinimized) {
        playNotificationSound();
        return; 
      }

      setUnreadCounts(prevCounts => ({
        ...prevCounts,
        [newMessage.senderId]: (prevCounts[newMessage.senderId] || 0) + 1
      }));

      playNotificationSound();
      requestNotificationPermission(newMessage.sender.name, newMessage.text);
      
      // Pop-up (In-App) Bildirim (Koyu Tema)
      toast.custom((t) => (
        <div
          className="max-w-md w-full bg-zinc-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-zinc-700"
        >
          <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-1 right-1 text-zinc-500 hover:text-zinc-300 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img
                  className="h-10 w-10 rounded-full"
                  src={newMessage.sender.avatarUrl ? `${API_SOCKET_URL}${newMessage.sender.avatarUrl}` : `https://ui-avatars.com/api/?name=${newMessage.sender.name}`}
                  alt={newMessage.sender.name}
                />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">
                  {newMessage.sender.name}
                  <span className="ml-2 text-xs text-zinc-400 font-normal">
                    @{newMessage.sender.username || '...'}
                  </span>
                </p>
                <p className="mt-1 text-sm text-zinc-400 truncate">{newMessage.text}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-zinc-700">
            <button
              onClick={() => {
                const friends = queryClient.getQueryData<FriendInfo[]>(['friends']);
                const friendStatus = friends?.find(f => f.id === newMessage.senderId);
                const userToChat: ChatUser = {
                  ...newMessage.sender,
                  isOnline: friendStatus?.isOnline || false
                };
                openChat(userToChat); 
                toast.dismiss(t.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-amber-400 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Yanıtla
            </button>
          </div>
        </div>
      ), { duration: Infinity });
    };

    socket.on('receive_dm', handleReceiveMessage);

    return () => {
      socket.off('receive_dm', handleReceiveMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user, activeChatUser?.id, queryClient, isMinimized]);


  // --- Sohbet Balonu/Pencere Yönetimi ---
  const openChat = (userToChat: ChatUser) => {
    setActiveChatUser(userToChat);
    setIsMinimized(false);
    setUnreadCounts(prevCounts => {
      const newCounts = { ...prevCounts };
      delete newCounts[userToChat.id];
      return newCounts;
    });
  };

  const closeChat = () => {
    setActiveChatUser(null);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const value = {
    activeChatUser,
    unreadCounts,
    isMinimized,
    openChat,
    closeChat,
    toggleMinimize,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};


// --- MASAÜSTÜ BİLDİRİM YARDIMCISI ---
function requestNotificationPermission(title: string, body: string) {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı masaüstü bildirimlerini desteklemiyor.');
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification(title, { body: body, icon: '/favicon.ico' });
  } 
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body: body, icon: '/favicon.ico' });
      }
    });
  }
}
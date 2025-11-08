import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { friendService } from '../../services/friendService';
import { chatService } from '../../services/chatService';
import type { FriendInfo, ConversationSummary, UserPublicInfo } from '../../types/api';
import { getAvatarUrl } from '../../utils/getAvatarUrl';

type ChatUser = (FriendInfo | UserPublicInfo) & { isOnline?: boolean };

/**
 * Bu bileşen, 'ChatContext' tarafından yönetilen, sağ altta açılan
 * kayan sohbet penceresidir.
 */
const ChatBubbleList: React.FC = () => {
  const { activeChatUser, unreadCounts, openChat } = useChat();

  // 1. Okunmamış mesajları olan kullanıcıların ID'lerini al
  const unreadUserIds = Object.keys(unreadCounts);

  // 2. Bu kullanıcıların bilgilerini almak için 'friends' ve 'conversations' önbelleklerini kullan
  const { data: friends } = useQuery<FriendInfo[]>({
    queryKey: ['friends'],
    queryFn: friendService.listFriends,
    staleTime: 1000 * 60 * 5, // 5dk taze
    enabled: unreadUserIds.length > 0, // Sadece okunmamış mesaj varsa çek
  });

  const { data: conversations } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: chatService.getMyConversations,
    staleTime: 1000 * 60 * 5,
    enabled: unreadUserIds.length > 0,
  });

  // Eğer sohbet penceresi zaten açıksa VEYA okunmamış mesaj yoksa, balonları gösterme
  if (activeChatUser || unreadUserIds.length === 0) {
    return null;
  }
  
  // 3. Okunmamış ID'leri, 'friends' veya 'conversations' listesindeki verilerle eşleştir
  const bubbles: ChatUser[] = unreadUserIds.map(userId => {
    const count = unreadCounts[userId];
    if (count === 0) return null; // Sayı sıfırlanmışsa gösterme

    // Önce arkadaş listesinde ara (isOnline bilgisi için)
    const friendInfo = friends?.find(f => f.id === userId);
    if (friendInfo) {
      return friendInfo;
    }
    
    // Arkadaşlarda yoksa, sohbet listesinde (Conversation) ara
    const convoInfo = conversations?.find(c => c.otherUser.id === userId);
    if (convoInfo) {
      return convoInfo.otherUser; // isOnline: false (varsayılan)
    }
    
    return null; // Henüz veri yüklenmemiş olabilir
  }).filter((user): user is ChatUser => user !== null); // null olanları filtrele


  return (
    // Kayan Baloncuk Listesi
    <div className="fixed bottom-4 right-4 z-40 space-y-3">
      {bubbles.map(user => (
        <button
          key={user.id}
          onClick={() => openChat(user)}
          className="relative w-16 h-16 bg-zinc-800 rounded-full shadow-lg border-2 border-amber-400 hover:scale-110 transition-transform"
          title={`'${user.name}' kişisinden yeni mesaj`}
        >
          <img
            className="w-full h-full rounded-full object-cover"
            src={getAvatarUrl(user.avatarUrl)}
            alt={user.name}
          />
          {/* Online Statü */}
          {user.isOnline && (
            <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 ring-2 ring-zinc-800" />
          )}
          {/* Okunmamış Sayacı (+1, +2) */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-zinc-800">
            {unreadCounts[user.id] > 9 ? '9+' : unreadCounts[user.id]}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ChatBubbleList;
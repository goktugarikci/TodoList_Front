import React, { useState, useEffect, useRef, UIEvent } from 'react'; // UIEvent eklendi
import { useChat } from '../../contexts/ChatContext';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { useInfiniteQuery } from '@tanstack/react-query';
import { chatService } from '../../services/chatService';
import { formatMessageTimestamp } from '../../utils/formatDate';
import Spinner from '../common/Spinner';
import type { DirectMessageWithSender } from '../../types/api';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'; 

const ChatWidget: React.FC = () => {
  const { activeChatUser, closeChat, isMinimized, toggleMinimize } = useChat();
  const { user, socket } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // En alta kaydırmak için
  
  // YENİ: Sonsuz kaydırma için ana sohbet alanına referans
  const scrollContainerRef = useRef<HTMLDivElement>(null); 

  const {
    data: messagesData,
    fetchNextPage, // Eski mesajları yükle
    hasNextPage, // Yüklenecek daha fazla mesaj var mı?
    isFetchingNextPage, // Şu anda eski mesajlar mı yükleniyor?
    isLoading: isLoadingMessages,
  } = useInfiniteQuery({
    queryKey: ['directMessages', activeChatUser?.id],
    queryFn: ({ pageParam = 1 }) => 
      // API'den sayfa sayfa 20 mesaj ister
      chatService.getDirectMessages(activeChatUser!.id, pageParam as number, 20),
    initialPageParam: 1, 
    getNextPageParam: (lastPage, _allPages) => {
      // API'den gelen yanıta göre
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
    enabled: !!activeChatUser,
  });

  // --- KRİTİK DÜZELTME: Sıralama ve Zaman Damgası ---
  // API 'desc' (en yeni) gönderir -> flatMap birleştirir -> reverse() 'asc' (en eski) yapar.
  // Bu, 'bir dakikadan az önce' olan mesajın en altta (yeni) görünmesini sağlar.
  const messages: DirectMessageWithSender[] = messagesData?.pages.flatMap(page => page.messages).reverse() ?? [];

  // Yeni mesaj geldiğinde (messages dizisi değiştiğinde) veya pencere açıldığında en alta kaydır
  useEffect(() => {
    // Sadece yeni mesaj eklendiğinde (veya açıldığında) en alta atla
    // 'isFetchingNextPage' (yukarı kaydırıp eskiyi yüklerken) true ise bunu yapma
    if (messagesEndRef.current && !isMinimized && !isFetchingNextPage) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isMinimized, isFetchingNextPage]); // 'isFetchingNextPage' eklendi
  
  // Dışarı tıklandığında emoji penceresini kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // --- YENİ: "Daha Fazla Yükle" (Scroll to Top) Handler ---
  // Bu, "limit" sorununu çözen sonsuz kaydırma tetikleyicisidir.
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    
    // Eğer en üste kaydırılmışsa, 'isFetching' değilse ve daha fazla sayfa varsa
    if (target.scrollTop === 0 && !isFetchingNextPage && hasNextPage) {
      
      // 'fetchNextPage'i çağırmadan önce mevcut scroll pozisyonunu (yüksekliğini) sakla
      const oldScrollHeight = target.scrollHeight;

      fetchNextPage().then(() => {
        if (scrollContainerRef.current) {
          // Yeni mesajlar yüklendikten sonra,
          // scroll'u (yeni yükseklik - eski yükseklik) kadar aşağı kaydır.
          // Bu, yeni mesajlar üste eklendiğinde ekranın "atlamasını" engeller.
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - oldScrollHeight;
        }
      });
    }
  };
  // --- BİTİŞ ---
  
  // Mesaj Gönderme
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !activeChatUser) return;
    socket.emit('send_dm', {
      receiverId: activeChatUser.id,
      text: messageText,
    });
    setMessageText('');
    setShowEmojiPicker(false);
  };

  // Emoji seçildiğinde input'a ekle
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText(prevText => prevText + emojiData.emoji);
  };

  if (!activeChatUser) return null;

  // Küçültülmüş "Sohbet Balonu" (Minimize)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleMinimize} // Tıklayınca büyüt
          className="relative w-16 h-16 bg-zinc-800 rounded-full shadow-lg border-2 border-amber-400 hover:scale-110 transition-transform"
          title={`Sohbeti aç: ${activeChatUser.name}`}
        >
          <img
            className="w-full h-full rounded-full object-cover"
            src={activeChatUser.avatarUrl ? `${API_SOCKET_URL}${activeChatUser.avatarUrl}` : `https://ui-avatars.com/api/?name=${activeChatUser.name}`}
            alt={activeChatUser.name}
          />
          {activeChatUser.isOnline && (
            <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 ring-2 ring-zinc-800" />
          )}
        </button>
      </div>
    );
  }

  // Tam sohbet penceresi
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-zinc-800 shadow-2xl rounded-lg border border-zinc-700 flex flex-col">
      
      {/* Başlık (Minimize etmek için tıkla) */}
      <header 
        className="bg-zinc-900 p-3 flex justify-between items-center rounded-t-lg border-b border-zinc-700 cursor-pointer"
        onClick={toggleMinimize} 
        title="Sohbeti küçült"
      >
        <div className="flex items-center pointer-events-none min-w-0">
          <div className="relative flex-shrink-0">
            <img
              className="h-8 w-8 rounded-full object-cover"
              src={activeChatUser.avatarUrl ? `${API_SOCKET_URL}${activeChatUser.avatarUrl}` : `https://ui-avatars.com/api/?name=${activeChatUser.name}`}
              alt={activeChatUser.name}
            />
            {activeChatUser.isOnline && (
              <span className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-zinc-900" />
            )}
          </div>
          <div className="ml-2 min-w-0">
            <span className="font-semibold text-zinc-100 truncate">{activeChatUser.name}</span>
            <p className="text-xs text-zinc-400 truncate">@{activeChatUser.username || '...'}</p>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Başlığın tıklamasını (minimize) tetikleme
            closeChat(); // Tamamen kapat
          }} 
          className="text-zinc-400 hover:text-zinc-100"
          title="Sohbeti Kapat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </header>

      {/* GÜNCELLENDİ: Mesaj Listesi (onScroll ve ref eklendi) */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-4"
        ref={scrollContainerRef} // Scroll container ref
        onScroll={handleScroll} // Scroll olayı
      >
        {/* Eski mesajlar yüklenirken (yukarı kaydırınca) spinner göster */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        )}

        {/* İlk yükleme spinner'ı */}
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full"><Spinner /></div>
        ) : (
          // DÜZELTME: Mesajları 'reverse()' ile (eskiden yeniye) sırala
          messages.map(msg => ( 
            <MessageItem key={msg.id} message={msg} isMe={msg.senderId === user?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Penceresi */}
      {showEmojiPicker && (
        <div className="emoji-picker-container absolute bottom-20 right-0 z-10">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={Theme.DARK}
            lazyLoadEmojis={true}
            height={350}
            width={310}
          />
        </div>
      )}

      {/* Mesaj Yazma Alanı (Emoji Butonuyla) */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-700 flex items-center space-x-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Bir mesaj yazın..."
          className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-zinc-400 hover:text-amber-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </form>
    </div>
  );
};

// --- Alt Bileşen: Tek bir mesaj balonu ---
const MessageItem: React.FC<{ message: DirectMessageWithSender, isMe: boolean }> = ({ message, isMe }) => (
  // DÜZELTME: 'isMe' prop'una göre 'justify-end' (sağ) veya 'justify-start' (sol)
  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
    <div className="flex items-start max-w-[85%]">
      {!isMe && ( // Sadece 'Ben' değilse (mesajı alıyorsam) avatarı göster
        <img
          className="h-6 w-6 rounded-full object-cover mr-2 flex-shrink-0"
          src={message.sender.avatarUrl ? `${API_SOCKET_URL}${message.sender.avatarUrl}` : `https://ui-avatars.com/api/?name=${message.sender.name}`}
          alt={message.sender.name}
        />
      )}
      <div>
        <div
          className={`px-3 py-2 rounded-lg ${
            isMe 
              ? 'bg-amber-400 text-zinc-900 font-semibold' // Gönderen (Sarı)
              : 'bg-zinc-700 text-zinc-100' // Alınan (Gri)
          }`}
        >
          <p className="text-sm" style={{ wordBreak: 'break-word' }}>{message.text}</p>
        </div>
        {/* Zaman Damgası */}
        <p className={`text-xs text-zinc-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
          {formatMessageTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  </div>
);

export default ChatWidget;
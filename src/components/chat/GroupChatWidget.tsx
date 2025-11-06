import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../../services/chatService';
import { formatMessageTimestamp } from '../../utils/formatDate';
import Spinner from '../common/Spinner';
import type { MessageWithAuthor } from '../../types/api';
// YENİ: Emoji Kütüphanesi
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'; 
// YENİ: Bildirim yardımcıları
import { playNotificationSound, requestNotificationPermission } from '../../utils/notificationHelpers';
import { toast } from 'react-hot-toast'; // Pop-up için

interface GroupChatWidgetProps {
  boardId: string;
  boardName: string;
}

const GroupChatWidget: React.FC<GroupChatWidgetProps> = ({ boardId, boardName }) => {
  const { user, socket } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Emoji penceresi durumu
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Veri Çekme: (Limit kaldırıldığı için tüm mesajlar gelir)
  const { data: messages = [], isLoading } = useQuery<MessageWithAuthor[]>({
    queryKey: ['groupMessages', boardId],
    queryFn: () => chatService.getGroupMessages(boardId),
    enabled: !!boardId,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Socket.io Dinleyicileri (Katılma ve Yeni Mesaj Alma)
  useEffect(() => {
    if (!socket || !boardId || !user) return;

    socket.emit('join_board', boardId);

    const handleReceiveMessage = (newMessage: MessageWithAuthor) => {
      if (newMessage.boardId === boardId) {
        queryClient.setQueryData<MessageWithAuthor[]>(
          ['groupMessages', boardId],
          (oldData) => {
            if (!oldData) return [newMessage];
            return [...oldData, newMessage]; 
          }
        );

        // --- YENİ: BİLDİRİM MANTIĞI ---
        const isMeSender = newMessage.author?.id === user.id;

        // 1. Gönderen biz değilsek
        if (!isMeSender) {
          // 2. Pencere küçültülmüşse (yarı görünür) VEYA tarayıcı sekmesi aktif değilse
          if (isMinimized || document.hidden) {
            playNotificationSound();
            requestNotificationPermission(
              `${newMessage.author?.name || 'Biri'} (@${boardName})`, // Başlık
              newMessage.text // İçerik
            );
            
            // Pop-up (Açık ama odakta değilse)
            if (!isMinimized && document.hidden) {
               toast.custom((t) => (
                <div
                  className="max-w-md w-full bg-zinc-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-zinc-700"
                >
                  {/* ... (Pop-up içeriği - ChatContext'teki gibi) ... */}
                </div>
              ));
            }
          } else {
            // Pencere açıksa ve odaktaysa sadece sesi çal
            playNotificationSound();
          }
        }
        // --- BİTİŞ: BİLDİRİM MANTIĞI ---
      }
    };
    
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, boardId, queryClient, user, isMinimized]); // 'isMinimized' eklendi

  // 3. Yeni mesaj geldiğinde en alta kaydır
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);
  
  // 4. Dışarı tıklandığında emoji penceresini kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // 5. Mesaj Gönderme
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !socket) return;
    socket.emit('send_message', {
      boardId: boardId,
      text: messageText,
    });
    setMessageText('');
    setShowEmojiPicker(false);
  };
  
  // 6. Emoji seçildiğinde input'a ekle
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText(prevText => prevText + emojiData.emoji);
  };
  
  // Yarı görünür (küçültülmüş) mod
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        // Bireysel DM (right-4) ile çakışmasın diye sağdan daha uzağa
        className="fixed bottom-0 right-24 z-40 px-4 py-3 bg-zinc-800 shadow-lg rounded-t-lg border-t border-x border-zinc-700 hover:bg-zinc-700"
        title="Grup Sohbetini Aç"
      >
        <span className="font-semibold text-amber-400">{boardName} Sohbeti</span>
      </button>
    );
  }

  // Tam pencere modu (GÜNCELLENDİ: Boyut büyütüldü w-96 h-[500px])
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-zinc-800 shadow-2xl rounded-lg border border-zinc-700 flex flex-col">
      {/* Başlık (Tıklanınca küçültür) */}
      <header 
        className="bg-zinc-900 p-3 flex justify-between items-center rounded-t-lg border-b border-zinc-700 cursor-pointer"
        onClick={() => setIsMinimized(true)}
        title="Sohbeti küçült"
      >
        <span className="font-semibold text-amber-400">{boardName} Sohbeti</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} 
          className="text-zinc-400 hover:text-zinc-100"
          title="Sohbeti Küçült"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>
        </button>
      </header>

      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Spinner /></div>
        ) : (
          messages.map(msg => (
            <GroupMessageItem key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Penceresi (Gizli/Açık) */}
      {showEmojiPicker && (
        <div className="emoji-picker-container absolute bottom-16 right-0 z-10">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={Theme.DARK} // Koyu tema
            lazyLoadEmojis={true}
            height={350}
            width={310} // Boyut ayarlandı
          />
        </div>
      )}

      {/* Mesaj Yazma Alanı (Emoji Butonuyla) */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-700 flex items-center space-x-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Gruba mesaj yazın..."
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

// Alt Bileşen: Grup Mesajı Formatı (@name > message)
const GroupMessageItem: React.FC<{ message: MessageWithAuthor }> = ({ message }) => {
  return (
    <div className="flex items-start">
      <img
        className="h-8 w-8 rounded-full object-cover mr-3 flex-shrink-0"
        src={message.author?.avatarUrl ? `${API_SOCKET_URL}${message.author.avatarUrl}` : `https://ui-avatars.com/api/?name=${message.author?.name || '?'}`}
        alt={message.author?.name}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {/* @kullanıcıadı (veya isim) */}
          <span className="font-semibold text-amber-400 mr-2">
            @{message.author?.username || message.author?.name || 'Bilinmeyen'}
          </span>
          {/* Mesaj içeriği */}
          <span className="text-zinc-100" style={{ wordBreak: 'break-word' }}>
            {message.text}
          </span>
        </p>
        {/* Zaman Damgası */}
        <p className="text-xs text-zinc-500 mt-0.5">
          {formatMessageTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default GroupChatWidget;
// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/common/ReactionManager.tsx
import React, { Fragment, useMemo } from 'react';
import type { ReactionSummary } from '../../types/api';
import { Popover, Transition } from '@headlessui/react';

interface ReactionManagerProps {
  reactions: ReactionSummary[];
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
}

// Sizin istediğiniz 13 emoji
const PREDEFINED_EMOJIS = [
  '👍', '👎', '😀', '😁', '😄', '😅', '🤣', '😂', 
  '🤑', '🤬', '😡', '✔️', '❌'
];

const ReactionManager: React.FC<ReactionManagerProps> = ({ reactions, currentUserId, onToggleReaction }) => {

  // Reaksiyonları grupla
  const groupedReactions = useMemo(() => {
    return (reactions || []).reduce((acc, reaction) => {
      const { emoji, userId, user } = reaction; 
      if (!acc[emoji]) {
        acc[emoji] = { users: [], userIds: [], count: 0 };
      }
      acc[emoji].users.push(user?.name || 'Bilinmeyen'); // Tooltip için
      acc[emoji].userIds.push(userId); // 'Ben tıkladım mı?' kontrolü için
      acc[emoji].count++;
      return acc;
    }, {} as Record<string, { users: string[], userIds: string[], count: number }>);
  }, [reactions]);

  const handleEmojiSelect = (emoji: string, close: () => void) => {
    onToggleReaction(emoji);
    close(); 
  };

  return (
    <div className="flex items-center space-x-1 mt-2">
      {/* Mevcut Reaksiyon Butonları */}
      {Object.entries(groupedReactions).map(([emoji, data]) => {
        const hasReacted = data.userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => onToggleReaction(emoji)}
            title={data.users.join(', ')}
            className={`px-2 py-0.5 rounded-full text-xs flex items-center transition-colors
              ${hasReacted 
                ? 'bg-amber-400 text-zinc-900 font-semibold border border-amber-400' 
                : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600 border border-transparent'
              }`}
          >
            <span>{emoji}</span>
            <span className="ml-1">{data.count}</span>
          </button>
        );
      })}

      {/* Emoji Ekleme Butonu (Popover) */}
      <Popover>
        {({ open, close }) => (
          <>
            <Popover.Button 
              className="p-1 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 transition-colors"
              title="Tepki ekle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </Popover.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              {/* DÜZELTME (image_1ba342.png): 
                'absolute bottom-full right-0' kaldırıldı.
                HeadlessUI'nin pozisyonu (yukarı/aşağı) otomatik belirlemesine izin verildi.
                'z-60' modalın (z-50) üzerinde kalmasını sağlar.
              */}
              <Popover.Panel className="absolute z-60 right-0 mt-2 mb-2"> 
                <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl grid grid-cols-7 gap-1 w-64">
                  {PREDEFINED_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji, close)}
                      className="p-1 rounded-full hover:bg-zinc-600 transition-colors text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};

export default ReactionManager;                       
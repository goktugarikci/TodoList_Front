// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/common/Modal.tsx
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // GÜNCELLENDİ: xl ve 2xl eklendi
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',   // YENİ
    '2xl': 'max-w-2xl', // YENİ
  };

  const handleModalContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Paneli: Koyu Gri (bg-zinc-800) */}
      <div
        className={`bg-zinc-800 rounded-lg shadow-xl w-full m-4 ${sizeClasses[size]}`}
        onClick={handleModalContentClick}
      >
        {/* Modal Başlığı: Sınır (border-zinc-700) */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-700">
          {/* GÜNCELLENDİ: Başlık Rengi text-zinc-100 -> text-amber-400 */}
          <h3 id="modal-title" className="text-xl font-semibold text-amber-400">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Gövdesi */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
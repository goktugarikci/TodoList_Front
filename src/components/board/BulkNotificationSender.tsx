// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/BulkNotificationSender.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errorHelper';
import Spinner from '../common/Spinner';
import { toast } from 'react-hot-toast';
// DÜZELTME: Gerekli tipi import et
import type { BulkMessageRequest } from '../../types/api';

interface BulkNotificationSenderProps {
  boardId: string;
}

type TargetType = 'all' | 'board';

const BulkNotificationSender: React.FC<BulkNotificationSenderProps> = ({ boardId }) => {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<TargetType>('board');

  const mutation = useMutation({
    mutationFn: (data: BulkMessageRequest) => // Tipi burada da belirt
      adminService.sendBulkMessage(data),
    onSuccess: () => {
      toast.success('Toplu bildirim başarıyla gönderildi.');
      setMessage('');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Bildirim gönderilemedi.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Mesaj boş olamaz.');
      return;
    }

    // === HATA DÜZELTMESİ (image_132760.png) ===
    // 'data' objesinin tipini 'BulkMessageRequest' olarak açıkça tanımla
    const data: BulkMessageRequest = {
      message: message.trim(),
      target: target === 'all' ? 'all' : [boardId],
    };
    // === BİTİŞ ===

    mutation.mutate(data);
  };

  // Tema sınıfları
  const labelClasses = "block text-sm font-medium text-zinc-300";
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400";
  const primaryButtonClasses = "w-full flex justify-center px-4 py-2 font-semibold text-zinc-900 bg-amber-400 rounded-md hover:bg-amber-500 disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bulkMessage" className={labelClasses}>
          Bildirim Mesajı
        </label>
        <textarea
          id="bulkMessage"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={mutation.isPending}
          className={inputClasses}
          placeholder="Örn: Sistem 1 saatliğine bakıma girecektir..."
        />
      </div>
      <div>
        <label className={labelClasses}>Hedef Kitle</label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center">
            <input
              id="targetBoard"
              name="target"
              type="radio"
              value="board"
              checked={target === 'board'}
              onChange={() => setTarget('board')}
              className="h-4 w-4 text-amber-400 border-zinc-600 focus:ring-amber-500"
            />
            <label htmlFor="targetBoard" className="ml-3 block text-sm text-zinc-100">
              Sadece Bu Panodaki Üyeler
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="targetAll"
              name="target"
              type="radio"
              value="all"
              checked={target === 'all'}
              onChange={() => setTarget('all')}
              className="h-4 w-4 text-amber-400 border-zinc-600 focus:ring-amber-500"
            />
            <label htmlFor="targetAll" className="ml-3 block text-sm text-zinc-100">
              Tüm Kullanıcılar (Global Duyuru)
            </label>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className={primaryButtonClasses}
      >
        {mutation.isPending ? <Spinner size="sm" /> : 'Duyuruyu Gönder'}
      </button>
    </form>
  );
};

export default BulkNotificationSender;
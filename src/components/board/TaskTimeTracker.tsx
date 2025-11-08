// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/board/TaskTimeTracker.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntryService } from '../../services/timeEntryService';
import { getErrorMessage } from '../../utils/errorHelper';
import Spinner from '../common/Spinner';
import { toast } from 'react-hot-toast';
// DÜZELTME: Doğru tipler import edildi
import type { TimeEntryWithUser, PaginatedTaskTimeEntries, UpdateManualTimeEntryRequest } from '../../types/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth, API_SOCKET_URL } from '../../contexts/AuthContext';
import { getAvatarUrl } from '../../utils/getAvatarUrl';

interface TaskTimeTrackerProps {
  taskId: string;
  boardId: string; // Cache'i yenilemek için
}

// Süreyi (dakika) "1s 30d" formatına çevirir
const formatDuration = (minutes: number) => {
  if (!minutes || minutes <= 0) return '0d';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60); // Yuvarla
  let str = '';
  if (hours > 0) str += `${hours}s `;
  if (mins > 0) str += `${mins}d`;
  return str.trim() || '0d';
};

// Canlı sayaç için hook (DÜZELTME: Geri sayım ve ileri sayım)
const useLiveTimer = (startTime: string | null, countdownMinutes: number | null) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    // 1. Geri Sayım Modu (Süre girildiyse)
    if (countdownMinutes) {
      setRemainingSeconds(countdownMinutes * 60);
      const interval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    
    // 2. İleri Sayım Modu (Stopwatch - Süre girilmediyse)
    if (startTime) {
      const start = new Date(startTime).getTime();
      const update = () => {
        const now = Date.now();
        const seconds = Math.floor((now - start) / 1000);
        setRemainingSeconds(seconds); // İleri sayar
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
    
    // 3. Durum (Hiçbiri)
    setRemainingSeconds(0);

  }, [startTime, countdownMinutes]);

  // Saniyeyi "01:30:45" formatına çevir
  const formatLive = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  return {
    formattedTime: formatLive(remainingSeconds),
    rawSeconds: remainingSeconds,
  };
};

// --- Ana Bileşen ---
const TaskTimeTracker: React.FC<TaskTimeTrackerProps> = ({ taskId, boardId }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [manualDuration, setManualDuration] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  
  // Düzenleme modu için state
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithUser | null>(null);
  
  // Geri Sayım State'i
  const [countdownMinutes, setCountdownMinutes] = useState<number | null>(null);

  // 1. Görevin zaman kayıtlarını çek
  // DÜZELTME: 'PaginatedTaskTimeEntries' tipi kullanıldı
  const { data, isLoading: isLoadingEntries } = useQuery<PaginatedTaskTimeEntries>({
    queryKey: ['timeEntries', taskId],
    queryFn: () => timeEntryService.getEntriesForTask(taskId, 1, 50), // Son 50 kayıt
  });
  
  const entries = data?.entries || [];
  
  // Aktif (çalışan) bir zamanlayıcı var mı?
  const runningStopwatch = entries.find(e => !e.endTime && e.userId === user?.id);
  
  // DÜZELTME (image_772c5c.png - İstek 1 & 2): Canlı sayaç hook'u
  const { formattedTime: liveDuration, rawSeconds } = useLiveTimer(
    runningStopwatch?.startTime || null, // İleri sayım için
    countdownMinutes // Geri sayım için
  );
  
  // Aktif bir zamanlayıcı var mı? (Geri veya ileri)
  const isTimerRunning = !!runningStopwatch || !!countdownMinutes;

  // 2. Mutasyonlar (Optimistic Update ile)
  
  // DÜZELTME (image_771db1.png): 'actionType'ı kaldırdık, her mutasyonu ayrı yöneteceğiz.
  // Hata/Settled durumları için ortak opsiyonlar
  const mutationCallbacks = {
    onError: (err: unknown, variables: any, context: any) => {
      toast.error(getErrorMessage(err, 'İşlem başarısız oldu.'));
      // Optimistic update (eğer 'onMutate' kullansaydık) burada geri alınırdı
      if (context?.previousData) {
        queryClient.setQueryData(['timeEntries', taskId], context.previousData);
      }
    },
    onSettled: () => {
      // Başarılı veya hatalı, her durumda sunucudan en güncel veriyi çek
      queryClient.invalidateQueries({ queryKey: ['timeEntries', taskId] });
    },
  };

  const startTimerMutation = useMutation({
    mutationFn: () => timeEntryService.startTimer(taskId),
    // DÜZELTME (image_771dd2.png): 'onSuccess' vb. 'useMutation' içinde tanımlanmalı
    onSuccess: (newEntry) => {
      queryClient.setQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId], (old) => {
        if (!old) return { entries: [newEntry], totalEntries: 1, currentPage: 1, totalPages: 1 };
        return { ...old, entries: [newEntry, ...old.entries], totalEntries: old.totalEntries + 1 };
      });
    },
    ...mutationCallbacks, // onError ve onSettled'ı ekle
  });

  const stopTimerMutation = useMutation({
    mutationFn: (notes?: string) => timeEntryService.stopTimer(taskId, { notes }),
    onSuccess: (stoppedEntry) => {
      queryClient.setQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId], (old) => {
        if (!old) return old;
        return { ...old, entries: old.entries.map(e => e.id === stoppedEntry.id ? stoppedEntry : e) };
      });
    },
    ...mutationCallbacks,
  });

  const addManualEntryMutation = useMutation({
    mutationFn: (data: { durationInMinutes: number; date: string }) => 
      timeEntryService.addManualEntry(taskId, data),
    onSuccess: (newEntry) => {
      // DÜZELTME (image_771db7.png): Updater fonksiyonu yerine 'setQueryData'yı doğru kullan
      const oldData = queryClient.getQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId]);
      const newEntries = [newEntry, ...(oldData?.entries || [])];
      queryClient.setQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId], {
        ...oldData!,
        entries: newEntries,
        totalEntries: (oldData?.totalEntries || 0) + 1
      });
      toast.success("Manuel süre eklendi.");
      setManualDuration('');
    },
    ...mutationCallbacks,
  });
  
  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => timeEntryService.deleteTimeEntry(entryId),
    ...mutationCallbacks,
    // Optimistic update (Silme için)
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: ['timeEntries', taskId] });
      const previousData = queryClient.getQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId]);
      queryClient.setQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId], (old) => {
        if (!old) return old;
        const newEntries = old.entries.filter(e => e.id !== entryId);
        return { ...old, entries: newEntries, totalEntries: newEntries.length };
      });
      return { previousData };
    },
    onSuccess: () => toast.success('Zaman kaydı silindi.'),
  });
  
  const updateEntryMutation = useMutation({
    mutationFn: ({ entryId, data }: { entryId: string, data: UpdateManualTimeEntryRequest }) =>
      timeEntryService.updateTimeEntry(entryId, data),
    // DÜZELTME (image_818dc8.png): 'onSuccess' ve 'onError' callback'leri mutasyonun içinde olmalı
    ...mutationCallbacks,
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData<PaginatedTaskTimeEntries>(['timeEntries', taskId], (old) => {
        if (!old) return old;
        return { ...old, entries: old.entries.map(e => e.id === updatedEntry.id ? updatedEntry : e) };
      });
      toast.success('Zaman kaydı güncellendi.');
      setEditingEntry(null); // Düzenleme modunu kapat
    },
  });
  
  // 3. Handler'lar
  const handleToggleTimer = () => {
    // DÜZELTME (image_771dd2.png, image_81a864.png): 'mutate' fonksiyonları parametresiz veya doğru parametre ile çağrılmalı
    // 1. Çalışan bir İLERİ sayacı durdur
    if (runningStopwatch) {
      stopTimerMutation.mutate(undefined); // Argüman opsiyonel olduğu için 'undefined' göndermeye gerek yok
      return;
    }
    
    // 2. Çalışan bir GERİ sayacı durdur (ve manuel ekle)
    if (countdownMinutes) {
      const durationInMinutes = (countdownMinutes * 60 - rawSeconds) / 60; // Geçen süreyi hesapla
      if (durationInMinutes > 0.1) { // En az 1 saniye geçmişse
         addManualEntryMutation.mutate({ 
           durationInMinutes: Math.round(durationInMinutes), 
           date: new Date().toISOString().split('T')[0] 
         });
      }
      setCountdownMinutes(null); // Geri sayımı durdur
      setManualDuration('');
      return;
    }
    
    // 3. Yeni bir sayaç başlat
    const duration = parseInt(manualDuration, 10);
    if (duration > 0) {
      // Geri Sayım Başlat
      setCountdownMinutes(duration);
    } else {
      // İleri Sayım (Stopwatch) Başlat
      startTimerMutation.mutate(undefined);
    }
  };
  
  // Geri sayım bittiğinde
  useEffect(() => {
    if (countdownMinutes && rawSeconds === 0) {
      toast.success(`${countdownMinutes} dakikalık zamanlayıcı tamamlandı!`);
      // playNotificationSound(); // (Bu helper'ı import etmelisiniz)
      addManualEntryMutation.mutate({ 
        durationInMinutes: countdownMinutes, 
        date: new Date().toISOString().split('T')[0] 
      });
      setCountdownMinutes(null);
      setManualDuration('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSeconds, countdownMinutes]);

  const handleAddManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(manualDuration, 10);
    if (!duration || duration <= 0) {
      toast.error('Lütfen geçerli bir süre (dakika) girin.');
      return;
    }
    if (!manualDate) {
      toast.error('Lütfen geçerli bir tarih girin.');
      return;
    }
    addManualEntryMutation.mutate({ durationInMinutes: duration, date: manualDate });
  };
  
  const handleEditClick = (entry: TimeEntryWithUser) => {
    setEditingEntry(entry);
    setManualDuration(entry.duration?.toString() || '');
    setManualDate(format(new Date(entry.startTime), 'yyyy-MM-dd'));
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    
    const duration = parseInt(manualDuration, 10);
    if (!duration || duration <= 0) {
      toast.error('Lütfen geçerli bir süre (dakika) girin.');
      return;
    }
    updateEntryMutation.mutate({
      entryId: editingEntry.id,
      data: { durationInMinutes: duration, date: manualDate }
    });
  };

  const handleDeleteClick = (entryId: string) => {
    if (window.confirm("Bu zaman kaydını kalıcı olarak silmek istediğinizden emin misiniz?")) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  // DÜZELTME (image_772c5c.png): Toplam süreye canlı sayacı (dakikaya çevirip) ekle
  const baseTotalDuration = entries.reduce((acc, entry) => {
    // Çalışan kaydı toplama dahil etme, onu 'elapsedSeconds' ile ayrıca ekleyeceğiz
    if (entry.id === runningStopwatch?.id) return acc;
    return acc + (entry.duration || 0);
  }, 0);
  
  // DÜZELTME (image_772c5c.png): Canlı toplamı göster (Geri sayım toplamı etkilemez)
  const liveTotalMinutes = baseTotalDuration + (runningStopwatch ? (rawSeconds / 60) : 0);

  return (
    <div className="space-y-4 max-h-[60vh] flex flex-col">
      
      {/* 1. Zamanlayıcı Butonu */}
      <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-md">
        <div>
          <span className="text-sm text-zinc-400">Toplam Süre</span>
          {/* DÜZELTME (image_772c5c.png): Canlı toplamı göster */}
          <p className="text-2xl font-bold text-zinc-100">{formatDuration(liveTotalMinutes)}</p>
        </div>
        <button
          onClick={handleToggleTimer}
          disabled={startTimerMutation.isPending || stopTimerMutation.isPending}
          className={`px-4 py-2 rounded-md font-semibold flex items-center transition-colors ${
            isTimerRunning
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50`}
        >
          {isTimerRunning ? (
            // DÜZELTME: Canlı sayaç (image_772c5c.png)
            <span className="text-sm font-mono">{liveDuration}</span>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
          {isTimerRunning ? 'Durdur' : 'Başlat'}
        </button>
      </div>

      {/* 2. Manuel Ekleme / Düzenleme Formu */}
      <form onSubmit={editingEntry ? handleUpdateEntry : handleAddManualEntry} className="flex space-x-2">
        <input
          type="number"
          value={manualDuration}
          onChange={(e) => setManualDuration(e.target.value)}
          placeholder="Süre (dakika)"
          className="w-1/2 px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md"
        />
        <input
          type="date"
          value={manualDate}
          onChange={(e) => setManualDate(e.target.value)}
          className="w-1/2 px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md"
        />
        <button
          type="submit"
          disabled={addManualEntryMutation.isPending || updateEntryMutation.isPending}
          className={`px-3 py-2 text-zinc-900 rounded-md font-semibold ${editingEntry ? 'bg-blue-500 hover:bg-blue-600' : 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600'} disabled:opacity-50`}
        >
          {editingEntry ? 'Güncelle' : 'Ekle'}
        </button>
        {editingEntry && (
          <button type="button" onClick={() => setEditingEntry(null)} className="px-3 py-2 bg-zinc-700 text-zinc-100 rounded-md hover:bg-zinc-600">
            İptal
          </button>
        )}
      </form>
      
      {/* 3. Kayıt Listesi */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        <h4 className="text-lg font-semibold text-zinc-100">Zaman Kayıtları</h4>
        {isLoadingEntries && <div className="flex justify-center"><Spinner /></div>}
        
        {!isLoadingEntries && entries.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-2">Henüz zaman kaydı yok.</p>
        )}
        
        {entries.map(entry => (
          <div key={entry.id} className="p-2 bg-zinc-900 rounded-md flex justify-between items-center group">
            <div className="flex items-center">
               <img
                className="w-6 h-6 rounded-full object-cover mr-2"
                src={getAvatarUrl(entry.user.avatarUrl)}
                alt={entry.user?.name}
              />
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {entry.user?.name || 'Bilinmeyen'}
                </p>
                {/* DÜZELTME (image_772c5c.png - İstek 4): Bitiş zamanını göster */}
                <p className="text-xs text-zinc-400">
                  {format(new Date(entry.startTime), 'dd MMM, HH:mm', { locale: tr })}
                  {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <p className="text-sm font-semibold text-amber-400">
                {entry.duration ? formatDuration(entry.duration) : (
                  <span className="text-green-500 animate-pulse">Çalışıyor...</span>
                )}
              </p>
              {/* Düzenle/Sil Butonları */}
              {entry.endTime && (user?.role === 'ADMIN' || entry.userId === user?.id) && (
                <>
                  <button onClick={() => handleEditClick(entry)} className="p-1 text-zinc-400 hover:text-blue-400 opacity-0 group-hover:opacity-100" title="Düzenle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={() => handleDeleteClick(entry.id)} className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100" title="Sil">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskTimeTracker;
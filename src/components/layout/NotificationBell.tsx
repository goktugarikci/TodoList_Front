// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/layout/NotificationBell.tsx
import React, { Fragment, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import Spinner from '../common/Spinner';
import { useNavigate } from 'react-router-dom';
import { formatMessageTimestamp } from '../../utils/formatDate';
import { getErrorMessage } from '../../utils/errorHelper';
import type { NotificationDetailed, PaginatedNotifications } from '../../types/api';
import { toast } from 'react-hot-toast';

const NotificationBell: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { socket } = useAuth(); // Socket bağlantısını al

  // 1. Okunmamış bildirim sayısını almak için sorgu (Sadece sayıyı alır)
  const { data: unreadData } = useQuery<PaginatedNotifications>({
    queryKey: ['notifications', { unreadOnly: true, limit: 1 }],
    queryFn: () => notificationService.getNotifications({ unreadOnly: true, limit: 1 }),
    refetchInterval: 60000, // Her 60 saniyede bir kontrol et
  });
  
  const unreadCount = unreadData?.totalNotifications || 0;

  // 2. Dropdown'da gösterilecek son 5 bildirimi almak için sorgu
  const { data: recentNotifications, isLoading } = useQuery<PaginatedNotifications>({
    queryKey: ['notifications', { limit: 5 }],
    queryFn: () => notificationService.getNotifications({ page: 1, limit: 5 }),
    enabled: false, // Sadece menü açıldığında tetiklenecek
  });
  
  // 3. Bildirimleri anlık olarak yenilemek için Socket dinleyicisi
  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notification: NotificationDetailed) => {
      console.log('Yeni bildirim alındı (Socket):', notification);
      toast.success(notification.message, { icon: '🔔' });
      // Hem sayacı hem de listeyi yenile
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('new_notification', handleNewNotification);
    
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  // 4. Eylemler (Mutasyonlar)
  const markReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      toast.success('Tümü okundu olarak işaretlendi.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Hata")),
  });

  // 5. Handler'lar
  const handleOpenMenu = () => {
    // Menü açıldığında son bildirimleri (tekrar) çek
    queryClient.refetchQueries({ queryKey: ['notifications', { limit: 5 }] });
  };

  const handleNotificationClick = (notification: NotificationDetailed) => {
    // Tıklananı okundu yap
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    // İlgili yere yönlendir (şimdilik sadece görev)
    if (notification.taskId && notification.boardId) {
      // Pano detay sayfasına yönlendir
      navigate(`/board/${notification.boardId}`);
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button 
        onClick={handleOpenMenu}
        className="relative p-2 text-zinc-400 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-800 rounded-full"
      >
        <span className="sr-only">Bildirimler</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-600 ring-2 ring-zinc-800" />
        )}
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right divide-y divide-zinc-700 rounded-md bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-zinc-700 z-10">
          <div className="px-3 py-2 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-100">Bildirimler</h3>
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
              className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
            >
              Tümünü Okundu İşaretle
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading && <div className="flex justify-center p-4"><Spinner /></div>}
            
            {!isLoading && (!recentNotifications?.notifications || recentNotifications.notifications.length === 0) && (
              <p className="text-sm text-zinc-400 text-center p-4">Yeni bildirim yok.</p>
            )}
            
            {recentNotifications?.notifications.map(notification => (
              <Menu.Item key={notification.id}>
                {({ active }) => (
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`${active ? 'bg-zinc-700' : ''} w-full text-left p-3 transition-colors`}
                  >
                    <div className="flex items-start">
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                      )}
                      <p className={`text-sm ${notification.isRead ? 'text-zinc-400' : 'text-zinc-100'}`}>
                        {notification.message}
                      </p>
                    </div>
                    <time className={`text-xs ${notification.isRead ? 'text-zinc-500' : 'text-zinc-400'} mt-1`}>
                      {formatMessageTimestamp(notification.createdAt)}
                    </time>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationBell;
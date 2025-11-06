import React, { useState, createContext, useContext, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../common/Spinner';

import UserSettingsModal from '../../components/settings/UserSettingsModal';
import FriendsPanel from '../../components/friends/FriendsPanel';
// Panelleri açmak için bir context
interface LayoutContextType {
  openSettings: () => void;
  openFriends: () => void;
}
const LayoutContext = createContext<LayoutContextType | null>(null);
// Bu hook'u (useLayout) diğer bileşenlerde (örn: BoardDetailPage) kullanacağız
export const useLayout = () => useContext(LayoutContext)!;

/**
 * Bu bileşen, altındaki rotaları korur VE
 * tüm korumalı sayfalarda ortak olan panelleri (Ayarlar, Arkadaşlar) yönetir.
 */
export const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // YENİ: Panel state'leri
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <LayoutContext.Provider 
      value={{ 
        openSettings: () => setIsSettingsModalOpen(true),
        openFriends: () => setIsFriendsPanelOpen(true),
      }}
    >
      <div className="app-layout">
        {/* Rota içeriği (BoardPage veya BoardDetailPage) buraya gelir */}
        <Outlet /> 
        
        {/* --- YENİ: PANELLER BURADA RENDER EDİLİR --- */}
        {/* Bu paneller artık 'useLayout' hook'u aracılığıyla
            herhangi bir alt bileşenden (Header, Menü vb.) açılabilir. */}
        
        <UserSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
        
        <FriendsPanel
          isOpen={isFriendsPanelOpen}
          onClose={() => setIsFriendsPanelOpen(false)}
        />
        {/* --- BİTİŞ --- */}
      </div>
    </LayoutContext.Provider>
  );
};
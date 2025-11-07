// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/components/layout/ProtectedLayout.tsx
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

export const useLayout = () => useContext(LayoutContext)!;

/**
 * Bu bileşen, altındaki rotaları korur VE
 * tüm korumalı sayfalarda ortak olan panelleri (Ayarlar, Arkadaşlar) yönetir.
 */
export const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
        
        {/* Paneller burada render edilir */}
        <UserSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
        
        <FriendsPanel
          isOpen={isFriendsPanelOpen}
          onClose={() => setIsFriendsPanelOpen(false)}
        />
      </div>
    </LayoutContext.Provider>
  );
};
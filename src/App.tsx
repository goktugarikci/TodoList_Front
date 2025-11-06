import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import BoardPage from './pages/BoardPage'; // Pano Listesi Sayfası
import BoardDetailPage from './pages/BoardDetailPage'; // YENİ: Pano Detay Sayfası
import { ProtectedLayout } from './components/layout/ProtectedLayout'; // Korumalı Rota
import Spinner from './components/common/Spinner'; // Yükleme ikonu

/**
 * Ana Uygulama Bileşeni.
 * Artık tüm sayfa yönlendirmelerini (routing) yönetir.
 */
const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // AuthContext, sayfa yenilendiğinde token'ı doğrularken
  // 'isLoading' true olur. Bu sırada bir yüklenme ekranı gösteririz.
  if (isLoading) {
    return (
      // Koyu tema yükleme ekranı
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* KORUMALI ALAN: Sadece giriş yapmış kullanıcılar erişebilir.
        ProtectedLayout (Navigasyon çubuğu vb. içerir)
      */}
      <Route element={<ProtectedLayout />}>
        {/* /boards -> Pano listesini göster (BoardPage) */}
        <Route 
          path="/boards" 
          element={isAuthenticated ? <BoardPage /> : <Navigate to="/" replace />} 
        />
        {/* /board/:boardId -> Pano detayını göster (YENİ SAYFA) */}
        <Route 
          path="/board/:boardId" 
          element={isAuthenticated ? <BoardDetailPage /> : <Navigate to="/" replace />} 
        />
      </Route>

      {/* HERKESE AÇIK ALAN:
      */}
      {/* / -> Ana sayfa */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/boards" replace /> : <LandingPage />} 
      />
      
      {/* TODO: Google OAuth Callback rotası */}
      {/* <Route path="/auth/callback" element={<GoogleCallbackHandler />} /> */}

      {/* Bulunamayan tüm rotaları ana sayfaya yönlendir */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/boards" : "/"} replace />} />
    </Routes>
  );
};

export default App;
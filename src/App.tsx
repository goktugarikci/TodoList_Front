// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import BoardPage from './pages/BoardPage'; 
import BoardDetailPage from './pages/BoardDetailPage'; 
import { ProtectedLayout } from './components/layout/ProtectedLayout'; 
import Spinner from './components/common/Spinner';
// YENİ: Google Callback sayfasını import et
import AuthCallbackPage from './pages/AuthCallbackPage'; 

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* KORUMALI ALAN: Sadece giriş yapmış kullanıcılar erişebilir. */}
      <Route element={<ProtectedLayout />}>
        <Route 
          path="/boards" 
          element={isAuthenticated ? <BoardPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/board/:boardId" 
          element={isAuthenticated ? <BoardDetailPage /> : <Navigate to="/" replace />} 
        />
      </Route>

      {/* HERKESE AÇIK ALAN: */}
      
      {/* YENİ: Google OAuth Callback Rotası */}
      <Route 
        path="/auth/callback" 
        element={<AuthCallbackPage />} 
      />
      
      {/* / -> Ana sayfa */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/boards" replace /> : <LandingPage />} 
      />
      
      {/* Bulunamayan tüm rotaları ana sayfaya yönlendir */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/boards" : "/"} replace />} />
    </Routes>
  );
};

export default App;
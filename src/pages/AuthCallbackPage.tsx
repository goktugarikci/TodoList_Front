// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/pages/AuthCallbackPage.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/common/Spinner';

/**
 * Google OAuth'tan (backend'den) gelen token'ı yakalayan
 * ve oturumu başlatan ara sayfa.
 */
const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenFromCallback } = useAuth(); 

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Token'ı AuthContext'e ve localStorage'a kaydet
      setTokenFromCallback(token);
      
      // Kullanıcıyı panolar sayfasına yönlendir
      navigate('/boards', { replace: true });
    } else {
      // Token yoksa (hata oluştuysa), ana sayfaya (login) yönlendir
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate, setTokenFromCallback]); 

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-900">
      <Spinner size="lg" />
      <p className="text-zinc-400 mt-4">Giriş yapılıyor, lütfen bekleyin...</p>
    </div>
  );
};

export default AuthCallbackPage;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal'; // Koyu temalı Modal'ı import et
import Spinner from '../common/Spinner'; // Sarı temalı Spinner'ı import et
import { getErrorMessage } from '../../utils/errorHelper';

// AuthContext'ten API_SOCKET_URL'i (Google Login için) çekmek
// Not: AuthContext bu modalın dışında olduğu için import edemeyiz.
// Şimdilik URL'i manuel olarak tanımlayacağız.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setView(initialView); 
    }
  }, [isOpen, initialView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      if (view === 'login') {
        if (!email || !password) throw new Error('E-posta ve şifre gereklidir.');
        // DÜZELTME: Fonksiyona obje olarak gönder
        await auth.login({ email, password });
      } else {
        if (password !== confirmPassword) throw new Error('Şifreler uyuşmuyor.');
        if (!name || !email || !password) throw new Error('Tüm alanlar gereklidir.');
        // DÜZELTME: Fonksiyona obje olarak gönder
        await auth.register({ name, email, password });
      }
      onClose();
    } catch (err: any) {
      setError(getErrorMessage(err, "Bilinmeyen bir hata oluştu."));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setView(view === 'login' ? 'register' : 'login');
    setError(null);
  };

  // Form içeriğini dinamik olarak render et (KOYU TEMA GÜNCELLEMESİ)
  const renderFormContent = () => {
    const inputClasses = "mt-1 block w-full px-3 py-2 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-amber-400";
    const labelClasses = "block text-sm font-medium text-zinc-300";

    if (view === 'login') {
      return (
        <>
          <div>
            <label htmlFor="email" className={labelClasses}>E-posta Adresi</label>
            <input
              id="email" type="email" autoComplete="email" required
              disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClasses}>Şifre</label>
            <input
              id="password" type="password" autoComplete="current-password" required
              disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>
        </>
      );
    } else {
      return (
        <>
          <div>
            <label htmlFor="name" className={labelClasses}>İsim</label>
            <input
              id="name" type="text" autoComplete="name" required
              disabled={isLoading} value={name} onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="email-reg" className={labelClasses}>E-posta Adresi</label>
            <input
              id="email-reg" type="email" autoComplete="email" required
              disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="password-reg" className={labelClasses}>Şifre</label>
            <input
              id="password-reg" type="password" autoComplete="new-password" required
              disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClasses}>Şifre (Tekrar)</label>
            <input
              id="confirmPassword" type="password" autoComplete="new-password" required
              disabled={isLoading} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClasses} ${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-zinc-700'}`}
            />
          </div>
        </>
      );
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={view === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm text-center text-red-200 bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
            {error}
          </div>
        )}

        {renderFormContent()}
        
        {/* Gönder Butonu (Sarı Tema) */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center px-4 py-2 font-semibold text-zinc-900 bg-amber-400 rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50"
          >
            {isLoading ? <Spinner size="sm" /> : (view === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </div>
      </form>

      {/* Google ile Giriş (Açık Renk Buton) */}
      <div className="my-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-800 text-zinc-500">VEYA</span>
          </div>
        </div>
        <button
          disabled={isLoading}
          onClick={() => {
            // Google Login için: Backend adresinize yönlendirin
            window.location.href = `${API_URL}/api/auth/google`;
          }}
          className="mt-4 w-full flex justify-center px-4 py-2 font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
             <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.8c-.57 2.73-2.23 4.96-4.66 6.53l7.38 5.71C44.38 36.3 46.98 30.95 46.98 24.55z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.38-5.71c-2.23 1.5-5.06 2.4-8.51 2.4-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Google ile Devam Et
        </button>
      </div>

      {/* Görünüm Değiştirme Linki */}
      <p className="text-sm text-center text-zinc-400">
        {view === 'login' ? 'Hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}
        <button
          onClick={toggleView}
          disabled={isLoading}
          className="font-medium text-amber-400 hover:text-amber-300 ml-1"
        >
          {view === 'login' ? 'Kayıt Olun' : 'Giriş Yapın'}
        </button>
      </p>
    </Modal>
  );
};

export default AuthModal;
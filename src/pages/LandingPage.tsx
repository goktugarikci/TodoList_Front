// LandingPage.tsx

import React, { useState, useEffect, JSX } from 'react';
// --- YENİ EKLENDİ ---
import AuthModal from '../components/auth/AuthModal'; // Oluşturduğumuz AuthModal'ı import et
// --- BİTİŞ ---

// --- 1. Lokal Veri (İstediğiniz gibi local dosyadan alındı) ---
// (Teknoloji verileri ve ikonlar)
const technologyData = [
  {
    name: "React (TypeScript)",
    description: "Kullanıcı arayüzleri oluşturmak için güçlü, bileşen tabanlı kütüphane.",
    icon: (
      <svg fill="currentColor" className="w-10 h-10 text-blue-600" viewBox="0 0 24 24">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.66 10.6 15.2 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.34 6.4 14.8 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.17 1.2 2.7 2.4 5.5 2.4 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2-1.8-.913-.228-1.565-.89-2.288-1.624-1.17-1.2-2.7-2.4-5.5-2.4z" />
      </svg>
    ),
  },
  {
    name: "Node.js / Express",
    description: "Hızlı, ölçeklenebilir ve yüksek performanslı backend API'leri oluşturmak için.",
    icon: (
      <svg fill="currentColor" className="w-10 h-10 text-green-600" viewBox="0 0 24 24">
        <path d="M21.3 9.682v4.636C21.3 16.034 20.104 17.5 18 17.5s-3.3-1.466-3.3-3.182v-4.636c0-1.716 1.196-3.182 3.3-3.182s3.3 1.466 3.3 3.182zM18 7.9c-.88 0-1.5.545-1.5 1.782v4.636c0 1.237.62 1.782 1.5 1.782s1.5-.545 1.5-1.782v-4.636C19.5 8.445 18.88 7.9 18 7.9zM9.4 6.5h3.2v11H9.4V6.5zM12.4 16.1h-2.8v1.4h2.8v-1.4zM7.5 6.5h3v9.6h-3V6.5zM0 6.5h3.2v11H0V6.5z" />
      </svg>
    ),
  },
  {
    name: "Prisma ORM",
    description: "Modern, tip-güvenli (type-safe) veritabanı erişimi ve şema yönetimi.",
    icon: (
      <svg fill="currentColor" className="w-10 h-10 text-gray-700" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
      </svg>
    ),
  },
];

const footerData = {
  links: [
    { name: "GitHub", url: "https://github.com" },
    { name: "Kullanım Koşulları", url: "#" },
  ],
  emails: [ "destek@todolist.com" ],
};


// --- 2. Alt Bileşenler (Güncellendi) ---

// --- YENİ: Header'ın alacağı prop'lar ---
interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}
// --- BİTİŞ ---

// Header Bileşeni
const Header: React.FC<HeaderProps> = ({ onLoginClick, onRegisterClick }) => (
  // Arka plan koyu, hafif bulanık
  <header className="fixed top-0 left-0 w-full bg-zinc-900 bg-opacity-80 backdrop-blur-md p-5 z-50 border-b border-zinc-700">
    <nav className="container mx-auto flex justify-between items-center">
      <div className="text-amber-400 text-2xl font-bold"> {/* Logo -> Sarı */}
        TodoList
      </div>
      <div className="space-x-4">
        <button
          onClick={onLoginClick}
          className="text-zinc-300 hover:text-amber-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Giriş Yap
        </button>
        <button
          onClick={onRegisterClick}
          className="bg-amber-400 text-zinc-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-amber-500 transition-colors"
        >
          Kayıt Ol
        </button>
      </div>
    </nav>
  </header>
);

interface TechCardProps {
  tech: {
    name: string;
    description: string;
    icon: JSX.Element;
  };
}

const TechnologyCard: React.FC<TechCardProps> = ({ tech }) => (
  // Kartlar Koyu Gri (bg-zinc-800)
  <div className="bg-zinc-800 p-6 rounded-lg shadow-xl transform transition-transform duration-300 hover:scale-105 border border-zinc-700">
    <div className="flex items-center space-x-4 mb-4">
      {tech.icon}
      <h3 className="text-xl font-semibold text-zinc-100">{tech.name}</h3>
    </div>
    <p className="text-zinc-400">{tech.description}</p>
  </div>
);

interface FooterProps {
  links: { name: string; url: string }[];
  emails: string[];
}

const Footer: React.FC<FooterProps> = ({ links, emails }) => (
  // Footer En Koyu (bg-zinc-950)
  <footer className="bg-zinc-950 text-zinc-400 py-12">
    <div className="container mx-auto px-6 text-center">
      <h4 className="text-lg font-semibold text-amber-400 mb-4">İletişim</h4> {/* Başlık Sarı */}
      <div className="flex justify-center gap-x-6 mb-4">
        {links.map(link => (
          <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
            {link.name}
          </a>
        ))}
      </div>
      <div className="mb-6">
        {emails.map(email => ( <p key={email} className="text-sm">{email}</p> ))}
      </div>
      <p className="text-xs">&copy; {new Date().getFullYear()} TodoList App. Tüm hakları saklıdır.</p>
    </div>
  </footer>
);

interface HeroProps {
  contentOpacity: number;
  bgOpacity: number;
  onRegisterClick: () => void;
}

const HeroSection: React.FC<HeroProps> = ({ contentOpacity, bgOpacity, onRegisterClick }) => (
  <div className="h-screen sticky top-0 z-10 flex items-center justify-center text-center">
    
    {/* Arka Plan Görseli (Eğer açıksa, opaklığını koru) */}
    <img
      src="/bg.png"
      alt="Arka Plan"
      className="absolute top-0 left-0 w-full h-full object-cover z-10"
      style={{ opacity: bgOpacity }}
    />
    {/* GÜNCELLEME: Arka plan resminin üzerine koyu bir katman ekle */}
    <div className="absolute inset-0 bg-zinc-900 opacity-50 z-20"></div>

    {/* İçerik (Metinler Beyaz) */}
    <div
      className="relative z-30 p-4"
      style={{ opacity: contentOpacity }}
    >
      <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-white drop-shadow-lg">
        Tüm Görevleriniz. Tek Yerde.
      </h1>
      <p className="text-xl md:text-2xl text-zinc-200 mb-8 drop-shadow-md">
        Ekibinizle işbirliği yapın, projelerinizi yönetin ve hedeflerinize ulaşın.
      </p>
      {/* Buton (Sarı) */}
      <button
        onClick={onRegisterClick}
        className="bg-amber-400 text-zinc-900 px-10 py-4 rounded-lg text-lg font-bold hover:bg-amber-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        Ücretsiz Başla
      </button>
    </div>
  </div>
);

interface FeaturesProps {
  techs: TechCardProps['tech'][];
  opacity: number;
}

const FeaturesSection: React.FC<FeaturesProps> = ({ techs, opacity }) => (
  // Arka Plan Kömür (bg-zinc-900)
  <div 
    className="relative z-20 bg-zinc-900 pt-20 pb-24 min-h-screen"
    style={{ opacity: opacity }}
  >
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center text-zinc-100 mb-16">
        Güçlü Teknolojilerle Desteklenir
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {techs.map(tech => (
          <TechnologyCard key={tech.name} tech={tech} />
        ))}
      </div>
    </div>
  </div>
);

// --- 3. Ana Uygulama Bileşeni (Güncellendi) ---

const App: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  // --- YENİ: Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');
  
  const openLoginModal = () => {
    setModalView('login');
    setIsModalOpen(true);
  };
  
  const openRegisterModal = () => {
    setModalView('register');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);
  // --- BİTİŞ: Modal State ---


  // Kaydırma efektleri için opaklık hesabı
  const heroBgOpacity = Math.max(0, 1 - scrollY / 600);
  const heroContentOpacity = Math.max(0, 1 - scrollY / 400);
  const featuresOpacity = Math.min(1, Math.max(0, (scrollY - 300) / 300));

  // Kaydırma olayını dinle
  const handleScroll = () => {
    setScrollY(window.pageYOffset);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="antialiased bg-zinc-900">
      {/* State fonksiyonlarını Header'a prop olarak geç */}
      <Header 
        onLoginClick={openLoginModal}
        onRegisterClick={openRegisterModal}
      />
      
      <main>
        <HeroSection 
          contentOpacity={heroContentOpacity} 
          bgOpacity={heroBgOpacity} 
          onRegisterClick={openRegisterModal} // "Ücretsiz Başla" butonu için
        />
        <FeaturesSection 
          techs={technologyData} 
          opacity={featuresOpacity}
        />
      </main>
      
      <Footer links={footerData.links} emails={footerData.emails} />
      
      {/* --- YENİ: Modal'ı sayfaya ekle --- */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialView={modalView}
      />
      {/* --- BİTİŞ --- */}

    </div>
  );
};

export default App;
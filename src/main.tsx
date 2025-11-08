import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import ChatWidget from './components/chat/ChatWidget' // Açık sohbet penceresi
import ChatBubbleList from './components/chat/ChatBubbleList' // Kayan baloncuklar
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider> 
            
            <App /> {/* Ana Uygulama */}
            
            {/* Sohbet Sistemi (Tüm sayfaların üstünde) */}
            <ChatWidget />      {/* 1. Sadece sohbet AÇIKKEN görünür */}
            <ChatBubbleList />  {/* 2. Sadece sohbet KAPALIYKEN ve okunmamış mesaj varsa görünür */}
            {/* Pop-up Bildirim Konteyneri */}
            <Toaster position="bottom-right" />

          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
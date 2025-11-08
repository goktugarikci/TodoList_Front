// goktugarikci/todolist_front/TodoList_Front-8a57f0ff9ce121525b5f99cbb4b27dcf9de3c497/src/utils/getAvatarUrl.ts

// API_SOCKET_URL'i AuthContext'ten alıp burada tekrar tanımlıyoruz
const API_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Avatar URL'sini doğru formatta döndürür.
 * Eğer URL "http" ile başlıyorsa (Google linki), doğrudan döndürür.
 * Değilse (örn: /uploads/...), başına API adresini ekler.
 * @param url Veritabanından gelen avatarUrl (string | null | undefined)
 * @param name Resim yoksa UI Avatars için kullanılacak isim
 * @returns Tam ve geçerli bir URL
 */
export const getAvatarUrl = (url: string | null | undefined, name: string = '?'): string => {
  // 1. URL varsa
  if (url) {
    // 2. URL zaten tam bir linkse (Google linki)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // 3. URL yerel bir path ise (örn: /uploads/...)
    return `${API_SOCKET_URL}${url}`;
  }
  
  // 4. URL yoksa, UI Avatars'a git
  return `https://ui-avatars.com/api/?name=${name}&background=random`;
};
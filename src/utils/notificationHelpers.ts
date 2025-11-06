/**
 * Bildirim sesi çalar (public/notification.mp3)
 */
export const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3'); 
  audio.play().catch(e => console.warn("Ses çalma hatası (kullanıcı etkileşimi gerekebilir):", e));
};

/**
 * Kullanıcıdan masaüstü bildirimi izni ister ve bildirimi gösterir.
 */
export function requestNotificationPermission(title: string, body: string) {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı masaüstü bildirimlerini desteklemiyor.');
    return;
  }

  // Durum 'granted' (izin verilmiş) ise, direkt bildirimi göster
  if (Notification.permission === 'granted') {
    new Notification(title, { body: body, icon: '/favicon.ico' }); // icon opsiyonel
  } 
  // Durum 'denied' (reddedilmiş) değilse (yani 'default' ise), izin iste
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      // Kullanıcı izni o an verdiyse, bildirimi göster
      if (permission === 'granted') {
        new Notification(title, { body: body, icon: '/favicon.ico' });
      }
    });
  }
  // Eğer 'denied' ise, kullanıcı ayarlarından manuel açana kadar rahatsız etme
}
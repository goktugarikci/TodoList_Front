import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale'; // Türkçe dil desteği

/**
 * API'den gelen ISO tarih string'ini "5 dakika önce", "Dün 14:30" gibi
 * kullanıcı dostu bir formata çevirir.
 */
export const formatMessageTimestamp = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);

    // formatDistanceToNow: "5 dakika önce", "yaklaşık 1 saat önce" vb.
    // addSuffix: true -> "önce" ekini ekler
    if (isToday(date)) {
      // Eğer 1 saatten yeniyse "X dakika önce" de
      const diffInMinutes = (new Date().getTime() - date.getTime()) / 60000;
      if (diffInMinutes < 60) {
        return formatDistanceToNow(date, { addSuffix: true, locale: tr });
      }
      // Bugün ama 1 saatten eskiyse: "Bugün 14:30"
      return `Bugün ${format(date, 'HH:mm')}`;
    }

    if (isYesterday(date)) {
      // Dün ise: "Dün 14:30"
      return `Dün ${format(date, 'HH:mm')}`;
    }

    // Daha eskiyse: "15 Eki 14:30"
    return format(date, 'dd MMM HH:mm', { locale: tr });

  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return isoDate; // Hata olursa ham tarihi döndür
  }
};
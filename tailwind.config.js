// tailwind.config.js

const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind'in hangi dosyaları tarayacağını belirtin
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  
  theme: {
    extend: {
      // === RENK PALETİNİ BURAYA EKLİYORUZ ===
      colors: {
        // 1. Ana Vurgu (Sarı)
        primary: {
          light: '#FFFBEB', // amber-50
          DEFAULT: '#FBBF24', // amber-400
          hover: '#F59E0B', // amber-500
        },
        
        // 2. Arka Planlar (Siyah/Koyu Tema)
        background: '#18181B', // zinc-900 (Kömür)
        surface: '#27272A',    // zinc-800 (Koyu Gri - Kartlar/Paneller)
        'surface-hover': '#52525B', // zinc-600
        border: '#3F3F46',      // zinc-700 (Kenarlık/Ayıraç)
        
        // 3. Metin Renkleri (GÖRÜNMEYEN YAZILAR İÇİN)
        text: {
          primary: '#F4F4F5',      // zinc-100 (Neredeyse Beyaz)
          secondary: '#A1A1AA',   // zinc-400 (Soluk Gri)
          muted: '#71717A',        // zinc-500
        },
        
        // 4. Diğer Durum Renkleri (Renksiz Butonlar için)
        danger: {
          DEFAULT: '#DC2626', // red-600
          light: '#FEE2E2', // red-50
        },
        success: {
          DEFAULT: '#16A34A', // green-600
          light: '#F0FDF4', // green-50
        },
      },
      // === BİTİŞ ===
      
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
    },
  },
  plugins: [],
};
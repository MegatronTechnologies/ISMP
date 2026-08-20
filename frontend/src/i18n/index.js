import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  az: {
    translation: {
      "ISMP": "ISMP",
      "Home": "Ana Səhifə",
      "About Project": "Layihə Haqqında",
      "About Us": "Haqqımızda",
      "Contact": "Əlaqə",
      "Login": "Daxil ol",
      "Get Started": "Başla",
      "Dashboard": "İdarə Paneli",
      "Live Monitoring": "Canlı İzləmə",
      "Incidents": "İnsidentlər",
      "Notifications": "Bildirişlər",
      "Profile": "Profil",
      "Transform Passive CCTV Into Real-Time AI Intelligence": "Passiv CCTV-ni Real Zamanlı Süni İntellektə Çevirin",
      "Detect threats in milliseconds, automate recording, and trigger instant emergency response.": "Təhlükələri millisaniyələr ərzində aşkar edin, qeydiyyatı avtomatlaşdırın və anında fövqəladə cavab tədbirləri görün.",
      "Explore Platform": "Platformanı Kəşf Et",
      "How It Works": "Necə İşləyir"
    }
  },
  en: {
    translation: {
      "ISMP": "ISMP",
      "Home": "Home",
      "About Project": "About Project",
      "About Us": "About Us",
      "Contact": "Contact",
      "Login": "Login",
      "Get Started": "Get Started",
      "Dashboard": "Dashboard",
      "Live Monitoring": "Live Monitoring",
      "Incidents": "Incidents",
      "Notifications": "Notifications",
      "Profile": "Profile",
      "Transform Passive CCTV Into Real-Time AI Intelligence": "Transform Passive CCTV Into Real-Time AI Intelligence",
      "Detect threats in milliseconds, automate recording, and trigger instant emergency response.": "Detect threats in milliseconds, automate recording, and trigger instant emergency response.",
      "Explore Platform": "Explore Platform",
      "How It Works": "How It Works"
    }
  },
  ru: {
    translation: {
      "ISMP": "ISMP",
      "Home": "Главная",
      "About Project": "О проекте",
      "About Us": "О нас",
      "Contact": "Контакты",
      "Login": "Войти",
      "Get Started": "Начать",
      "Dashboard": "Панель управления",
      "Live Monitoring": "Живой мониторинг",
      "Incidents": "Инциденты",
      "Notifications": "Уведомления",
      "Profile": "Профиль",
      "Transform Passive CCTV Into Real-Time AI Intelligence": "Превратите пассивное видеонаблюдение в интеллектуальную систему реального времени",
      "Detect threats in milliseconds, automate recording, and trigger instant emergency response.": "Обнаруживайте угрозы за миллисекунды, автоматизируйте запись и запускайте мгновенное реагирование.",
      "Explore Platform": "Изучить платформу",
      "How It Works": "Как это работает"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'az',
    fallbackLng: 'az',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

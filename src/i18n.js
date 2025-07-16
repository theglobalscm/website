import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言资源文件
import translationEN from './locales/en/translation.json';
import translationZH from './locales/zh/translation.json'; // 确保您有这个文件

// 资源对象
const resources = {
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationZH,
  },
};

i18n
  .use(initReactI18next) // 将 i18n 实例传递给 react-i18next
  .init({
    resources,
    lng: 'zh', // 默认语言设置为中文
    fallbackLng: 'en', // 如果当前语言没有某个键，则回退到英文

    interpolation: {
      escapeValue: false, // react 已经做了 XSS 防护，不需要再转义
    },
    // debug: true // 开发时可以开启，查看调试信息
  });

export default i18n;
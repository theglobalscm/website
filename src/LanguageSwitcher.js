import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px', // 从 left: '10px' 改为 right: '10px'
        zIndex: 100,
      }}
    >
      <label htmlFor="language-select" className="sr-only">{t('language_switcher_title')}</label>
      <select
        id="language-select"
        onChange={changeLanguage}
        value={i18n.language}
        style={{
          padding: '8px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          outline: 'none', // 移除聚焦时的默认边框
        }}
      >
        <option value="zh">{t('language_chinese')}</option>
        <option value="en">{t('language_english')}</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
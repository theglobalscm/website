import React from 'react';
import { useTranslation } from 'react-i18next';

function HomePage({ homepageSettings, loadingHomepageSettings, errorHomepageSettings }) {
  const { t } = useTranslation();

  if (loadingHomepageSettings) {
    return <div className="text-center py-20 text-xl text-gray-600">{t('loading_content')}</div>;
  }

  if (errorHomepageSettings) {
    return <div className="text-center py-20 text-xl text-red-600">{t('error_loading_homepage_settings')}: {errorHomepageSettings}</div>;
  }

  if (!homepageSettings) {
    return <div className="text-center py-20 text-xl text-gray-600">No homepage settings available.</div>;
  }

  return (
    <section className="relative bg-cover bg-center h-screen flex items-center justify-center"
             style={{ backgroundImage: `url(${homepageSettings.heroBackgroundImageUrl || 'https://placehold.co/1920x1080/add8e6/000000?text=Hero+Background'})` }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative text-white text-center p-8 z-10">
        {homepageSettings.logoUrl && (
          <img src={homepageSettings.logoUrl} alt="Company Logo" className="mx-auto mb-4 h-24 w-auto" />
        )}
        {/* 确保这里没有 heroTitle 的 h1 标签，以移除 SCM 色块 */}
        {/* 更改了这里的字体大小类：从 text-2xl md:text-4xl 进一步放大到 text-4xl md:text-6xl */}
        <p className="text-4xl md:text-6xl mb-8 max-w-2xl mx-auto">{homepageSettings.heroDescription}</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105">
          {homepageSettings.heroButtonText || t('button_learn_more')}
        </button>
      </div>
    </section>
  );
}

export default HomePage;
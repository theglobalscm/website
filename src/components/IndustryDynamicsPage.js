import React from 'react';
import { useTranslation } from 'react-i18next';

function IndustryDynamicsPage({ industryDynamicsContent }) {
  const { t } = useTranslation();

  if (!industryDynamicsContent) {
    return <div className="text-center py-20 text-xl text-gray-600">{t('loading_content')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('industry_dynamics')}</h1>

      <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-blue-800 mb-4">{industryDynamicsContent.chinaAluminum.title || t('admin_industry_dynamics_china_aluminum_title')}</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          {industryDynamicsContent.chinaAluminum.points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-blue-800 mb-4">{industryDynamicsContent.internationalAluminum.title || t('admin_industry_dynamics_international_aluminum_title')}</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          {industryDynamicsContent.internationalAluminum.points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default IndustryDynamicsPage;
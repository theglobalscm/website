import React from 'react';
import { useTranslation } from 'react-i18next';

function AboutUsPage({ aboutUsContent }) {
  const { t } = useTranslation();

  if (!aboutUsContent) {
    return <div className="text-center py-20 text-xl text-gray-600">{t('loading_content')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('about_us')}</h1>
      <div className="flex flex-wrap items-center mb-12">
        <div className="w-full md:w-1/2 p-4">
          <img src={aboutUsContent.aboutImageUrl || 'https://placehold.co/600x400/add8e6/000000?text=About+Us+Image'} alt={t('about_us')} className="rounded-lg shadow-lg" />
        </div>
        <div className="w-full md:w-1/2 p-4">
          <p className="text-lg text-gray-700 mb-4">{aboutUsContent.aboutText1}</p>
          <p className="text-lg text-gray-700">{aboutUsContent.aboutText2}</p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-center mb-8">{t('admin_about_us_team_members_title')}</h2>
      <p className="text-lg text-gray-700 text-center mb-8">{aboutUsContent.teamIntro}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {aboutUsContent.teamMembers && aboutUsContent.teamMembers.map((member, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
            <img src={member.imageUrl || 'https://placehold.co/150x150/a7d9ff/007bff?text=Member'} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
            <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
            <p className="text-blue-600 mb-2">{member.title}</p>
            <p className="text-gray-600 text-sm">{member.bio}</p>
          </div>
        ))}
      </div>

      <h2 className="text-3xl font-bold text-center mb-8">{t('admin_about_us_core_advantages_title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {aboutUsContent.coreAdvantages && aboutUsContent.coreAdvantages.map((advantage, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{advantage.title}</h3>
            <ul className="list-disc list-inside text-gray-600">
              {advantage.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AboutUsPage;
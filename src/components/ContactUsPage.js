import React from 'react';
import { useTranslation } from 'react-i18next';

function ContactUsPage({ contactInfo }) {
  const { t } = useTranslation();

  if (!contactInfo) {
    return <div className="text-center py-20 text-xl text-gray-600">{t('loading_content')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('contact_us')}</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-4">
          <p className="text-lg text-gray-700 mb-2"><strong>{t('contact_phone_label')}:</strong> {contactInfo.phone}</p>
        </div>
        <div className="mb-4">
          <p className="text-lg text-gray-700 mb-2"><strong>{t('contact_email_label')}:</strong> {contactInfo.email}</p>
        </div>
        <div className="mb-4">
          <p className="text-lg text-gray-700 mb-2"><strong>{t('contact_address_label')}:</strong> {contactInfo.address}</p>
        </div>
      </div>
    </div>
  );
}

export default ContactUsPage;
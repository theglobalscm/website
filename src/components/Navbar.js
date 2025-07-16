import React from 'react';
import { useTranslation } from 'react-i18next';

// 接收 isAuthenticated 和 userRole 作为 props
function Navbar({ setCurrentPage, logoUrl, isAuthenticated, userRole }) {
  const { t } = useTranslation();

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Company Logo"
              className="h-10 w-10 rounded-full mr-4 object-cover"
              style={{ maxHeight: '40px', maxWidth: '40px' }}
            />
          )}
          <a href="#" className="text-xl font-bold text-gray-800" onClick={() => setCurrentPage('home')}>
            {t('company_name')}
          </a>
        </div>
        <ul className="flex space-x-6">
          <li><button className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setCurrentPage('home')}>{t('welcome_message')}</button></li>
          <li><button className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setCurrentPage('about')}>{t('about_us')}</button></li>
          <li><button className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setCurrentPage('business')}>{t('business_outlook')}</button></li>
          <li><button className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setCurrentPage('industry')}>{t('industry_dynamics')}</button></li>
          <li><button className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setCurrentPage('contact')}>{t('contact_us')}</button></li>
          {/* 只有当用户是管理员且已认证时才显示管理后台链接 */}
          {isAuthenticated && userRole === 'admin' && (
            <li><button className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setCurrentPage('admin')}>{t('admin_backend')}</button></li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;

import React from 'react';
import { useTranslation } from 'react-i18next';

function AuthStatus({ user, onLogout }) {
    const { t } = useTranslation();

    if (!user) {
        return null; // 用户未登录时不显示
    }

    return (
        <div style={{ position: 'absolute', top: '10px', right: '150px', zIndex: 100 }} className="flex items-center space-x-2 text-white bg-gray-700 px-3 py-1 rounded-md shadow-md">
            <span className="text-sm">
                {t('logged_in_as')}: {user.email || t('anonymous_user')}
            </span>
            <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md transition duration-300"
            >
                {t('logout_button')}
            </button>
        </div>
    );
}

export default AuthStatus;

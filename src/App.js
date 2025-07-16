import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
// 导入认证相关函数：signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// 导入 getDoc 用于获取用户角色
import { getFirestore, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import AboutUsPage from './components/AboutUsPage';
import BusinessOutlookPage from './components/BusinessOutlookPage';
import IndustryDynamicsPage from './components/IndustryDynamicsPage';
import ContactUsPage from './components/ContactUsPage';
import LoginPage from './components/LoginPage'; // 导入新的登录页组件
import AuthStatus from './components/AuthStatus'; // 导入新的认证状态组件


// 确保全局变量为本地开发定义，如果环境未提供
// 这些通常由 Canvas 环境注入。
if (typeof window.__app_id === 'undefined') {
    window.__app_id = 'default-app-id-for-local'; // 本地开发的占位符
}
if (typeof window.__firebase_config === 'undefined') {
    // 重要：请用您实际的 Firebase 项目配置替换这些占位符值！
    // 您可以在 Firebase 项目设置 -> 您的应用 -> Web 应用 -> 配置中找到这些信息
    window.__firebase_config = JSON.stringify({
        apiKey: "AIzaSyAfY0BYuEjHDJlOLdeWXeO1q6PAYX4_y-U",
        authDomain: "theglobalscm-site.firebaseapp.com",
        projectId: "theglobalscm-site",
        storageBucket: "theglobalscm-site.firebasestorage.app",
        messagingSenderId: "75221196600",
        appId: "1:75221196600:web:1436916c08655d2dc2ebcd",
        measurementId: "G-GJXQGJZZN3"
    });
}
if (typeof window.__initial_auth_token === 'undefined') {
    window.__initial_auth_token = null; // 本地匿名登录没有认证令牌
}

// Canvas 环境提供的 Firebase 全局变量
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

// 定义一个带有占位符值的默认 firebaseConfig
// 重要：请用您实际的 Firebase 项目配置替换这些占位符值！
const defaultFirebaseConfig = {
    apiKey: "AIzaSyAfY0BYuEjHDJlOLdeWXeO1q6PAYX4_y-U", // <-- 使用您实际的 API Key 更新
    authDomain: "theglobalscm-site.firebaseapp.com", // <-- 使用您实际的 Auth Domain 更新
    projectId: "theglobalscm-site", // <-- 使用您实际的 Project ID 更新
    storageBucket: "theglobalscm-site.firebasestorage.app", // <-- 使用您实际的 Storage Bucket 更新
    messagingSenderId: "75221196600", // <-- 使用您实际的 Sender ID 更新
    appId: "1:75221196600:web:1436916c08655d2dc2ebcd", // <-- 使用您实际的 App ID 更新
    measurementId: "G-GJXQGJZZN3" // <-- 使用您实际的 Measurement ID 更新 (可选)
};

// 安全解析 firebaseConfig，如果 __firebase_config 未定义或无效则回退到默认值
let firebaseConfig;
try {
    // 直接使用 window.__firebase_config
    firebaseConfig = typeof window.__firebase_config !== 'undefined' && window.__firebase_config ? JSON.parse(window.__firebase_config) : defaultFirebaseConfig;
    // 合并默认值以确保所有键都存在，如果 __firebase_config 是部分配置
    firebaseConfig = { ...defaultFirebaseConfig, ...firebaseConfig };
} catch (e) {
    console.error("解析 window.__firebase_config 时出错，回退到默认值:", e);
    firebaseConfig = defaultFirebaseConfig;
}

const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

// 初始化 Firebase (在 App 组件中只执行一次)
let app;
let db;
let auth;

// AdminPage 组件 (在 App 外部定义以避免每次渲染时重新创建)
const AdminPage = ({ userId, homepageSettings, setHomepageSettings, aboutUsContent, setAboutUsContent, businessOutlookContent, setBusinessOutlookContent, industryDynamicsContent, setIndustryDynamicsContent, contactInfo, setContactInfo }) => {
    const { t } = useTranslation(); // 使用 t 函数获取翻译文本
    const [currentAdminTab, setCurrentAdminTab] = useState('homepage'); // 管理员标签页的状态

    // 用于编辑内容的本地状态 (用 props 初始化)
    const [currentHomepageSettings, setCurrentHomepageSettings] = useState(homepageSettings);
    const [currentAboutUsContent, setCurrentAboutUsContent] = useState(aboutUsContent);
    const [currentBusinessOutlookContent, setCurrentBusinessOutlookContent] = useState(businessOutlookContent);
    const [currentIndustryDynamicsContent, setCurrentIndustryDynamicsContent] = useState(industryDynamicsContent);
    const [currentContactInfo, setCurrentContactInfo] = useState(contactInfo); // 联系信息的新状态

    const [updateStatus, setUpdateStatus] = useState('');

    // 当 props 改变时更新本地状态 (例如，初始获取后或外部更新)
    useEffect(() => {
        setCurrentHomepageSettings(homepageSettings);
    }, [homepageSettings]);

    useEffect(() => {
        setCurrentAboutUsContent(aboutUsContent);
    }, [aboutUsContent]);

    useEffect(() => {
        setCurrentBusinessOutlookContent(businessOutlookContent);
    }, [businessOutlookContent]);

    useEffect(() => {
        setCurrentIndustryDynamicsContent(industryDynamicsContent);
    }, [industryDynamicsContent]);

    useEffect(() => {
        setCurrentContactInfo(contactInfo); // 当 contactInfo prop 改变时更新本地状态
    }, [contactInfo]);

    // 更新内容的处理器
    const handleHomepageSettingChange = (e) => {
        const { name, value } = e.target;
        setCurrentHomepageSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateHomepageSettings = async () => {
        setUpdateStatus(t('admin_update_status_updating'));
        try {
            const homepageSettingsDocRef = doc(db, `artifacts/${appId}/public/data/homepage_settings`, 'main_settings');
            await setDoc(homepageSettingsDocRef, currentHomepageSettings, { merge: true });
            setUpdateStatus(t('admin_homepage_settings_success'));
        } catch (error) {
            console.error("更新主页设置时出错:", error);
            setUpdateStatus(`${t('admin_update_status_failed')}: ${error.message}`);
        }
    };

    const handleAboutUsContentChange = (e) => {
        const { name, value } = e.target;
        setCurrentAboutUsContent(prev => ({ ...prev, [name]: value }));
    };

    const handleTeamMemberChange = (index, field, value) => {
        const updatedMembers = [...currentAboutUsContent.teamMembers];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setCurrentAboutUsContent(prev => ({ ...prev, teamMembers: updatedMembers }));
    };

    const handleAddTeamMember = () => {
        setCurrentAboutUsContent(prev => ({
            ...prev,
            teamMembers: [...prev.teamMembers, { name: '', title: '', bio: '', imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=New+Member' }]
        }));
    };

    const handleRemoveTeamMember = (index) => {
        const updatedMembers = currentAboutUsContent.teamMembers.filter((_, i) => i !== index);
        setCurrentAboutUsContent(prev => ({ ...prev, teamMembers: updatedMembers }));
    };

    const handleCoreAdvantageChange = (index, field, value) => {
        const updatedAdvantages = [...currentAboutUsContent.coreAdvantages];
        updatedAdvantages[index] = { ...updatedAdvantages[index], [field]: value };
        setCurrentAboutUsContent(prev => ({ ...prev, coreAdvantages: updatedAdvantages }));
    };

    const handleAddCoreAdvantage = () => {
        setCurrentAboutUsContent(prev => ({
            ...prev,
            coreAdvantages: [...prev.coreAdvantages, { title: '', points: [''] }]
        }));
    };

    const handleRemoveCoreAdvantage = (index) => {
        const updatedAdvantages = currentAboutUsContent.coreAdvantages.filter((_, i) => i !== index);
        setCurrentAboutUsContent(prev => ({ ...prev, coreAdvantages: updatedAdvantages }));
    };

    const handleCoreAdvantagePointChange = (advIndex, pointIndex, value) => {
        const updatedAdvantages = [...currentAboutUsContent.coreAdvantages];
        updatedAdvantages[advIndex].points[pointIndex] = value;
        setCurrentAboutUsContent(prev => ({ ...prev, coreAdvantages: updatedAdvantages }));
    };

    const handleAddCoreAdvantagePoint = (advIndex) => {
        const updatedAdvantages = [...currentAboutUsContent.coreAdvantages];
        updatedAdvantages[advIndex].points.push('');
        setCurrentAboutUsContent(prev => ({ ...prev, coreAdvantages: updatedAdvantages }));
    };

    const handleRemoveCoreAdvantagePoint = (advIndex, pointIndex) => {
        const updatedAdvantages = [...currentAboutUsContent.coreAdvantages];
        updatedAdvantages[advIndex].points.splice(pointIndex, 1);
        setCurrentAboutUsContent(prev => ({
            ...prev,
            coreAdvantages: updatedAdvantages
        }));
    };

    const handleUpdateAboutUsContent = async () => {
        setUpdateStatus(t('admin_update_status_updating'));
        try {
            const aboutUsDocRef = doc(db, `artifacts/${appId}/public/data/about_us_content`, 'main_content');
            await setDoc(aboutUsDocRef, currentAboutUsContent, { merge: true });
            setUpdateStatus(t('admin_about_us_success'));
        } catch (error) {
            console.error("更新关于我们内容时出错:", error);
            setUpdateStatus(`${t('admin_update_status_failed')}: ${error.message}`);
        }
    };

    const handleBusinessOutlookContentChange = (e) => {
        const { name, value } = e.target;
        setCurrentBusinessOutlookContent(prev => ({ ...prev, [name]: value }));
    };

    const handleBusinessScopeItemChange = (index, field, value) => {
        const updatedItems = [...currentBusinessOutlookContent.businessScopeItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setCurrentBusinessOutlookContent(prev => ({ ...prev, businessScopeItems: updatedItems }));
    };

    const handleBusinessScopePointChange = (itemIndex, pointIndex, value) => {
        const updatedItems = [...currentBusinessOutlookContent.businessScopeItems];
        if (updatedItems[itemIndex].points) {
            updatedItems[itemIndex].points[pointIndex] = value;
        }
        setCurrentBusinessOutlookContent(prev => ({ ...prev, businessScopeItems: updatedItems }));
    };

    const handleBusinessExpansionItemChange = (index, field, value) => {
        const updatedItems = [...currentBusinessOutlookContent.businessExpansionItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setCurrentBusinessOutlookContent(prev => ({ ...prev, businessExpansionItems: updatedItems }));
    };

    const handleBusinessExpansionPointChange = (itemIndex, pointIndex, value) => {
        const updatedItems = [...currentBusinessOutlookContent.businessExpansionItems];
        if (updatedItems[itemIndex].points) {
            updatedItems[itemIndex].points[pointIndex] = value;
        }
        setCurrentBusinessOutlookContent(prev => ({ ...prev, businessExpansionItems: updatedItems }));
    };

    const handleFinancialRevenueChange = (index, field, value) => {
        const updatedTable = [...currentBusinessOutlookContent.financialForecast.revenueTable];
        updatedTable[index] = { ...updatedTable[index], [field]: parseFloat(value) || 0 };
        setCurrentBusinessOutlookContent(prev => ({
            ...prev,
            financialForecast: { ...prev.financialForecast, revenueTable: updatedTable }
        }));
    };

    const handleFinancialCostAssumptionChange = (index, field, value) => {
        const updatedAssumptions = [...currentBusinessOutlookContent.financialForecast.costAssumptions];
        updatedAssumptions[index] = { ...updatedAssumptions[index], [field]: value };
        setCurrentBusinessOutlookContent(prev => ({
            ...prev,
            financialForecast: { ...prev.financialForecast, costAssumptions: updatedAssumptions }
        }));
    };

    const handleFinancialCostDetailChange = (assumpIndex, detailIndex, value) => {
        const updatedAssumptions = [...currentBusinessOutlookContent.financialForecast.costAssumptions];
        if (updatedAssumptions[assumpIndex].details) {
            updatedAssumptions[assumpIndex].details[detailIndex] = value;
        }
        setCurrentBusinessOutlookContent(prev => ({
            ...prev,
            financialForecast: { ...prev.financialForecast, costAssumptions: updatedAssumptions }
        }));
    };

    const handleFinancialInvestmentOpportunityChange = (e) => {
        const { value } = e.target;
        setCurrentBusinessOutlookContent(prev => ({
            ...prev,
            financialForecast: { ...prev.financialForecast, investmentOpportunity: value }
        }));
    };

    const handleUpdateBusinessOutlookContent = async () => {
        setUpdateStatus(t('admin_update_status_updating'));
        try {
            const businessOutlookDocRef = doc(db, `artifacts/${appId}/public/data/business_outlook_content`, 'main_content');
            await setDoc(businessOutlookDocRef, currentBusinessOutlookContent, { merge: true });
            setUpdateStatus(t('admin_business_outlook_success'));
        } catch (error) {
            console.error("更新业务与展望内容时出错:", error);
            setUpdateStatus(`${t('admin_update_status_failed')}: ${error.message}`);
        }
    };

    const handleIndustryDynamicsContentChange = (section, field, value) => {
        setCurrentIndustryDynamicsContent(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleIndustryDynamicsPointChange = (section, pointIndex, value) => {
        const updatedPoints = [...currentIndustryDynamicsContent[section].points];
        updatedPoints[pointIndex] = value;
        setCurrentIndustryDynamicsContent(prev => ({
            ...prev,
            [section]: { ...prev[section], points: updatedPoints }
        }));
    };

    const handleAddIndustryDynamicsPoint = (section) => {
        const updatedPoints = [...currentIndustryDynamicsContent[section].points];
        updatedPoints.push('');
        setCurrentIndustryDynamicsContent(prev => ({
            ...prev,
            [section]: { ...prev[section], points: updatedPoints }
        }));
    };

    const handleRemoveIndustryDynamicsPoint = (section, pointIndex) => {
        const updatedPoints = [...currentIndustryDynamicsContent[section].points];
        updatedPoints.splice(pointIndex, 1);
        setCurrentIndustryDynamicsContent(prev => ({
            ...prev,
            [section]: { ...prev[section], points: updatedPoints }
        }));
    };

    const handleUpdateIndustryDynamicsContent = async () => {
        setUpdateStatus(t('admin_update_status_updating'));
        try {
            const industryDynamicsDocRef = doc(db, `artifacts/${appId}/public/data/industry_dynamics_content`, 'main_content');
            await setDoc(industryDynamicsDocRef, currentIndustryDynamicsContent, { merge: true });
            setUpdateStatus(t('admin_industry_dynamics_success'));
        } catch (error) {
            console.error("更新行业动态内容时出错:", error);
            setUpdateStatus(`${t('admin_update_status_failed')}: ${error.message}`);
        }
    };

    // 联系信息的新处理器
    const handleContactInfoChange = (e) => {
        const { name, value } = e.target;
        setCurrentContactInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateContactInfo = async () => {
        setUpdateStatus(t('admin_update_status_updating'));
        try {
            const contactInfoDocRef = doc(db, `artifacts/${appId}/public/data/contact_info`, 'main_contact');
            await setDoc(contactInfoDocRef, currentContactInfo, { merge: true });
            setUpdateStatus(t('admin_contact_info_success'));
        } catch (error) {
            console.error("更新联系信息时出错:", error);
            setUpdateStatus(`${t('admin_update_status_failed')}: ${error.message}`);
        }
    };

    // 管理员 UI 渲染
    return (
        <section id="admin" className="py-16 md:py-24 bg-gray-100 rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">{t('admin_dashboard_title')}</h2>
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <p className="text-lg text-gray-700 mb-4">
                        {t('admin_current_user_id')}: <span className="font-mono bg-gray-200 p-1 rounded">{userId}</span>
                    </p>

                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'homepage' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('homepage')}
                        >
                            {t('admin_tab_homepage_settings')}
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'aboutUs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('aboutUs')}
                        >
                            {t('admin_tab_about_us')}
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'businessOutlook' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('businessOutlook')}
                        >
                            {t('admin_tab_business_outlook')}
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'industryDynamics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('industryDynamics')}
                        >
                            {t('admin_tab_industry_dynamics')}
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'contact' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('contact')}
                        >
                            {t('admin_tab_contact_info')}
                        </button>
                    </div>

                    {updateStatus && (
                        <div className={`p-3 mb-4 rounded-md ${updateStatus.includes(t('admin_update_status_success_indicator')) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {updateStatus}
                        </div>
                    )}

                    {/* 主页设置标签页 */}
                    {currentAdminTab === 'homepage' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t('admin_homepage_content_edit_title')}</h3>
                            <div>
                                <label htmlFor="heroTitle" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_homepage_hero_title_label')}:</label>
                                <input
                                    type="text"
                                    id="heroTitle"
                                    name="heroTitle"
                                    value={currentHomepageSettings.heroTitle}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label htmlFor="heroDescription" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_homepage_description_label')}:</label>
                                <textarea
                                    id="heroDescription"
                                    name="heroDescription"
                                    value={currentHomepageSettings.heroDescription}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <div>
                                <label htmlFor="heroButtonText" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_homepage_button_text_label')}:</label>
                                <input
                                    type="text"
                                    id="heroButtonText"
                                    name="heroButtonText"
                                    value={currentHomepageSettings.heroButtonText}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label htmlFor="heroBackgroundImageUrl" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_homepage_bg_image_url_label')}:</label>
                                <input
                                    type="text"
                                    id="heroBackgroundImageUrl"
                                    name="heroBackgroundImageUrl"
                                    value={currentHomepageSettings.heroBackgroundImageUrl}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {currentHomepageSettings.heroBackgroundImageUrl && (
                                    <img src={currentHomepageSettings.heroBackgroundImageUrl} alt={t('admin_homepage_bg_preview_alt')} className="mt-2 w-32 h-auto rounded-md" onError={(e) => e.target.src = 'https://placehold.co/100x60/cccccc/333333?text=Image+Error'}/>
                                )}
                            </div>
                            <div>
                                <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_homepage_logo_url_label')}:</label>
                                <input
                                    type="text"
                                    id="logoUrl"
                                    name="logoUrl"
                                    value={currentHomepageSettings.logoUrl}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {currentHomepageSettings.logoUrl && (
                                    <img src={currentHomepageSettings.logoUrl} alt={t('admin_homepage_logo_preview_alt')} className="mt-2 w-16 h-16 rounded-full" onError={(e) => e.target.src = 'https://placehold.co/40x40/cccccc/333333?text=Logo+Error'}/>
                                )}
                            </div>
                            <button
                                onClick={handleUpdateHomepageSettings}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                {t('admin_save_homepage_settings_button')}
                            </button>
                        </div>
                    )}

                    {/* 关于我们标签页 */}
                    {currentAdminTab === 'aboutUs' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t('admin_about_us_content_edit_title')}</h3>
                            <div>
                                <label htmlFor="aboutText1" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_about_us_text1_label')}:</label>
                                <textarea
                                    id="aboutText1"
                                    name="aboutText1"
                                    value={currentAboutUsContent.aboutText1}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <div>
                                <label htmlFor="aboutText2" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_about_us_text2_label')}:</label>
                                <textarea
                                    id="aboutText2"
                                    name="aboutText2"
                                    value={currentAboutUsContent.aboutText2}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <div>
                                <label htmlFor="aboutImageUrl" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_about_us_image_url_label')}:</label>
                                <input
                                    type="text"
                                    id="aboutImageUrl"
                                    name="aboutImageUrl"
                                    value={currentAboutUsContent.aboutImageUrl}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {currentAboutUsContent.aboutImageUrl && (
                                    <img src={currentAboutUsContent.aboutImageUrl} alt={t('admin_about_us_preview_alt')} className="mt-2 w-32 h-auto rounded-md" onError={(e) => e.target.src = 'https://placehold.co/100x60/cccccc/333333?text=Image+Error'}/>
                                )}
                            </div>
                            <div>
                                <label htmlFor="teamIntro" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_about_us_team_intro_label')}:</label>
                                <textarea
                                    id="teamIntro"
                                    name="teamIntro"
                                    value={currentAboutUsContent.teamIntro}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">{t('admin_about_us_team_members_title')}</h4>
                            {currentAboutUsContent.teamMembers.map((member, index) => (
                                <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">{t('admin_about_us_member')} {index + 1}</h5>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder={t('admin_about_us_member_name_placeholder')}
                                            value={member.name}
                                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        <input
                                            type="text"
                                            placeholder={t('admin_about_us_member_title_placeholder')}
                                            value={member.title}
                                            onChange={(e) => handleTeamMemberChange(index, 'title', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        <textarea
                                            placeholder={t('admin_about_us_member_bio_placeholder')}
                                            value={member.bio}
                                            onChange={(e) => handleTeamMemberChange(index, 'bio', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-20"
                                        />
                                        <input
                                            type="text"
                                            placeholder={t('admin_about_us_member_image_url_placeholder')}
                                            value={member.imageUrl}
                                            onChange={(e) => handleTeamMemberChange(index, 'imageUrl', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        {member.imageUrl && (
                                            <img src={member.imageUrl} alt={t('admin_about_us_member_preview_alt')} className="mt-2 w-20 h-20 rounded-full" onError={(e) => e.target.src = 'https://placehold.co/50x50/cccccc/333333?text=Image+Error'}/>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveTeamMember(index)}
                                        className="mt-4 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition duration-300"
                                    >
                                        {t('admin_about_us_remove_member_button')}
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddTeamMember}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                {t('admin_about_us_add_member_button')}
                            </button>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">{t('admin_about_us_core_advantages_title')}</h4>
                            {currentAboutUsContent.coreAdvantages.map((advantage, advIndex) => (
                                <div key={advIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">{t('admin_about_us_advantage')} {advIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder={t('admin_about_us_advantage_title_placeholder')}
                                        value={advantage.title}
                                        onChange={(e) => handleCoreAdvantageChange(advIndex, 'title', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    <h6 className="font-medium mt-3 mb-1">{t('admin_about_us_points_label')}:</h6>
                                    {advantage.points.map((point, pointIndex) => (
                                        <div key={pointIndex} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder={t('admin_about_us_point_description_placeholder')}
                                                value={point}
                                                onChange={(e) => handleCoreAdvantagePointChange(advIndex, pointIndex, e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                            />
                                            <button
                                                onClick={() => handleRemoveCoreAdvantagePoint(advIndex, pointIndex)}
                                                className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                            >
                                                {t('admin_remove_button')}
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleAddCoreAdvantagePoint(advIndex)}
                                        className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                    >
                                        {t('admin_add_point_button')}
                                    </button>
                                    <button
                                        onClick={() => handleRemoveCoreAdvantage(advIndex)}
                                        className="mt-4 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition duration-300 ml-2"
                                    >
                                        {t('admin_about_us_remove_advantage_button')}
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddCoreAdvantage}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                {t('admin_about_us_add_advantage_button')}
                            </button>

                            <button
                                onClick={handleUpdateAboutUsContent}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 mt-6"
                            >
                                {t('admin_save_about_us_button')}
                            </button>
                        </div>
                    )}

                    {/* 业务与展望标签页 */}
                    {currentAdminTab === 'businessOutlook' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t('admin_business_outlook_content_edit_title')}</h3>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">{t('admin_business_outlook_scope_title')}</h4>
                            {currentBusinessOutlookContent.businessScopeItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">{t('admin_business_outlook_scope_item')} {itemIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder={t('admin_business_outlook_item_title_placeholder')}
                                        value={item.title}
                                        onChange={(e) => handleBusinessScopeItemChange(itemIndex, 'title', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    {item.points && (
                                        <>
                                            <h6 className="font-medium mt-3 mb-1">{t('admin_business_outlook_points_label')}:</h6>
                                            {item.points.map((point, pointIndex) => (
                                                <div key={pointIndex} className="flex items-center mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t('admin_business_outlook_point_description_placeholder')}
                                                        value={point}
                                                        onChange={(e) => handleBusinessScopePointChange(itemIndex, pointIndex, e.target.value)}
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...currentBusinessOutlookContent.businessScopeItems];
                                                            updatedItems[itemIndex].points.splice(pointIndex, 1);
                                                            setCurrentBusinessOutlookContent(prev => ({ ...prev, businessScopeItems: updatedItems }));
                                                        }}
                                                        className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                                    >
                                                        {t('admin_remove_button')}
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const updatedItems = [...currentBusinessOutlookContent.businessScopeItems];
                                                    updatedItems[itemIndex].points.push('');
                                                    setCurrentBusinessOutlookContent(prev => ({ ...prev, businessScopeItems: updatedItems }));
                                                }}
                                                className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                            >
                                                {t('admin_add_point_button')}
                                            </button>
                                        </>
                                    )}
                                    {item.text && (
                                        <div>
                                            <label htmlFor={`businessScopeText${itemIndex}`} className="block text-gray-700 text-sm font-bold mb-2">{t('admin_business_outlook_text_content_label')}:</label>
                                            <textarea
                                                id={`businessScopeText${itemIndex}`}
                                                value={item.text}
                                                onChange={(e) => handleBusinessScopeItemChange(itemIndex, 'text', e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-20"
                                            />
                                        </div>
                                    )}
                                    {item.imageUrl && (
                                        <div>
                                            <label htmlFor={`businessScopeImageUrl${itemIndex}`} className="block text-gray-700 text-sm font-bold mb-2">{t('admin_business_outlook_image_url_label')}:</label>
                                            <input
                                                type="text"
                                                id={`businessScopeImageUrl${itemIndex}`}
                                                value={item.imageUrl}
                                                onChange={(e) => handleBusinessScopeItemChange(itemIndex, 'imageUrl', e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                            <img src={item.imageUrl} alt={t('admin_business_outlook_preview_alt')} className="mt-2 w-32 h-auto rounded-md" onError={(e) => e.target.src = 'https://placehold.co/100x60/cccccc/333333?text=Image+Error'}/>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">{t('admin_business_outlook_expansion_title')}</h4>
                            {currentBusinessOutlookContent.businessExpansionItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">{t('admin_business_outlook_expansion_item')} {itemIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder={t('admin_business_outlook_item_title_placeholder')}
                                        value={item.title}
                                        onChange={(e) => handleBusinessExpansionItemChange(itemIndex, 'title', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    <h6 className="font-medium mt-3 mb-1">{t('admin_business_outlook_points_label')}:</h6>
                                    {item.points.map((point, pointIndex) => (
                                        <div key={pointIndex} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder={t('admin_business_outlook_point_description_placeholder')}
                                                value={point}
                                                onChange={(e) => handleBusinessExpansionPointChange(itemIndex, pointIndex, e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updatedItems = [...currentBusinessOutlookContent.businessExpansionItems];
                                                    updatedItems[itemIndex].points.splice(pointIndex, 1);
                                                    setCurrentBusinessOutlookContent(prev => ({ ...prev, businessExpansionItems: updatedItems }));
                                                }}
                                                className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                            >
                                                {t('admin_remove_button')}
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const updatedItems = [...currentBusinessOutlookContent.businessExpansionItems];
                                            updatedItems[itemIndex].points.push('');
                                            setCurrentBusinessOutlookContent(prev => ({ ...prev, businessExpansionItems: updatedItems }));
                                        }}
                                        className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                    >
                                        {t('admin_add_point_button')}
                                    </button>
                                </div>
                            ))}
                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">{t('admin_business_outlook_financial_revenue_title')}</h4>
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full bg-white rounded-lg shadow-md">
                                    <thead>
                                        <tr className="bg-blue-100 text-blue-800">
                                            <th className="py-2 px-3 text-left">{t('admin_business_outlook_year_column')}</th>
                                            <th className="py-2 px-3 text-left">{t('admin_business_outlook_revenue_column')}</th>
                                            <th className="py-2 px-3 text-left">{t('admin_business_outlook_sales_column')}</th>
                                            <th className="py-2 px-3 text-left">{t('admin_business_outlook_gross_profit_column')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentBusinessOutlookContent.financialForecast.revenueTable.map((row, index) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-2 px-3">{row.year}</td>
                                                <td className="py-2 px-3">
                                                    <input type="number" value={row.revenue} onChange={(e) => handleFinancialRevenueChange(index, 'revenue', e.target.value)} className="w-24 border rounded px-2 py-1 text-gray-700" />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input type="number" value={row.sales} onChange={(e) => handleFinancialRevenueChange(index, 'sales', e.target.value)} className="w-24 border rounded px-2 py-1 text-gray-700" />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input type="number" value={row.grossProfit} onChange={(e) => handleFinancialRevenueChange(index, 'grossProfit', e.target.value)} className="w-24 border rounded px-2 py-1 text-gray-700" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">{t('admin_business_outlook_financial_cost_title')}</h4>
                            {currentBusinessOutlookContent.financialForecast.costAssumptions.map((assumption, assumpIndex) => (
                                <div key={assumpIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">{t('admin_business_outlook_assumption_item')} {assumpIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder={t('admin_business_outlook_assumption_type_placeholder')}
                                        value={assumption.type}
                                        onChange={(e) => handleFinancialCostAssumptionChange(assumpIndex, 'type', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    <h6 className="font-medium mt-3 mb-1">{t('admin_business_outlook_details_label')}:</h6>
                                    {assumption.details.map((detail, detailIndex) => (
                                        <div key={detailIndex} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder={t('admin_business_outlook_detail_description_placeholder')}
                                                value={detail}
                                                onChange={(e) => handleFinancialCostDetailChange(assumpIndex, detailIndex, e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updatedAssumptions = [...currentBusinessOutlookContent.financialForecast.costAssumptions];
                                                    updatedAssumptions[assumpIndex].details.splice(detailIndex, 1);
                                                    setCurrentBusinessOutlookContent(prev => ({ ...prev, financialForecast: { ...prev.financialForecast, costAssumptions: updatedAssumptions } }));
                                                }}
                                                className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                            >
                                                {t('admin_remove_button')}
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const updatedAssumptions = [...currentBusinessOutlookContent.financialForecast.costAssumptions];
                                            updatedAssumptions[assumpIndex].details.push('');
                                            setCurrentBusinessOutlookContent(prev => ({ ...prev, financialForecast: { ...prev.financialForecast, costAssumptions: updatedAssumptions } }));
                                        }}
                                        className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                    >
                                        {t('admin_add_detail_button')}
                                    </button>
                                </div>
                            ))}
                            <div>
                                <label htmlFor="investmentOpportunity" className="block text-gray-700 text-sm font-bold mb-2">{t('admin_business_outlook_investment_opportunity_label')}:</label>
                                <textarea
                                    id="investmentOpportunity"
                                    value={currentBusinessOutlookContent.financialForecast.investmentOpportunity}
                                    onChange={handleFinancialInvestmentOpportunityChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                                />
                            </div>
                            <button
                                onClick={handleUpdateBusinessOutlookContent}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 mt-6"
                            >
                                {t('admin_save_business_outlook_button')}
                            </button>
                        </div>
                    )}

                    {/* Industry Dynamics Tab */}
                    {currentAdminTab === 'industryDynamics' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t('admin_industry_dynamics_edit_title')}</h3>
                            {/* China Aluminum Section */}
                            <div className="border p-4 rounded-md bg-gray-50">
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">{t('admin_industry_dynamics_china_aluminum_title')}</h4>
                                <input
                                    type="text"
                                    placeholder={t('admin_industry_dynamics_section_title_placeholder')}
                                    value={currentIndustryDynamicsContent.chinaAluminum.title}
                                    onChange={(e) => handleIndustryDynamicsContentChange('chinaAluminum', 'title', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                                <h5 className="font-medium mt-3 mb-1">{t('admin_industry_dynamics_points_label')}:</h5>
                                {currentIndustryDynamicsContent.chinaAluminum.points.map((point, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder={t('admin_industry_dynamics_point_description_placeholder')}
                                            value={point}
                                            onChange={(e) => handleIndustryDynamicsPointChange('chinaAluminum', index, e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        />
                                        <button
                                            onClick={() => handleRemoveIndustryDynamicsPoint('chinaAluminum', index)}
                                            className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                        >
                                            {t('admin_remove_button')}
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddIndustryDynamicsPoint('chinaAluminum')}
                                    className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                >
                                    {t('admin_add_point_button')}
                                </button>
                            </div>
                            {/* International Aluminum Section */}
                            <div className="border p-4 rounded-md bg-gray-50 mt-4">
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">{t('admin_industry_dynamics_international_aluminum_title')}</h4>
                                <input
                                    type="text"
                                    placeholder={t('admin_industry_dynamics_section_title_placeholder')}
                                    value={currentIndustryDynamicsContent.internationalAluminum.title}
                                    onChange={(e) => handleIndustryDynamicsContentChange('internationalAluminum', 'title', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                                <h5 className="font-medium mt-3 mb-1">{t('admin_industry_dynamics_points_label')}:</h5>
                                {currentIndustryDynamicsContent.internationalAluminum.points.map((point, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder={t('admin_industry_dynamics_point_description_placeholder')}
                                            value={point}
                                            onChange={(e) => handleIndustryDynamicsPointChange('internationalAluminum', index, e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        />
                                        <button
                                            onClick={() => handleRemoveIndustryDynamicsPoint('internationalAluminum', index)}
                                            className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                        >
                                            {t('admin_remove_button')}
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddIndustryDynamicsPoint('internationalAluminum')}
                                    className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                >
                                    {t('admin_add_point_button')}
                                </button>
                            </div>
                            <button
                                onClick={handleUpdateIndustryDynamicsContent}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 mt-6"
                            >
                                {t('admin_save_industry_dynamics_button')}
                            </button>
                        </div>
                    )}

                    {/* Contact Info Tab */}
                    {currentAdminTab === 'contact' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t('admin_contact_info_edit_title')}</h3>
                            <div>
                                <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">{t('contact_phone_label')}:</label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={currentContactInfo.phone}
                                    onChange={handleContactInfoChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">{t('contact_email_label')}:</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={currentContactInfo.email}
                                    onChange={handleContactInfoChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">{t('contact_address_label')}:</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={currentContactInfo.address}
                                    onChange={handleContactInfoChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <button
                                onClick={handleUpdateContactInfo}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                {t('admin_save_contact_info_button')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};


function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [user, setUser] = useState(null); // 存储 Firebase User 对象
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null); // 新增：用户角色
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null); // 新增：认证错误信息

    // States for content
    const [homepageSettings, setHomepageSettings] = useState(null);
    const [loadingHomepageSettings, setLoadingHomepageSettings] = useState(true);
    const [errorHomepageSettings, setErrorHomepageSettings] = useState(null);

    const [aboutUsContent, setAboutUsContent] = useState(null);
    const [loadingAboutUsContent, setLoadingAboutUsContent] = useState(true);

    const [businessOutlookContent, setBusinessOutlookContent] = useState(null);
    const [loadingBusinessOutlookContent, setLoadingBusinessOutlookContent] = useState(true);

    const [industryDynamicsContent, setIndustryDynamicsContent] = useState(null);
    const [loadingIndustryDynamicsContent, setLoadingIndustryDynamicsContent] = useState(true);

    const [contactInfo, setContactInfo] = useState(null);
    const [loadingContactInfo, setLoadingContactInfo] = useState(true);

    // Initialize i18n
    const { t } = useTranslation(); // Use t function to get translated text

    // Firebase 初始化和认证监听
    useEffect(() => {
        // Initialize Firebase app only once
        if (!app) {
            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);
                console.log("Firebase initialized successfully.");
            } catch (error) {
                console.error("Firebase initialization error:", error);
                setAuthError(t('firebase_init_error') + error.message);
                setLoadingAuth(false);
                return;
            }
        }

        // Handle authentication state changes
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser); // 设置 Firebase User 对象
            if (currentUser) {
                setUserId(currentUser.uid);
                // 获取用户角色
                try {
                    const roleDocRef = doc(db, `artifacts/${appId}/roles`, currentUser.uid);
                    const roleDocSnap = await getDoc(roleDocRef);
                    if (roleDocSnap.exists()) {
                        setUserRole(roleDocSnap.data().role);
                    } else {
                        setUserRole('user'); // 默认角色为普通用户
                        // 可以选择在这里为新用户在 Firestore 中创建默认角色文档
                        await setDoc(roleDocRef, { role: 'user' }, { merge: true });
                    }
                } catch (error) {
                    console.error("获取用户角色时出错:", error);
                    setAuthError(t('fetch_role_error') + error.message);
                    setUserRole(null);
                }
            } else {
                setUserId(null);
                setUserRole(null);
                // 如果没有用户登录，尝试匿名登录 (仅在没有自定义令牌时)
                if (!initialAuthToken) {
                    try {
                        await signInAnonymously(auth);
                    } catch (error) {
                        console.error("匿名登录失败:", error);
                        setAuthError(t('anonymous_login_error') + error.message);
                    }
                }
            }
            setLoadingAuth(false);
        });

        // Fetch homepage settings
        const fetchHomepageSettings = onSnapshot(doc(db, `artifacts/${appId}/public/data/homepage_settings`, 'main_settings'), (docSnap) => {
            if (docSnap.exists()) {
                setHomepageSettings(docSnap.data());
            } else {
                setErrorHomepageSettings(t('no_homepage_settings'));
            }
            setLoadingHomepageSettings(false);
        }, (error) => {
            console.error("获取主页设置时出错:", error);
            setErrorHomepageSettings(t('fetch_homepage_settings_error') + error.message);
            setLoadingHomepageSettings(false);
        });

        // Fetch About Us content
        const fetchAboutUsContent = onSnapshot(doc(db, `artifacts/${appId}/public/data/about_us_content`, 'main_content'), (docSnap) => {
            if (docSnap.exists()) {
                setAboutUsContent(docSnap.data());
            }
            setLoadingAboutUsContent(false);
        }, (error) => {
            console.error("获取关于我们内容时出错:", error);
            setLoadingAboutUsContent(false);
        });

        // Fetch Business Outlook content
        const fetchBusinessOutlookContent = onSnapshot(doc(db, `artifacts/${appId}/public/data/business_outlook_content`, 'main_content'), (docSnap) => {
            if (docSnap.exists()) {
                setBusinessOutlookContent(docSnap.data());
            }
            setLoadingBusinessOutlookContent(false);
        }, (error) => {
            console.error("获取业务与展望内容时出错:", error);
            setLoadingBusinessOutlookContent(false);
        });

        // Fetch Industry Dynamics content
        const fetchIndustryDynamicsContent = onSnapshot(doc(db, `artifacts/${appId}/public/data/industry_dynamics_content`, 'main_content'), (docSnap) => {
            if (docSnap.exists()) {
                setIndustryDynamicsContent(docSnap.data());
            }
            setLoadingIndustryDynamicsContent(false);
        }, (error) => {
            console.error("获取行业动态内容时出错:", error);
            setLoadingIndustryDynamicsContent(false);
        });

        // Fetch Contact Info
        const fetchContactInfo = onSnapshot(doc(db, `artifacts/${appId}/public/data/contact_info`, 'main_contact'), (docSnap) => {
            if (docSnap.exists()) {
                setContactInfo(docSnap.data());
            }
            setLoadingContactInfo(false);
        }, (error) => {
            console.error("获取联系信息时出错:", error);
            setLoadingContactInfo(false);
        });

        // Clean up subscriptions on unmount
        return () => {
            unsubscribeAuth();
            fetchHomepageSettings();
            fetchAboutUsContent();
            fetchBusinessOutlookContent();
            fetchIndustryDynamicsContent();
            fetchContactInfo();
        };
    }, []); // Empty dependency array means this effect runs once on mount

    // 处理登录
    const handleLogin = async (email, password) => {
        setAuthError(null); // 清除之前的错误
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setCurrentPage('admin'); // 登录成功后跳转到管理后台
        } catch (error) {
            console.error("登录失败:", error);
            setAuthError(t('login_failed') + error.message);
        }
    };

    // 处理注册
    const handleRegister = async (email, password) => {
        setAuthError(null); // 清除之前的错误
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // 为新注册用户在 Firestore 中设置默认角色
            const roleDocRef = doc(db, `artifacts/${appId}/roles`, userCredential.user.uid);
            await setDoc(roleDocRef, { role: 'user' }); // 默认角色为普通用户
            setUserRole('user');
            setCurrentPage('home'); // 注册成功后跳转到主页
        } catch (error) {
            console.error("注册失败:", error);
            setAuthError(t('register_failed') + error.message);
        }
    };

    // 处理登出
    const handleLogout = async () => {
        setAuthError(null); // 清除错误
        try {
            await signOut(auth);
            setCurrentPage('home'); // 登出后跳转到主页
        } catch (error) {
            console.error("登出失败:", error);
            setAuthError(t('logout_failed') + error.message);
        }
    };


    const renderPage = () => {
        if (loadingAuth || loadingHomepageSettings || loadingAboutUsContent || loadingBusinessOutlookContent || loadingIndustryDynamicsContent || loadingContactInfo) {
            return <div className="text-center py-20 text-xl text-gray-600">{t('loading_content')}</div>;
        }

        // 如果用户未认证，显示登录页面
        if (!user) {
            return <LoginPage onLogin={handleLogin} onRegister={handleRegister} authError={authError} />;
        }

        // 如果用户已认证，根据 currentPage 渲染页面
        switch (currentPage) {
            case 'home':
                return <HomePage homepageSettings={homepageSettings} loadingHomepageSettings={loadingHomepageSettings} errorHomepageSettings={errorHomepageSettings} />;
            case 'about':
                return <AboutUsPage aboutUsContent={aboutUsContent} />;
            case 'business':
                return <BusinessOutlookPage businessOutlookContent={businessOutlookContent} />;
            case 'industry':
                return <IndustryDynamicsPage industryDynamicsContent={industryDynamicsContent} />;
            case 'contact':
                return <ContactUsPage contactInfo={contactInfo} />; // Pass contactInfo
            case 'admin':
                // 只有管理员才能访问 AdminPage
                if (userRole === 'admin') {
                    return <AdminPage
                        userId={userId}
                        homepageSettings={homepageSettings}
                        setHomepageSettings={setHomepageSettings}
                        aboutUsContent={aboutUsContent}
                        setAboutUsContent={setAboutUsContent}
                        businessOutlookContent={businessOutlookContent}
                        setBusinessOutlookContent={setBusinessOutlookContent}
                        industryDynamicsContent={industryDynamicsContent}
                        setIndustryDynamicsContent={setIndustryDynamicsContent}
                        contactInfo={contactInfo} // Pass contactInfo
                        setContactInfo={setContactInfo} // Pass setContactInfo
                    />;
                } else {
                    return (
                        <div className="text-center py-20 text-xl text-red-600">
                            {t('access_denied_admin')}
                            <button onClick={() => setCurrentPage('home')} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                {t('go_to_homepage')}
                            </button>
                        </div>
                    );
                }
            default:
                return <HomePage homepageSettings={homepageSettings} loadingHomepageSettings={loadingHomepageSettings} errorHomepageSettings={errorHomepageSettings} />;
        }
    };

    return (
        <div className="antialiased">
            <LanguageSwitcher /> {/* 语言切换器在顶部 */}
            {/* 传递认证状态和用户角色给 Navbar */}
            <Navbar setCurrentPage={setCurrentPage} logoUrl={homepageSettings?.logoUrl} isAuthenticated={!!user} userRole={userRole} />
            {/* 认证状态显示和登出按钮 */}
            <AuthStatus user={user} onLogout={handleLogout} />
            <main>
                {renderPage()}
            </main>
            <footer className="bg-gray-800 text-white py-8 rounded-t-lg">
                <div className="container mx-auto px-4 md:px-6 text-center text-sm">
                    <p>{t('footer_copyright')}</p>
                </div>
            </footer>
        </div>
    );
}

export default App;

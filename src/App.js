import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc } from 'firebase/firestore';

// Ensure global variables are defined for local development if not provided by environment
// These are typically injected by the Canvas environment.
if (typeof window.__app_id === 'undefined') {
    window.__app_id = 'default-app-id-for-local'; // A placeholder for local development
}
if (typeof window.__firebase_config === 'undefined') {
    // IMPORTANT: Replace these placeholder values with your actual Firebase project configuration!
    // You can find these in your Firebase project settings -> Your apps -> Web app -> Config
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
    window.__initial_auth_token = null; // No auth token for local anonymous sign-in
}

// Global variables provided by the Canvas environment for Firebase
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

// Define a default firebaseConfig with placeholder values
// IMPORTANT: Replace these placeholder values with your actual Firebase project configuration!
const defaultFirebaseConfig = {
    apiKey: "AIzaSyAfY0BYuEjHDJlOLdeWXeO1q6PAYX4_y-U", // <-- Updated with your actual API Key
    authDomain: "theglobalscm-site.firebaseapp.com", // <-- Updated with your actual Auth Domain
    projectId: "theglobalscm-site", // <-- Updated with your actual Project ID
    storageBucket: "theglobalscm-site.firebasestorage.app", // <-- Updated with your actual Storage Bucket
    messagingSenderId: "75221196600", // <-- Updated with your actual Sender ID
    appId: "1:75221196600:web:1436916c08655d2dc2ebcd", // <-- Updated with your actual App ID
    measurementId: "G-GJXQGJZZN3" // <-- Updated with your actual Measurement ID (optional)
};

// Safely parse firebaseConfig, falling back to default if __firebase_config is undefined or invalid
let firebaseConfig;
try {
    // Use window.__firebase_config directly
    firebaseConfig = typeof window.__firebase_config !== 'undefined' && window.__firebase_config ? JSON.parse(window.__firebase_config) : defaultFirebaseConfig;
    // Merge with default to ensure all keys are present if __firebase_config is partial
    firebaseConfig = { ...defaultFirebaseConfig, ...firebaseConfig };
} catch (e) {
    console.error("Error parsing window.__firebase_config, falling back to default:", e);
    firebaseConfig = defaultFirebaseConfig;
}

const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

// Initialize Firebase (will be done once in App component)
let app;
let db;
let auth;

// AdminPage Component (Defined outside App to avoid re-creation on every render)
const AdminPage = ({ userId, homepageSettings, setHomepageSettings, aboutUsContent, setAboutUsContent, businessOutlookContent, setBusinessOutlookContent, industryDynamicsContent, setIndustryDynamicsContent, contactInfo, setContactInfo }) => {
    const [currentAdminTab, setCurrentAdminTab] = useState('homepage'); // State for admin tabs

    // Local states for editing content (initialized with props)
    const [currentHomepageSettings, setCurrentHomepageSettings] = useState(homepageSettings);
    const [currentAboutUsContent, setCurrentAboutUsContent] = useState(aboutUsContent);
    const [currentBusinessOutlookContent, setCurrentBusinessOutlookContent] = useState(businessOutlookContent);
    const [currentIndustryDynamicsContent, setCurrentIndustryDynamicsContent] = useState(industryDynamicsContent);
    const [currentContactInfo, setCurrentContactInfo] = useState(contactInfo); // New state for contact info

    const [updateStatus, setUpdateStatus] = useState('');

    // Update local states when props change (e.g., after initial fetch or external update)
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
        setCurrentContactInfo(contactInfo); // Update local state when contactInfo prop changes
    }, [contactInfo]);

    // Handlers for updating content
    const handleHomepageSettingChange = (e) => {
        const { name, value } = e.target;
        setCurrentHomepageSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateHomepageSettings = async () => {
        setUpdateStatus('更新中...');
        try {
            const homepageSettingsDocRef = doc(db, `artifacts/${appId}/public/data/homepage_settings`, 'main_settings');
            await setDoc(homepageSettingsDocRef, currentHomepageSettings, { merge: true });
            setUpdateStatus('主页设置更新成功！');
        } catch (error) {
            console.error("Error updating homepage settings:", error);
            setUpdateStatus('更新失败: ' + error.message);
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
        setUpdateStatus('更新中...');
        try {
            const aboutUsDocRef = doc(db, `artifacts/${appId}/public/data/about_us_content`, 'main_content');
            await setDoc(aboutUsDocRef, currentAboutUsContent, { merge: true });
            setUpdateStatus('关于我们内容更新成功！');
        } catch (error) {
            console.error("Error updating About Us content:", error);
            setUpdateStatus('更新失败: ' + error.message);
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
        setUpdateStatus('更新中...');
        try {
            const businessOutlookDocRef = doc(db, `artifacts/${appId}/public/data/business_outlook_content`, 'main_content');
            await setDoc(businessOutlookDocRef, currentBusinessOutlookContent, { merge: true });
            setUpdateStatus('业务与展望内容更新成功！');
        } catch (error) {
            console.error("Error updating Business & Outlook content:", error);
            setUpdateStatus('更新失败: ' + error.message);
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
        setUpdateStatus('更新中...');
        try {
            const industryDynamicsDocRef = doc(db, `artifacts/${appId}/public/data/industry_dynamics_content`, 'main_content');
            await setDoc(industryDynamicsDocRef, currentIndustryDynamicsContent, { merge: true });
            setUpdateStatus('行业动态内容更新成功！');
        } catch (error) {
            console.error("Error updating Industry Dynamics content:", error);
            setUpdateStatus('更新失败: ' + error.message);
        }
    };

    // New handlers for Contact Info
    const handleContactInfoChange = (e) => {
        const { name, value } = e.target;
        setCurrentContactInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateContactInfo = async () => {
        setUpdateStatus('更新中...');
        try {
            const contactInfoDocRef = doc(db, `artifacts/${appId}/public/data/contact_info`, 'main_contact');
            await setDoc(contactInfoDocRef, currentContactInfo, { merge: true });
            setUpdateStatus('联系方式更新成功！');
        } catch (error) {
            console.error("Error updating contact info:", error);
            setUpdateStatus('更新失败: ' + error.message);
        }
    };

    // Admin UI rendering
    return (
        <section id="admin" className="py-16 md:py-24 bg-gray-100 rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">管理后台</h2>
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <p className="text-lg text-gray-700 mb-4">
                        当前用户ID: <span className="font-mono bg-gray-200 p-1 rounded">{userId}</span>
                    </p>

                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'homepage' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('homepage')}
                        >
                            主页设置
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'aboutUs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('aboutUs')}
                        >
                            关于我们
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'businessOutlook' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('businessOutlook')}
                        >
                            业务与展望
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'industryDynamics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('industryDynamics')}
                        >
                            行业动态
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${currentAdminTab === 'contact' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={() => setCurrentAdminTab('contact')}
                        >
                            联系方式
                        </button>
                    </div>

                    {updateStatus && (
                        <div className={`p-3 mb-4 rounded-md ${updateStatus.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {updateStatus}
                        </div>
                    )}

                    {/* Homepage Settings Tab */}
                    {currentAdminTab === 'homepage' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">主页内容编辑</h3>
                            <div>
                                <label htmlFor="heroTitle" className="block text-gray-700 text-sm font-bold mb-2">主标题:</label>
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
                                <label htmlFor="heroDescription" className="block text-gray-700 text-sm font-bold mb-2">描述:</label>
                                <textarea
                                    id="heroDescription"
                                    name="heroDescription"
                                    value={currentHomepageSettings.heroDescription}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <div>
                                <label htmlFor="heroButtonText" className="block text-gray-700 text-sm font-bold mb-2">按钮文本:</label>
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
                                <label htmlFor="heroBackgroundImageUrl" className="block text-gray-700 text-sm font-bold mb-2">背景图片URL:</label>
                                <input
                                    type="text"
                                    id="heroBackgroundImageUrl"
                                    name="heroBackgroundImageUrl"
                                    value={currentHomepageSettings.heroBackgroundImageUrl}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {currentHomepageSettings.heroBackgroundImageUrl && (
                                    <img src={currentHomepageSettings.heroBackgroundImageUrl} alt="背景预览" className="mt-2 w-32 h-auto rounded-md" onError={(e) => e.target.src = 'https://placehold.co/100x60/cccccc/333333?text=Image+Error'}/>
                                )}
                            </div>
                            <div>
                                <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-bold mb-2">Logo URL:</label>
                                <input
                                    type="text"
                                    id="logoUrl"
                                    name="logoUrl"
                                    value={currentHomepageSettings.logoUrl}
                                    onChange={handleHomepageSettingChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {currentHomepageSettings.logoUrl && (
                                    <img src={currentHomepageSettings.logoUrl} alt="Logo预览" className="mt-2 w-16 h-16 rounded-full" onError={(e) => e.target.src = 'https://placehold.co/40x40/cccccc/333333?text=Logo+Error'}/>
                                )}
                            </div>
                            <button
                                onClick={handleUpdateHomepageSettings}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                保存主页设置
                            </button>
                        </div>
                    )}

                    {/* About Us Tab */}
                    {currentAdminTab === 'aboutUs' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">关于我们内容编辑</h3>
                            <div>
                                <label htmlFor="aboutText1" className="block text-gray-700 text-sm font-bold mb-2">关于我们文本1:</label>
                                <textarea
                                    id="aboutText1"
                                    name="aboutText1"
                                    value={currentAboutUsContent.aboutText1}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <div>
                                <label htmlFor="aboutText2" className="block text-gray-700 text-sm font-bold mb-2">关于我们文本2:</label>
                                <textarea
                                    id="aboutText2"
                                    name="aboutText2"
                                    value={currentAboutUsContent.aboutText2}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>
                            <div>
                                <label htmlFor="aboutImageUrl" className="block text-gray-700 text-sm font-bold mb-2">关于我们图片URL:</label>
                                <input
                                    type="text"
                                    id="aboutImageUrl"
                                    name="aboutImageUrl"
                                    value={currentAboutUsContent.aboutImageUrl}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                {currentAboutUsContent.aboutImageUrl && (
                                    <img src={currentAboutUsContent.aboutImageUrl} alt="关于我们预览" className="mt-2 w-32 h-auto rounded-md" onError={(e) => e.target.src = 'https://placehold.co/100x60/cccccc/333333?text=Image+Error'}/>
                                )}
                            </div>
                            <div>
                                <label htmlFor="teamIntro" className="block text-gray-700 text-sm font-bold mb-2">团队介绍:</label>
                                <textarea
                                    id="teamIntro"
                                    name="teamIntro"
                                    value={currentAboutUsContent.teamIntro}
                                    onChange={handleAboutUsContentChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                />
                            </div>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">团队成员</h4>
                            {currentAboutUsContent.teamMembers.map((member, index) => (
                                <div key={index} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">成员 {index + 1}</h5>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="姓名"
                                            value={member.name}
                                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        <input
                                            type="text"
                                            placeholder="职位"
                                            value={member.title}
                                            onChange={(e) => handleTeamMemberChange(index, 'title', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        <textarea
                                            placeholder="简介"
                                            value={member.bio}
                                            onChange={(e) => handleTeamMemberChange(index, 'bio', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-20"
                                        />
                                        <input
                                            type="text"
                                            placeholder="图片URL"
                                            value={member.imageUrl}
                                            onChange={(e) => handleTeamMemberChange(index, 'imageUrl', e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                        {member.imageUrl && (
                                            <img src={member.imageUrl} alt="成员预览" className="mt-2 w-20 h-20 rounded-full" onError={(e) => e.target.src = 'https://placehold.co/50x50/cccccc/333333?text=Image+Error'}/>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveTeamMember(index)}
                                        className="mt-4 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition duration-300"
                                    >
                                        移除成员
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddTeamMember}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                添加团队成员
                            </button>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">核心优势</h4>
                            {currentAboutUsContent.coreAdvantages.map((advantage, advIndex) => (
                                <div key={advIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">优势 {advIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder="标题"
                                        value={advantage.title}
                                        onChange={(e) => handleCoreAdvantageChange(advIndex, 'title', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    <h6 className="font-medium mt-3 mb-1">要点:</h6>
                                    {advantage.points.map((point, pointIndex) => (
                                        <div key={pointIndex} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder="要点描述"
                                                value={point}
                                                onChange={(e) => handleCoreAdvantagePointChange(advIndex, pointIndex, e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                            />
                                            <button
                                                onClick={() => handleRemoveCoreAdvantagePoint(advIndex, pointIndex)}
                                                className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                            >
                                                移除
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleAddCoreAdvantagePoint(advIndex)}
                                        className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                    >
                                        添加要点
                                    </button>
                                    <button
                                        onClick={() => handleRemoveCoreAdvantage(advIndex)}
                                        className="mt-4 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-sm transition duration-300 ml-2"
                                    >
                                        移除优势
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddCoreAdvantage}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                添加核心优势
                            </button>

                            <button
                                onClick={handleUpdateAboutUsContent}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 mt-6"
                            >
                                保存关于我们
                            </button>
                        </div>
                    )}

                    {/* Business and Outlook Tab */}
                    {currentAdminTab === 'businessOutlook' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">业务与展望内容编辑</h3>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">业务范围</h4>
                            {currentBusinessOutlookContent.businessScopeItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">业务范围项 {itemIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder="标题"
                                        value={item.title}
                                        onChange={(e) => handleBusinessScopeItemChange(itemIndex, 'title', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    {item.points && (
                                        <>
                                            <h6 className="font-medium mt-3 mb-1">要点:</h6>
                                            {item.points.map((point, pointIndex) => (
                                                <div key={pointIndex} className="flex items-center mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder="要点描述"
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
                                                        移除
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
                                                添加要点
                                            </button>
                                        </>
                                    )}
                                    {item.text && (
                                        <div>
                                            <label htmlFor={`businessScopeText${itemIndex}`} className="block text-gray-700 text-sm font-bold mb-2">文本内容:</label>
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
                                            <label htmlFor={`businessScopeImageUrl${itemIndex}`} className="block text-gray-700 text-sm font-bold mb-2">图片URL:</label>
                                            <input
                                                type="text"
                                                id={`businessScopeImageUrl${itemIndex}`}
                                                value={item.imageUrl}
                                                onChange={(e) => handleBusinessScopeItemChange(itemIndex, 'imageUrl', e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                            <img src={item.imageUrl} alt="预览" className="mt-2 w-32 h-auto rounded-md" onError={(e) => e.target.src = 'https://placehold.co/100x60/cccccc/333333?text=Image+Error'}/>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">业务拓展</h4>
                            {currentBusinessOutlookContent.businessExpansionItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">业务拓展项 {itemIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder="标题"
                                        value={item.title}
                                        onChange={(e) => handleBusinessExpansionItemChange(itemIndex, 'title', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    <h6 className="font-medium mt-3 mb-1">要点:</h6>
                                    {item.points.map((point, pointIndex) => (
                                        <div key={pointIndex} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder="要点描述"
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
                                                移除
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
                                        添加要点
                                    </button>
                                </div>
                            ))}

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">财务预测 - 收入与毛利</h4>
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full bg-white rounded-lg shadow-md">
                                    <thead>
                                        <tr className="bg-blue-100 text-blue-800">
                                            <th className="py-2 px-3 text-left">年份</th>
                                            <th className="py-2 px-3 text-left">收入 (亿元)</th>
                                            <th className="py-2 px-3 text-left">销售量 (万吨)</th>
                                            <th className="py-2 px-3 text-left">毛利 (亿元)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentBusinessOutlookContent.financialForecast.revenueTable.map((row, index) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-2 px-3">{row.year}</td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        value={row.revenue}
                                                        onChange={(e) => handleFinancialRevenueChange(index, 'revenue', e.target.value)}
                                                        className="w-24 border rounded px-2 py-1 text-gray-700"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        value={row.sales}
                                                        onChange={(e) => handleFinancialRevenueChange(index, 'sales', e.target.value)}
                                                        className="w-24 border rounded px-2 py-1 text-gray-700"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        value={row.grossProfit}
                                                        onChange={(e) => handleFinancialRevenueChange(index, 'grossProfit', e.target.value)}
                                                        className="w-24 border rounded px-2 py-1 text-gray-700"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <h4 className="text-xl font-semibold text-gray-800 mt-6 mb-4">财务预测 - 成本与融资假设</h4>
                            {currentBusinessOutlookContent.financialForecast.costAssumptions.map((assumption, assumpIndex) => (
                                <div key={assumpIndex} className="border p-4 rounded-md mb-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">假设项 {assumpIndex + 1}</h5>
                                    <input
                                        type="text"
                                        placeholder="类型"
                                        value={assumption.type}
                                        onChange={(e) => handleFinancialCostAssumptionChange(assumpIndex, 'type', e.target.value)}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                    />
                                    <h6 className="font-medium mt-3 mb-1">详情:</h6>
                                    {assumption.details.map((detail, detailIndex) => (
                                        <div key={detailIndex} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                placeholder="详情描述"
                                                value={detail}
                                                onChange={(e) => handleFinancialCostDetailChange(assumpIndex, detailIndex, e.target.value)}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updatedAssumptions = [...currentBusinessOutlookContent.financialForecast.costAssumptions];
                                                    updatedAssumptions[assumpIndex].details.splice(detailIndex, 1);
                                                    setCurrentBusinessOutlookContent(prev => ({
                                                        ...prev,
                                                        financialForecast: { ...prev.financialForecast, costAssumptions: updatedAssumptions }
                                                    }));
                                                }}
                                                className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                            >
                                                移除
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const updatedAssumptions = [...currentBusinessOutlookContent.financialForecast.costAssumptions];
                                            updatedAssumptions[assumpIndex].details.push('');
                                            setCurrentBusinessOutlookContent(prev => ({
                                                ...prev,
                                                financialForecast: { ...prev.financialForecast, costAssumptions: updatedAssumptions }
                                            }));
                                        }}
                                        className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                    >
                                        添加详情
                                    </button>
                                </div>
                            ))}

                            <div>
                                <label htmlFor="investmentOpportunity" className="block text-gray-700 text-sm font-bold mb-2">投资机会描述:</label>
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
                                保存业务与展望
                            </button>
                        </div>
                    )}

                    {/* Industry Dynamics Tab */}
                    {currentAdminTab === 'industryDynamics' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">行业动态内容编辑</h3>

                            {/* China Aluminum Section */}
                            <div className="border p-4 rounded-md bg-gray-50">
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">中国铝业产业现状与发展态势</h4>
                                <input
                                    type="text"
                                    placeholder="标题"
                                    value={currentIndustryDynamicsContent.chinaAluminum.title}
                                    onChange={(e) => handleIndustryDynamicsContentChange('chinaAluminum', 'title', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                                <h5 className="font-medium mt-3 mb-1">要点:</h5>
                                {currentIndustryDynamicsContent.chinaAluminum.points.map((point, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder="要点描述"
                                            value={point}
                                            onChange={(e) => handleIndustryDynamicsPointChange('chinaAluminum', index, e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        />
                                        <button
                                            onClick={() => handleRemoveIndustryDynamicsPoint('chinaAluminum', index)}
                                            className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                        >
                                            移除
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddIndustryDynamicsPoint('chinaAluminum')}
                                    className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                >
                                    添加要点
                                </button>
                            </div>

                            {/* International Aluminum Section */}
                            <div className="border p-4 rounded-md bg-gray-50 mt-4">
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">国际铝业及有色金属发展前景</h4>
                                <input
                                    type="text"
                                    placeholder="标题"
                                    value={currentIndustryDynamicsContent.internationalAluminum.title}
                                    onChange={(e) => handleIndustryDynamicsContentChange('internationalAluminum', 'title', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                                <h5 className="font-medium mt-3 mb-1">要点:</h5>
                                {currentIndustryDynamicsContent.internationalAluminum.points.map((point, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder="要点描述"
                                            value={point}
                                            onChange={(e) => handleIndustryDynamicsPointChange('internationalAluminum', index, e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        />
                                        <button
                                            onClick={() => handleRemoveIndustryDynamicsPoint('internationalAluminum', index)}
                                            className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                        >
                                            移除
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddIndustryDynamicsPoint('internationalAluminum')}
                                    className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                >
                                    添加要点
                                </button>
                            </div>

                            {/* Chinalco Role Section */}
                            <div className="border p-4 rounded-md bg-gray-50 mt-4">
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">中铝集团市场份额与主渠道作用</h4>
                                <input
                                    type="text"
                                    placeholder="标题"
                                    value={currentIndustryDynamicsContent.chinalcoRole.title}
                                    onChange={(e) => handleIndustryDynamicsContentChange('chinalcoRole', 'title', e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                                />
                                <h5 className="font-medium mt-3 mb-1">要点:</h5>
                                {currentIndustryDynamicsContent.chinalcoRole.points.map((point, index) => (
                                    <div key={index} className="flex items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder="要点描述"
                                            value={point}
                                            onChange={(e) => handleIndustryDynamicsPointChange('chinalcoRole', index, e.target.value)}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                                        />
                                        <button
                                            onClick={() => handleRemoveIndustryDynamicsPoint('chinalcoRole', index)}
                                            className="bg-red-400 hover:bg-red-500 text-white py-1 px-2 rounded-md text-sm transition duration-300"
                                        >
                                            移除
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddIndustryDynamicsPoint('chinalcoRole')}
                                    className="bg-blue-400 hover:bg-blue-500 text-white py-1 px-3 rounded-md text-sm mt-2 transition duration-300"
                                >
                                    添加要点
                                </button>
                            </div>

                            <button
                                onClick={handleUpdateIndustryDynamicsContent}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 mt-6"
                            >
                                保存行业动态
                            </button>
                        </div>
                    )}

                    {/* Contact Info Tab */}
                    {currentAdminTab === 'contact' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">联系方式编辑</h3>
                            <div>
                                <label htmlFor="contactAddress" className="block text-gray-700 text-sm font-bold mb-2">地址:</label>
                                <input
                                    type="text"
                                    id="contactAddress"
                                    name="address"
                                    value={currentContactInfo.address}
                                    onChange={handleContactInfoChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label htmlFor="contactPhone" className="block text-gray-700 text-sm font-bold mb-2">电话:</label>
                                <input
                                    type="text"
                                    id="contactPhone"
                                    name="phone"
                                    value={currentContactInfo.phone}
                                    onChange={handleContactInfoChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div>
                                <label htmlFor="contactEmail" className="block text-gray-700 text-sm font-bold mb-2">邮箱:</label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    name="email"
                                    value={currentContactInfo.email}
                                    onChange={handleContactInfoChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <button
                                onClick={handleUpdateContactInfo}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                保存联系方式
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};


// Main App Component
function App() {
    // State to manage current page view
    const [currentPage, setCurrentPage] = useState('home');
    // State for Firebase instances and user ID
    const [firebaseInitialized, setFirebaseInitialized] = useState(false);
    const [userId, setUserId] = useState(null);

    // States for dynamic content fetched from Firestore
    const [homepageSettings, setHomepageSettings] = useState({
        heroTitle: '广东合正国际供应链管理有限公司',
        heroDescription: '有色金属及自然资源领域的领先综合供应链平台',
        heroButtonText: '了解更多',
        heroBackgroundImageUrl: 'https://placehold.co/1920x1080/000000/ffffff?text=Supply+Chain+Background',
        logoUrl: 'https://placehold.co/40x40/1a73e8/ffffff?text=Logo'
    });
    const [loadingHomepageSettings, setLoadingHomepageSettings] = useState(true);
    const [errorHomepageSettings, setErrorHomepageSettings] = useState(null);

    const [aboutUsContent, setAboutUsContent] = useState({
        aboutText1: '广东合正国际供应链管理有限公司（以下简称“合正”）致力于到2028年成为有色金属及自然资源领域的领先综合供应链平台。凭借卓越的运营能力、强大的资源整合优势及与上游中国铝业集团（中铝集团）和下游铸造厂的紧密合作，合正通过与资本的深度结合，显著增强市场竞争力，扩展业务至国际贸易、供应链金融及数字化转型。',
        aboutText2: '本计划针对投资人，重点分析中国及国际铝业和有色金属行业的现状与前景，包括中铝集团在中国市场的领先地位及合正作为中铝国贸销售主渠道的优势，展示公司在行业中的战略定位、坚定信心及人才优势。此愿景与中国“一带一路”倡议、双碳目标及循环经济政策高度契合，旨在抓住市场机遇，为可持续工业发展和投资回报创造更大价值。',
        aboutImageUrl: 'https://placehold.co/600x400/e0e7ff/3f51b5?text=Company+Vision',
        teamIntro: '管理团队成员从事财务管理、战略运营、项目投融资、商业贸易、经营管理等版块工作有超20年的经验，在商业、咨询、贸易、制造等行业TOP10企业里担任过核心管理层，均具备丰富的实战能力。',
        teamMembers: [
            { name: '秦大明', title: '董事长', bio: '曾在四川省委省级机关工作30多年，并在多个知名企业和金融机构出任顾问和高管，拥有丰富的管理经验和人脉。', imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=秦大明' },
            { name: 'Jonson', title: '副董事长', bio: '在行业内拥有广泛的资源网络，具备卓越的资源整合能力。曾成功助力多家知名企业于西南地区完成新业务的落地与布局。', imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=Jonson' },
            { name: '许驰', title: '总经理', bio: '现任香港九鸿供应链管理公司（中国区）合伙人，此前曾担任多家国央企高管职务，全面负责公司战略规划与整体运营管理。', imageUrl: 'https://placehold.co/150x150/a7d9ff/007bff?text=许驰' },
        ],
        coreAdvantages: [
            { title: '卓越的运营能力', points: ['高效供应链管理：集中采购、精准物流、严格质量控制，降低交易成本10-15%。', '采用ERP及区块链技术，实现交易、库存及资金的实时跟踪。', '在珠海、深圳设立贸易办公室，快速响应市场需求，缩短交货周期至5-7天。', '质量与风险控制：与CCIC合作第三方质量检测，通过期货套期保值对冲价格波动风险。'] },
            { title: '强大的资源整合优势', points: ['上游战略合作：与中铝集团旗下上市公司建立长期战略合作，锁定优质铝材供应，获得低于市场平均水平的采购价格。', '下游紧密合作：以铸造厂订单为驱动，通过代采平台从中铝国贸集中采购，直接配送至下游工厂，提供45-60天信用账期。', '跨境资源网络：通过香港、新加坡、土耳其等地转口贸易，构建全球化的外贸业务体系，与东南亚再生铝供应商建立合作。'] },
            { title: '与资本结合的竞争优势', points: ['资本赋能运营：通过6.3亿元融资，弥补47天现金转换周期缺口，开发低成本贸易融资工具。', '放大市场竞争力：资本助力扩大国际贸易规模，加速布局海外贸易办公室，推动再生铝进口。', '风险管理与回报保障：专户管理、期货套期保值及运输保险，保障2-3%综合毛利率。'] },
        ]
    });
    const [loadingAboutUs, setLoadingAboutUs] = useState(true);
    const [errorAboutUs, setErrorAboutUs] = useState(null);

    const [businessOutlookContent, setBusinessOutlookContent] = useState({
        businessScopeItems: [
            { title: '主要交易商品', points: ['有色金属工业产品：电解铝、铝棒、铝合金、航天铝材、再生铝、电解铜、铜精粉', '自然资源：煤、液化天然气 (LNG)', '业务涵盖从采购到销售的全过程'] },
            { title: '国内交易链条', text: '与中国铝业集团、魏桥集团、五矿集团、延长石油、保利、中信戴卡、厦门海峡供应链、喀什能投、昆明城投等公司建立了合作关系。通过互贸互惠，逐步提高公司在国内市场的竞争力。', imageUrl: 'https://placehold.co/400x200/d1e7dd/28a745?text=Domestic+Chain' },
            { title: '境外交易链条', text: '现有境外贸易主要以香港、新加坡、英国、土耳其等地转口贸易为主，通过境外合作伙伴关系建立外贸业务体系，逐步拓展全球市场。', imageUrl: 'https://placehold.co/400x200/ffe0b2/ff9800?text=Overseas+Chain' },
        ],
        businessExpansionItems: [
            { title: '国际贸易扩展', points: ['扩展交易组合：新增铜、锌、铅及稀土交易。', '加强再生铝进口，推动高附加值铝合金出口。', '利用现有合作伙伴关系，拓展中东及欧洲市场。', '支持中国“一带一路”倡议。'] },
            { title: '供应链金融平台', points: ['为下游铸造厂提供贸易融资及信用解决方案。', '在SHFE及LME实施期货套期保值策略。', '在SHFE及LME实施期货套期保值策略。', '通过贸易差价、金融服务费及套期保值利润创收。', '与金融机构合作提供低成本资金。'] },
            { title: '数字化供应链平台', points: ['部署基于ERP及区块链的平台，跟踪交易、库存及资金。', '利用人工智能分析预测市场趋势，优化库存及定价策略。', '通过自动化流程及实时物流跟踪，降低交易成本。', '提供数字化客户门户。'] },
            { title: '可持续及循环经济', points: ['扩大再生铝及其他金属进口，支持中国循环经济目标。', '推广低碳铝生产及再生材料，助力中国双碳目标。', '投资节能物流及绿色供应链实践，年均减排10%。', '响应中国环保政策。'] },
        ],
        financialForecast: {
            revenueTable: [
                { year: '2025年', revenue: 0.9, sales: 0.47, grossProfit: 0.064 },
                { year: '2026年', revenue: 12.2, sales: 6, grossProfit: 2.4 },
                { year: '2027年', revenue: 21.0, sales: 21, grossProfit: 5.4 },
            ],
            costAssumptions: [
                { type: '铝平均价格 (含税)', details: ['2025年: 20,250元/吨', '2026年: 20,400元/吨', '2027年: 20,700元/吨'] },
                { type: '融资成本', details: ['年化6%，折算每吨113-200元 (视使用时长而定)。'] },
                { type: '总融资额', details: ['6.3亿元人民币 (2025年2.1亿, 2026年2.4亿, 2027年3.6亿)。'] },
            ],
            investmentOpportunity: '合正提供独特的价值主张，结合稳定的铝贸易、与中铝国贸主渠道的合作优势，以及创新的供应链金融及数字化解决方案。通过资本赋能，放大运营及资源优势，构建全球化的竞争优势，并契合中国战略政策，确保长期增长及可持续性。投资者将通过贸易差价及金融服务获得稳定回报（综合毛利率2-3%），并通过期货套期保值、质量控制及透明资金管理降低风险，获得“一带一路”地区及再生材料市场的高增长机会。'
        }
    });
    const [loadingBusinessOutlook, setLoadingBusinessOutlook] = useState(true);
    const [errorBusinessOutlook, setErrorBusinessOutlook] = useState(null);

    const [industryDynamicsContent, setIndustryDynamicsContent] = useState({
        chinaAluminum: {
            title: '中国铝业产业现状与发展态势',
            points: [
                '产业规模与地位: 中国是全球最大的铝生产国和消费国，2024年电解铝产量预计达4300万吨，占全球总量的60%。',
                '市场驱动因素: 新能源汽车、光伏及电力装备等“新三样”行业保持两位数增长，带动铝材需求快速增长。',
                '发展态式: 2025年国内电解铝产量预计增至4355万吨，价格将保持震荡偏强。',
                '《铝产业高质量发展实施方案(2025-2027年)》强调绿色低碳及新质生产力发展，鼓励再生铝及高附加值铝材生产，预计到2025年再生铝占比达35%。'
            ]
        },
        internationalAluminum: {
            title: '国际铝业及有色金属发展前景',
            points: [
                '全球铝市场: 2024年全球电解铝产量预计7225万吨，消费需求受新能源汽车、光伏及电力行业驱动持续增长。',
                'LME库存持续减少，价格预计在2550-2800美元/吨区间波动，反映供应短缺及市场乐观预期。',
                '有色金属前景: 铜、锌、铅及稀土等有色金属需求受新能源、电子及高端制造推动，预计2025-2027年全球消费量年均增长3-5%。',
                '趋势与机遇: 全球向绿色低碳转型，再生金属及低碳生产技术需求激增，国际市场从2024年微弱过剩转向2025年供应短缺。'
            ]
        },
        chinalcoRole: {
            title: '中铝集团市场份额与主渠道作用',
            points: [
                '市场份额: 中铝集团是中国铝业龙头，2024年氧化铝、电解铝及高纯铝产能全球领先，占国内电解铝市场约70%份额，稳居行业主导地位。',
                '主渠道优势: 中铝国贸作为中铝集团的核心销售平台，整合铝锭、铝棒、铝合金及航空材料供应，提供稳定价格及高质量产品。',
                '发展前景: 中铝集团定位为“全球有色金属产业排头兵、国家战略性矿产资源和军工材料保障主力军、行业创新和绿色发展引领者”。'
            ]
        }
    });
    const [loadingIndustryDynamics, setLoadingIndustryDynamics] = useState(true);
    const [errorIndustryDynamics, setErrorIndustryDynamics] = useState(null);

    // New state for Contact Info
    const [contactInfo, setContactInfo] = useState({
        address: '广东省广州市天河区珠江新城珠江东路16号',
        phone: '+86 020-12345678',
        email: 'info@hezhengsupplychain.com'
    });
    const [loadingContactInfo, setLoadingContactInfo] = useState(true);
    const [errorContactInfo, setErrorContactInfo] = useState(null);


    const [newsItems, setNewsItems] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [errorNews, setErrorNews] = useState(null);

    const [marketTrends, setMarketTrends] = useState([]);
    const [loadingMarketTrends, setLoadingMarketTrends] = useState(true);
    const [errorMarketTrends, setErrorMarketTrends] = useState(null);

    const [userTransactions, setUserTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [errorTransactions, setErrorTransactions] = useState(null);


    useEffect(() => {
        // 1. Initialize Firebase only once
        if (!firebaseInitialized) {
            try {
                app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                auth = getAuth(app);
                setFirebaseInitialized(true);
                console.log("Firebase initialized successfully.");
            } catch (e) {
                console.error("Error initializing Firebase:", e);
                setErrorNews("Failed to initialize Firebase.");
                setErrorMarketTrends("Failed to initialize Firebase.");
                setErrorTransactions("Failed to initialize Firebase.");
                setErrorHomepageSettings("Failed to initialize Firebase.");
                setErrorAboutUs("Failed to initialize Firebase.");
                setErrorBusinessOutlook("Failed to initialize Firebase.");
                setErrorIndustryDynamics("Failed to initialize Firebase.");
                setErrorContactInfo("Failed to initialize Firebase."); // New error state
                return; // Stop if Firebase initialization fails
            }
        }

        // 2. Set up authentication listener
        let unsubscribeAuth;
        if (auth) {
            unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    console.log("User authenticated:", user.uid);

                    // 3. Once user is authenticated, set up data listeners
                    if (db) {
                        // Homepage Settings Listener (Public Data)
                        const homepageSettingsDocRef = doc(db, `artifacts/${appId}/public/data/homepage_settings`, 'main_settings');
                        const unsubscribeHomepageSettings = onSnapshot(homepageSettingsDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setHomepageSettings(prev => ({ ...prev, ...docSnap.data() }));
                                console.log("Homepage settings fetched:", docSnap.data());
                            } else {
                                console.log("No homepage settings document found. Creating default.");
                                setDoc(homepageSettingsDocRef, homepageSettings); // Use initial default state
                            }
                            setLoadingHomepageSettings(false);
                        }, (error) => {
                            console.error("Error fetching homepage settings:", error);
                            setErrorHomepageSettings("Failed to load homepage settings.");
                            setLoadingHomepageSettings(false);
                        });

                        // About Us Content Listener (Public Data)
                        const aboutUsDocRef = doc(db, `artifacts/${appId}/public/data/about_us_content`, 'main_content');
                        const unsubscribeAboutUs = onSnapshot(aboutUsDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setAboutUsContent(prev => ({ ...prev, ...docSnap.data() }));
                                console.log("About Us content fetched:", docSnap.data());
                            } else {
                                console.log("No about us content document found. Creating default.");
                                setDoc(aboutUsDocRef, aboutUsContent);
                            }
                            setLoadingAboutUs(false);
                        }, (error) => {
                            console.error("Error fetching about us content:", error);
                            setErrorAboutUs("Failed to load about us content.");
                            setLoadingAboutUs(false);
                        });

                        // Business & Outlook Content Listener (Public Data)
                        const businessOutlookDocRef = doc(db, `artifacts/${appId}/public/data/business_outlook_content`, 'main_content');
                        const unsubscribeBusinessOutlook = onSnapshot(businessOutlookDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setBusinessOutlookContent(prev => ({ ...prev, ...docSnap.data() }));
                                console.log("Business & Outlook content fetched:", docSnap.data());
                            } else {
                                console.log("No business & outlook content document found. Creating default.");
                                setDoc(businessOutlookDocRef, businessOutlookContent);
                            }
                            setLoadingBusinessOutlook(false);
                        }, (error) => {
                            console.error("Error fetching business & outlook content:", error);
                            setErrorBusinessOutlook("Failed to load business & outlook content.");
                            setLoadingBusinessOutlook(false);
                        });

                        // Industry Dynamics Content Listener (Public Data)
                        const industryDynamicsDocRef = doc(db, `artifacts/${appId}/public/data/industry_dynamics_content`, 'main_content');
                        const unsubscribeIndustryDynamics = onSnapshot(industryDynamicsDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setIndustryDynamicsContent(prev => ({ ...prev, ...docSnap.data() }));
                                console.log("Industry Dynamics content fetched:", docSnap.data());
                            } else {
                                console.log("No industry dynamics content document found. Creating default.");
                                setDoc(industryDynamicsDocRef, industryDynamicsContent);
                            }
                            setLoadingIndustryDynamics(false);
                        }, (error) => {
                            console.error("Error fetching industry dynamics content:", error);
                            setErrorIndustryDynamics("Failed to load industry dynamics content.");
                            setLoadingIndustryDynamics(false);
                        });

                        // Contact Info Listener (Public Data) - NEW
                        const contactInfoDocRef = doc(db, `artifacts/${appId}/public/data/contact_info`, 'main_contact');
                        const unsubscribeContactInfo = onSnapshot(contactInfoDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                setContactInfo(prev => ({ ...prev, ...docSnap.data() }));
                                console.log("Contact info fetched:", docSnap.data());
                            } else {
                                console.log("No contact info document found. Creating default.");
                                setDoc(contactInfoDocRef, contactInfo); // Use initial default state
                            }
                            setLoadingContactInfo(false);
                        }, (error) => {
                            console.error("Error fetching contact info:", error);
                            setErrorContactInfo("Failed to load contact info.");
                            setLoadingContactInfo(false);
                        });


                        // News Listener (Public Data)
                        const newsCollectionRef = collection(db, `artifacts/${appId}/public/data/news`);
                        const qNews = query(newsCollectionRef, orderBy('timestamp', 'desc'));
                        const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
                            const items = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setNewsItems(items);
                            setLoadingNews(false);
                            console.log("News fetched:", items);
                        }, (error) => {
                            console.error("Error fetching news:", error);
                            if (error.code === 'permission-denied') {
                                setErrorNews("Failed to load news items. Please check Firebase Security Rules for read permissions on 'news' collection.");
                            } else {
                                setErrorNews("Failed to load news items: " + error.message);
                            }
                            setLoadingNews(false);
                        });

                        // Market Trends Listener (Public Data)
                        const marketTrendsCollectionRef = collection(db, `artifacts/${appId}/public/data/marketTrends`);
                        const qMarketTrends = query(marketTrendsCollectionRef, orderBy('date', 'desc')); // Assuming 'date' field for ordering
                        const unsubscribeMarketTrends = onSnapshot(qMarketTrends, (snapshot) => {
                            const items = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setMarketTrends(items);
                            setLoadingMarketTrends(false);
                            console.log("Market trends fetched:", items);
                        }, (error) => {
                            console.error("Error fetching market trends:", error);
                            if (error.code === 'permission-denied') {
                                setErrorMarketTrends("Failed to load market trends. Please check Firebase Security Rules for read permissions on 'marketTrends' collection.");
                            } else {
                                setErrorMarketTrends("Failed to load market trends: " + error.message);
                            }
                            setLoadingMarketTrends(false);
                        });

                        // User Transactions Listener (Private Data)
                        const transactionsCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/transactions`);
                        const qTransactions = query(transactionsCollectionRef, orderBy('date', 'desc')); // Assuming 'date' field for ordering
                        const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
                            const items = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setUserTransactions(items);
                            setLoadingTransactions(false);
                            console.log("User transactions fetched:", items);
                        }, (error) => {
                            console.error("Error fetching user transactions:", error);
                            if (error.code === 'permission-denied') {
                                setErrorTransactions("Failed to load transaction data. Please check Firebase Security Rules for read permissions on your 'transactions' collection.");
                            } else {
                                setErrorTransactions("Failed to load transaction data: " + error.message);
                            }
                            setLoadingTransactions(false);
                        });

                        // Return cleanup function for all snapshot listeners
                        return () => {
                            unsubscribeHomepageSettings();
                            unsubscribeAboutUs();
                            unsubscribeBusinessOutlook();
                            unsubscribeIndustryDynamics();
                            unsubscribeContactInfo(); // New cleanup
                            unsubscribeNews();
                            unsubscribeMarketTrends();
                            unsubscribeTransactions();
                        };
                    }
                } else {
                    console.log("No user authenticated. Attempting anonymous sign-in.");
                    try {
                        if (auth) {
                            await signInAnonymously(auth);
                            // onAuthStateChanged will fire again with the anonymous user
                        }
                    } catch (error) {
                        console.error("Error during anonymous sign-in:", error);
                        setErrorNews("Authentication failed. News might not load.");
                        setErrorMarketTrends("Authentication failed. Market trends might not load.");
                        setErrorTransactions("Authentication failed. Transaction data might not load.");
                        setErrorHomepageSettings("Authentication failed. Homepage settings might not load.");
                        setErrorAboutUs("Authentication failed. About Us content might not load.");
                        setErrorBusinessOutlook("Authentication failed. Business & Outlook content might not load.");
                        setErrorIndustryDynamics("Authentication failed. Industry Dynamics content might not load.");
                        setErrorContactInfo("Authentication failed. Contact info might not load."); // New error state
                        setLoadingNews(false);
                        setLoadingMarketTrends(false);
                        setLoadingTransactions(false);
                        setLoadingHomepageSettings(false);
                        setLoadingAboutUs(false);
                        setLoadingBusinessOutlook(false);
                        setLoadingIndustryDynamics(false);
                        setLoadingContactInfo(false); // New loading state
                    }
                    // Clear data and set loading to false if no user is authenticated
                    setNewsItems([]);
                    setLoadingNews(false);
                    setErrorNews(null); // Clear previous errors

                    setMarketTrends([]);
                    setLoadingMarketTrends(false);
                    setErrorMarketTrends(null);

                    setUserTransactions([]);
                    setLoadingTransactions(false);
                    setErrorTransactions(null);

                    // Set a temporary userId for display if no real user is logged in
                    setUserId(crypto.randomUUID());
                }
            });
        }

        // Cleanup auth listener on component unmount
        return () => {
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, [firebaseInitialized]); // Dependency array: only re-run when Firebase initialization state changes

    // Navigation component
    const Navbar = () => (
        <header className="bg-white shadow-md py-4 sticky top-0 z-50 rounded-b-lg">
            <div className="container mx-auto flex justify-between items-center px-4 md:px-6">
                <a href="#" className="flex items-center space-x-2">
                    <img src={homepageSettings.logoUrl} alt="公司Logo" className="rounded-full w-10 h-10 object-cover"/>
                    <span className="text-xl font-bold text-gray-800">合正供应链</span>
                </a>
                <nav className="hidden md:flex space-x-8">
                    <NavItem page="home" label="首页" />
                    <NavItem page="about" label="关于我们" />
                    <NavItem page="businessAndOutlook" label="业务与展望" />
                    <NavItem page="industryDynamics" label="行业动态" />
                    <NavItem page="marketTrends" label="市场行情" />
                    <NavItem page="customerTransactions" label="客户交易信息" />
                    <NavItem page="contact" label="联系我们" />
                </nav>
                <div className="flex items-center space-x-4">
                    {userId && (
                        <button
                            onClick={() => setCurrentPage('admin')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 hidden md:block"
                        >
                            管理后台
                        </button>
                    )}
                    <button id="mobile-menu-button" className="md:hidden text-gray-600 hover:text-blue-600 focus:outline-none" onClick={toggleMobileMenu}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="mobile-menu" className="hidden md:hidden bg-white py-4 shadow-lg rounded-b-lg">
                <nav className="flex flex-col items-center space-y-4">
                    <NavItem page="home" label="首页" mobile={true} />
                    <NavItem page="about" label="关于我们" mobile={true} />
                    <NavItem page="businessAndOutlook" label="业务与展望" mobile={true} />
                    <NavItem page="industryDynamics" label="行业动态" mobile={true} />
                    <NavItem page="marketTrends" label="市场行情" mobile={true} />
                    <NavItem page="customerTransactions" label="客户交易信息" mobile={true} />
                    <NavItem page="contact" label="联系我们" mobile={true} />
                    {userId && <NavItem page="admin" label="管理后台" mobile={true} />}
                </nav>
            </div>
        </header>
    );

    const NavItem = ({ page, label, mobile = false }) => (
        <button
            className={`text-gray-600 hover:text-blue-600 font-medium transition duration-300 ${currentPage === page ? 'text-blue-700 font-bold' : ''}`}
            onClick={() => {
                setCurrentPage(page);
                if (mobile) toggleMobileMenu();
            }}
        >
            {label}
        </button>
    );

    const toggleMobileMenu = () => {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    };

    // Page Components
    const HomePage = ({ homepageSettings, loadingHomepageSettings, errorHomepageSettings }) => (
        <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 md:py-32 overflow-hidden rounded-b-lg">
            {loadingHomepageSettings ? (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-700 bg-opacity-50">
                    <p className="text-white text-xl">加载主页设置中...</p>
                </div>
            ) : errorHomepageSettings ? (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-red-700 bg-opacity-50">
                    <p className="text-white text-xl">错误: {errorHomepageSettings}</p>
                </div>
            ) : (
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src={homepageSettings.heroBackgroundImageUrl} alt="背景图" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/1920x1080/000000/ffffff?text=Background+Image+Unavailable'}/>
                </div>
            )}
            <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                    {homepageSettings.heroTitle}
                </h1>
                <p className="text-lg md:text-xl mb-8 opacity-90">
                    {homepageSettings.heroDescription}
                </p>
                <button onClick={() => setCurrentPage('about')} className="bg-white text-blue-700 hover:bg-blue-100 px-8 py-3 rounded-full text-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105 inline-block">
                    {homepageSettings.heroButtonText}
                </button>
            </div>
        </section>
    );

    const AboutPage = ({ aboutUsContent, loadingAboutUs, errorAboutUs, newsItems, loadingNews, errorNews }) => (
        <section id="about" className="py-16 md:py-24 bg-white rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">关于我们</h2>
                {loadingAboutUs ? (
                    <p className="text-center text-gray-600">加载关于我们内容中...</p>
                ) : errorAboutUs ? (
                    <p className="text-center text-red-600">错误: {errorAboutUs}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                            <div className="space-y-6">
                                <p className="text-lg text-gray-700 leading-relaxed">{aboutUsContent.aboutText1}</p>
                                <p className="text-lg text-gray-700 leading-relaxed">{aboutUsContent.aboutText2}</p>
                            </div>
                            <div>
                                <img src={aboutUsContent.aboutImageUrl} alt="公司愿景" className="rounded-lg shadow-lg w-full h-auto object-cover" onError={(e) => e.target.src = 'https://placehold.co/600x400/e0e7ff/3f51b5?text=Company+Vision+Unavailable'}/>
                            </div>
                        </div>

                        {/* Core Team Section */}
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title mt-16">核心团队</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {aboutUsContent.teamMembers.map((member, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-6 text-center card">
                                    <img src={member.imageUrl} alt={member.name} className="w-36 h-36 rounded-full mx-auto mb-4 object-cover" onError={(e) => e.target.src = 'https://placehold.co/150x150/a7d9ff/007bff?text=Team+Member'}/>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{member.name} - {member.title}</h3>
                                    <p className="text-gray-600 text-sm">{member.bio}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 text-center mb-16">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">管理团队</h3>
                            <p className="text-gray-700 max-w-3xl mx-auto">{aboutUsContent.teamIntro}</p>
                        </div>

                        {/* Operational & Resource Advantages Section */}
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title mt-16">核心优势</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {aboutUsContent.coreAdvantages.map((advantage, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-8 card">
                                    <h3 className="text-2xl font-semibold text-blue-700 mb-4">{advantage.title}</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                                        {advantage.points.map((point, pIndex) => (
                                            <li key={pIndex}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Company News Section */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title mt-16">公司新闻</h2>
                {loadingNews && <p className="text-center text-gray-600">加载新闻中...</p>}
                {errorNews && <p className="text-center text-red-600">错误: {errorNews}</p>}
                {!loadingNews && newsItems.length === 0 && !errorNews && (
                    <p className="text-center text-gray-600">目前没有新闻发布。</p>
                )}
                <div className="space-y-8 mb-16">
                    {newsItems.map(item => (
                        <div key={item.id} className="bg-white rounded-lg p-6 shadow-md card">
                            <h3 className="text-xl font-semibold text-blue-700 mb-2">{item.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">
                                {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : '未知日期'}
                            </p>
                            <p className="text-gray-700 leading-relaxed">{item.content}</p>
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.title} className="mt-4 rounded-md max-w-full h-auto object-cover" onError={(e) => e.target.src = 'https://placehold.co/400x200/cccccc/333333?text=Image+Unavailable'} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const BusinessAndOutlookPage = ({ businessOutlookContent, loadingBusinessOutlook, errorBusinessOutlook }) => (
        <section id="businessAndOutlook" className="py-16 md:py-24 bg-gray-50 rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">业务与展望</h2>
                {loadingBusinessOutlook ? (
                    <p className="text-center text-gray-600">加载业务与展望内容中...</p>
                ) : errorBusinessOutlook ? (
                    <p className="text-center text-red-600">错误: {errorBusinessOutlook}</p>
                ) : (
                    <>
                        {/* Business Scope Section */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-8">业务范围</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {businessOutlookContent.businessScopeItems.map((item, index) => (
                                <div key={index} className="bg-white rounded-lg p-8 card">
                                    <h4 className="text-xl font-semibold text-blue-700 mb-4">{item.title}</h4>
                                    {item.points && (
                                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                                            {item.points.map((point, pIndex) => <li key={pIndex}>{point}</li>)}
                                        </ul>
                                    )}
                                    {item.text && <p className="text-gray-700 mb-4">{item.text}</p>}
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.title} className="rounded-md mt-4" onError={(e) => e.target.src = 'https://placehold.co/400x200/d1e7dd/28a745?text=Image+Unavailable'}/>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Business Expansion Section */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 mt-16">业务拓展</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                            {businessOutlookContent.businessExpansionItems.map((item, index) => (
                                <div key={index} className="bg-white rounded-lg p-6 card">
                                    <h3 className="text-xl font-semibold text-blue-700 mb-3">国际贸易扩展</h3>
                                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                        {item.points.map((point, pIndex) => <li key={pIndex}>{point}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Financial Forecast Section */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 mt-16">财务预测</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 rounded-lg p-8 card">
                                <h4 className="text-2xl font-semibold text-blue-700 mb-4">收入与毛利预测</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg shadow-md">
                                        <thead>
                                            <tr className="bg-blue-100 text-blue-800">
                                                <th className="py-3 px-4 text-left">年份</th>
                                                <th className="py-3 px-4 text-left">收入 (亿元)</th>
                                                <th className="py-3 px-4 text-left">销售量 (万吨)</th>
                                                <th className="py-3 px-4 text-left">毛利 (亿元)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {businessOutlookContent.financialForecast.revenueTable.map((row, index) => (
                                                <tr key={index} className="border-b border-gray-200">
                                                    <td className="py-3 px-4">{row.year}</td>
                                                    <td className="py-3 px-4">{row.revenue}</td>
                                                    <td className="py-3 px-4">{row.sales}</td>
                                                    <td className="py-3 px-4">{row.grossProfit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-8 card">
                                <h4 className="text-2xl font-semibold text-blue-700 mb-4">成本与融资预测</h4>
                                <ul className="list-disc list-inside text-gray-700 space-y-3">
                                    {businessOutlookContent.financialForecast.costAssumptions.map((assumption, index) => (
                                        <li key={index}><span className="font-medium">{assumption.type}:</span>
                                            <ul className="list-circle list-inside ml-4">
                                                {assumption.details.map((detail, dIndex) => <li key={dIndex}>{detail}</li>)}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 text-center">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">投资机会</h3>
                            <p className="text-gray-700 max-w-3xl mx-auto">{businessOutlookContent.financialForecast.investmentOpportunity}</p>
                        </div>
                    </>
                )}
            </div>
        </section>
    );

    const IndustryDynamicsPage = ({ industryDynamicsContent, loadingIndustryDynamics, errorIndustryDynamics }) => (
        <section id="industryDynamics" className="py-16 md:py-24 bg-white rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">行业动态</h2>
                {loadingIndustryDynamics ? (
                    <p className="text-center text-gray-600">加载行业动态内容中...</p>
                ) : errorIndustryDynamics ? (
                    <p className="text-center text-red-600">错误: {errorIndustryDynamics}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                            <div>
                                <h3 className="text-2xl font-semibold text-blue-700 mb-4">{industryDynamicsContent.chinaAluminum.title}</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-3">
                                    {industryDynamicsContent.chinaAluminum.points.map((point, index) => (
                                        <li key={index}>
                                            <span className="font-medium">{point.split(':')[0]}:</span> {point.split(':')[1]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold text-blue-700 mb-4">{industryDynamicsContent.internationalAluminum.title}</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-3">
                                    {industryDynamicsContent.internationalAluminum.points.map((point, index) => (
                                        <li key={index}>
                                            <span className="font-medium">{point.split(':')[0]}:</span> {point.split(':')[1]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 mb-16">
                            <h3 className="text-2xl font-semibold text-blue-700 mb-4">{industryDynamicsContent.chinalcoRole.title}</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-3">
                                {industryDynamicsContent.chinalcoRole.points.map((point, index) => (
                                    <li key={index}>
                                        <span className="font-medium">{point.split(':')[0]}:</span> {point.split(':')[1]}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </section>
    );

    const MarketTrendsPage = ({ marketTrends, loadingMarketTrends, errorMarketTrends }) => (
        <section id="marketTrends" className="py-16 md:py-24 bg-gray-50 rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">市场行情</h2>
                {loadingMarketTrends && <p className="text-center text-gray-600">加载市场行情中...</p>}
                {errorMarketTrends && <p className="text-center text-red-600">错误: {errorMarketTrends}</p>}
                {!loadingMarketTrends && marketTrends.length === 0 && !errorMarketTrends && (
                    <p className="text-center text-gray-600">目前没有市场行情数据。</p>
                )}
                {marketTrends.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow-md">
                            <thead>
                                <tr className="bg-blue-100 text-blue-800">
                                    <th className="py-3 px-4 text-left">商品</th>
                                    <th className="py-3 px-4 text-left">价格</th>
                                    <th className="py-3 px-4 text-left">单位</th>
                                    <th className="py-3 px-4 text-left">日期</th>
                                </tr>
                            </thead>
                            <tbody>
                                {marketTrends.map(item => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="py-3 px-4">{item.commodity}</td>
                                        <td className="py-3 px-4">{item.price}</td>
                                        <td className="py-3 px-4">{item.unit}</td>
                                        <td className="py-3 px-4">{item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : '未知日期'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-gray-700 mt-8">
                    **如何更新市场行情：** 请在Firebase Firestore数据库中创建 `artifacts/{appId}/public/data/marketTrends` 集合。每个文档应包含 `commodity` (商品名称, string), `price` (价格, number), `unit` (单位, string), `date` (日期, timestamp) 等字段。
                </p>
            </div>
        </section>
    );

    const CustomerTransactionsPage = ({ userId, userTransactions, loadingTransactions, errorTransactions }) => (
        <section id="customerTransactions" className="py-16 md:py-24 bg-white rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">客户交易信息</h2>
                <div className="bg-gray-50 rounded-lg p-8 shadow-md mb-8">
                    <p className="text-lg text-gray-700 mb-4">
                        欢迎来到客户交易信息页面。您的用户ID是: <span className="font-mono bg-gray-200 p-1 rounded">{userId}</span>
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        此页面用于展示您个人的交易信息。在实际应用中，这里会有一个登录系统，确保只有授权客户才能查看其私有数据。
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed mt-4">
                        **如何更新客户交易信息：** 请在Firebase Firestore数据库中创建 `artifacts/{appId}/users/{userId}/transactions` 集合。每个文档应包含 `transactionId` (交易ID, string), `item` (商品名称, string), `quantity` (数量, number), `price` (价格, number), `date` (日期, timestamp) 等字段。
                    </p>
                </div>

                {loadingTransactions && <p className="text-center text-gray-600">加载交易信息中...</p>}
                {errorTransactions && <p className="text-center text-red-600">错误: {errorTransactions}</p>}
                {!loadingTransactions && userTransactions.length === 0 && !errorTransactions && (
                    <p className="text-center text-gray-600">您目前没有交易信息。</p>
                )}
                {userTransactions.length > 0 && (
                    <div className="overflow-x-auto mt-8">
                        <table className="min-w-full bg-white rounded-lg shadow-md">
                            <thead>
                                <tr className="bg-blue-100 text-blue-800">
                                    <th className="py-3 px-4 text-left">交易ID</th>
                                    <th className="py-3 px-4 text-left">商品</th>
                                    <th className="py-3 px-4 text-left">数量</th>
                                    <th className="py-3 px-4 text-left">价格</th>
                                    <th className="py-3 px-4 text-left">日期</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userTransactions.map(transaction => (
                                    <tr key={transaction.id} className="border-b border-gray-200">
                                        <td className="py-3 px-4">{transaction.transactionId}</td>
                                        <td className="py-3 px-4">{transaction.item}</td>
                                        <td className="py-3 px-4">{transaction.quantity}</td>
                                        <td className="py-3 px-4">{transaction.price}</td>
                                        <td className="py-3 px-4">{transaction.date ? new Date(transaction.date.seconds * 1000).toLocaleDateString() : '未知日期'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );

    const ContactPage = ({ contactInfo, loadingContactInfo, errorContactInfo }) => ( // Pass contactInfo as prop
        <section id="contact" className="py-16 md:py-24 bg-gray-100 rounded-lg shadow-md m-4">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 section-title">联系我们</h2>
                {loadingContactInfo ? (
                    <p className="text-center text-gray-600">加载联系方式中...</p>
                ) : errorContactInfo ? (
                    <p className="text-center text-red-600">错误: {errorContactInfo}</p>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                        <p className="text-lg text-gray-700 mb-4">
                            我们期待与您合作，共同发展。如果您有任何疑问、合作意向或需要更多信息，请通过以下方式联系我们：
                        </p>
                        <div className="space-y-4 text-left inline-block">
                            <p className="text-gray-800"><strong className="text-blue-600">地址:</strong> {contactInfo.address}</p>
                            <p className="text-gray-800"><strong className="text-blue-600">电话:</strong> {contactInfo.phone}</p>
                            <p className="text-gray-800"><strong className="text-blue-600">邮箱:</strong> {contactInfo.email}</p>
                            <p className="text-gray-800"><strong className="text-blue-600">工作时间:</strong> 周一至周五，上午9:00 - 下午6:00 (北京时间)</p>
                        </div>
                        <p className="text-gray-700 mt-6">
                            您也可以填写下方的联系表格，我们将在收到您的信息后尽快与您取得联系。
                        </p>
                        {/* Contact Form Placeholder */}
                        <form className="mt-8 space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">姓名</label>
                                <input type="text" id="name" placeholder="您的姓名" className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">邮箱</label>
                                <input type="email" id="email" placeholder="您的邮箱" className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div>
                                <label htmlFor="subject" className="sr-only">主题</label>
                                <input type="text" id="subject" placeholder="主题" className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div>
                                <label htmlFor="message" className="sr-only">消息</label>
                                <textarea id="message" placeholder="您的消息" rows="5" className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
                                发送消息
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );

    // Function to render the current page based on state
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage homepageSettings={homepageSettings} loadingHomepageSettings={loadingHomepageSettings} errorHomepageSettings={errorHomepageSettings} />;
            case 'about':
                return <AboutPage aboutUsContent={aboutUsContent} loadingAboutUs={loadingAboutUs} errorAboutUs={errorAboutUs} newsItems={newsItems} loadingNews={loadingNews} errorNews={errorNews} />;
            case 'businessAndOutlook':
                return <BusinessAndOutlookPage businessOutlookContent={businessOutlookContent} loadingBusinessOutlook={loadingBusinessOutlook} errorBusinessOutlook={errorBusinessOutlook} />;
            case 'industryDynamics':
                return <IndustryDynamicsPage industryDynamicsContent={industryDynamicsContent} loadingIndustryDynamics={loadingIndustryDynamics} errorIndustryDynamics={errorIndustryDynamics} />;
            case 'marketTrends':
                return <MarketTrendsPage marketTrends={marketTrends} loadingMarketTrends={loadingMarketTrends} errorMarketTrends={errorMarketTrends} />;
            case 'customerTransactions':
                return <CustomerTransactionsPage userId={userId} userTransactions={userTransactions} loadingTransactions={loadingTransactions} errorTransactions={errorTransactions} />;
            case 'contact':
                return <ContactPage contactInfo={contactInfo} loadingContactInfo={loadingContactInfo} errorContactInfo={errorContactInfo} />; // Pass contactInfo
            case 'admin':
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
            default:
                return <HomePage homepageSettings={homepageSettings} loadingHomepageSettings={loadingHomepageSettings} errorHomepageSettings={errorHomepageSettings} />;
        }
    };

    return (
        <div className="antialiased">
            <Navbar />
            <main>
                {renderPage()}
            </main>
            <footer className="bg-gray-800 text-white py-8 rounded-t-lg">
                <div className="container mx-auto px-4 md:px-6 text-center text-sm">
                    <p>&copy; 2025 广东合正国际供应链管理有限公司. 保留所有权利。</p>
                </div>
            </footer>
        </div>
    );
}

export default App;

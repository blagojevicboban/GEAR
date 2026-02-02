import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, VETModel } from '../types';
import UserManagement from './UserManagement';
import LibraryManager from './LibraryManager';
import { Terminal } from 'lucide-react';

interface AdminSettingsProps {
    currentUser: User;
    models: VETModel[];
    onDeleteModel: (id: string) => Promise<void>;
    onUpdateModel: (model: VETModel) => Promise<void>;
    onCloneModel: (id: string) => Promise<void>;
    onEditModel: (model: VETModel) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({
    currentUser,
    models,
    onDeleteModel,
    onUpdateModel,
    onCloneModel,
    onEditModel,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<
        'users' | 'sectors' | 'logs' | 'config' | 'library'
    >('library');

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* Header / Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-0 px-6 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-6">
                        {t('admin.settings.title')}
                    </h1>
                    <div className="flex gap-8 overflow-x-auto">
                        <button
                            id="admin-tab-library"
                            onClick={() => setActiveTab('library')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${
                                activeTab === 'library'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                        >
                            {t('admin.settings.tabs.library')}
                        </button>
                        <button
                            id="admin-tab-users"
                            onClick={() => setActiveTab('users')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${
                                activeTab === 'users'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                        >
                            {t('admin.settings.tabs.users')}
                        </button>
                        <button
                            id="admin-tab-sectors"
                            onClick={() => setActiveTab('sectors')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${
                                activeTab === 'sectors'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                        >
                            {t('admin.settings.tabs.sectors')}
                        </button>
                        <button
                            id="admin-tab-config"
                            onClick={() => setActiveTab('config')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${
                                activeTab === 'config'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                        >
                            {t('admin.settings.tabs.config')}
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${
                                activeTab === 'logs'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                        >
                            {t('admin.settings.tabs.logs')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <UserManagement
                            currentUser={currentUser}
                            models={models}
                        />
                    </div>
                )}

                {activeTab === 'sectors' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <SectorManager currentUser={currentUser} />
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <SystemLogs currentUser={currentUser} />
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <SystemConfig currentUser={currentUser} />
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <LibraryManager
                            currentUser={currentUser}
                            models={models}
                            onDeleteModel={onDeleteModel}
                            onUpdateModel={onUpdateModel}
                            onCloneModel={onCloneModel}
                            onEditModel={onEditModel}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-components ---

const SystemConfig: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<any>({
        maintenance_mode: 'false',
        global_announcement: '',
        gemini_api_key: '',
        allow_public_registration: 'true',
        max_file_size_mb: '50',
        moodle_url: '',
        moodle_client_id: '',
        brand_name: 'THE GEAR',
        brand_color: '#4f46e5',
        ai_model: 'gemini-2.0-flash',
        ai_language: 'Auto',
        ai_temperature: '0.7',
        challenge_duration_days: '7',
        show_leaderboard: 'true',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/config', {
            headers: { 'X-User-Name': currentUser.username },
        })
            .then((res) => res.json())
            .then((data) => {
                setConfig((prev: any) => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch((e) => console.error(e));
    }, []);

    const handleSave = async () => {
        try {
            await fetch('/api/admin/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username,
                },
                body: JSON.stringify(config),
            });
            alert(t('admin.config.alerts.saved'));
        } catch (e) {
            alert(t('admin.config.alerts.failed'));
        }
    };

    const [backingUp, setBackingUp] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const handleBackup = (format: 'json' | 'sql' | 'full' = 'json') => {
        // All backup types now use direct download with spinner support
        setBackingUp(true);
        const token = Date.now().toString();
        
        // Polling for completion cookie
        const interval = setInterval(() => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, val] = cookie.trim().split('=');
                if (key && val) acc[key.trim()] = val.trim();
                return acc;
            }, {} as Record<string, string>);

            if (cookies['backup_download_started'] === token) {
                clearInterval(interval);
                setBackingUp(false);
                document.cookie = 'backup_download_started=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
        }, 1000);

        const url = `/api/admin/backup?format=${format}&user_name=${encodeURIComponent(currentUser.username)}&token=${token}`;
        window.location.href = url;
    };

    if (loading)
        return (
            <div className="text-slate-400">{t('admin.config.loading')}</div>
        );


    const renderOverlay = () => {
        if (!backingUp && !restoring) return null;
        
        const isRestore = restoring;
        const title = isRestore ? "Restoring System..." : "Preparing Backup...";
        const desc = isRestore 
            ? "Overwriting existing data. This may take several minutes." 
            : "Generating backup file. Please wait while the server prepares your download.";

        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm">
                        {desc}
                        <br />
                        <span className="text-indigo-400 mt-2 block">Please do not close this window.</span>
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {renderOverlay()}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">
                    {t('admin.config.title')}
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                            <div>
                                <span className="block font-bold text-white">
                                    {t('admin.config.maintenance.label')}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {t('admin.config.maintenance.desc')}
                                </span>
                            </div>
                            <div
                                 className={`w-12 h-6 rounded-full p-1 transition-colors ${config.maintenance_mode === 'true' ? 'bg-indigo-600' : 'bg-slate-600'}`}
                                 onClick={() =>
                                     setConfig({
                                         ...config,
                                         maintenance_mode:
                                             config.maintenance_mode === 'true'
                                                 ? 'false'
                                                 : 'true',
                                     })
                                 }
                            >
                                <div
                                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.maintenance_mode === 'true' ? 'translate-x-6' : ''}`}
                                ></div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                            <div>
                                <span className="block font-bold text-white">
                                    {t('admin.config.registration.label')}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {t('admin.config.registration.desc')}
                                </span>
                            </div>
                            <div
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${config.allow_public_registration === 'true' ? 'bg-green-600' : 'bg-slate-600'}`}
                                onClick={() =>
                                    setConfig({
                                        ...config,
                                        allow_public_registration:
                                            config.allow_public_registration === 'true'
                                                ? 'false'
                                                : 'true',
                                    })
                                }
                            >
                                <div
                                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.allow_public_registration === 'true' ? 'translate-x-6' : ''}`}
                                ></div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            {t('admin.config.max_size.label')}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="50"
                                value={config.max_file_size_mb || '50'}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        max_file_size_mb: e.target.value,
                                    })
                                }
                            />
                            <span className="text-slate-400 font-bold">MB</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('admin.config.max_size.desc')}
                        </p>
                    </div>

                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Terminal className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                {t('admin.config.ai_tweaks.label')}
                            </h3>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-indigo-300 uppercase mb-2">
                                {t('admin.config.ai_tweaks.model_label')}
                            </label>
                            <select 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={config.ai_model || 'gemini-2.0-flash'}
                                onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                            >
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Balanced)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                                <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite (Speed focus)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-indigo-300 uppercase mb-2">
                                    {t('admin.config.ai_tweaks.language_label')}
                                </label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={config.ai_language || 'Auto'}
                                    onChange={(e) => setConfig({ ...config, ai_language: e.target.value })}
                                >
                                    <option value="Auto">Auto (Browser Lang)</option>
                                    <option value="Serbian">Srpski</option>
                                    <option value="English">English</option>
                                    <option value="Italian">Italiano</option>
                                    <option value="Greek">Greek</option>
                                    <option value="Portuguese">Portuguese</option>
                                    <option value="Turkish">Turkish</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-300 uppercase mb-2">
                                    {t('admin.config.ai_tweaks.temp_label')}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        className="flex-1 accent-indigo-500"
                                        value={config.ai_temperature || '0.7'}
                                        onChange={(e) => setConfig({ ...config, ai_temperature: e.target.value })}
                                    />
                                    <span className="text-white font-mono w-8 text-right">{config.ai_temperature}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            {t('admin.config.ai_tweaks.desc')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Google Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="AIzaSy..."
                                value={config.gemini_api_key || ''}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        gemini_api_key: e.target.value,
                                    })
                                }
                            />
                            <div className="absolute right-4 top-3 text-xs text-slate-500 pointer-events-none">
                                {config.gemini_api_key
                                    ? 'Encrypted (Client-Side)'
                                    : 'Not Set'}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Required for AI Lesson Generation and Model
                            Analysis.
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 ml-1"
                            >
                                Get Key
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            {t('admin.config.branding.label')}
                        </label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={t('admin.config.branding.name_label')}
                                id="config-brand-name"
                                value={config.brand_name || ''}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        brand_name: e.target.value,
                                    })
                                }
                            />
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    className="h-12 w-12 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer p-1"
                                    id="config-brand-color-picker"
                                    value={config.brand_color || '#4f46e5'}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            brand_color: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="#4f46e5"
                                    value={config.brand_color || ''}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            brand_color: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('admin.config.branding.desc')}
                        </p>
                    </div>

                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-lg">
                                🏆
                            </div>
                            <h3 className="text-lg font-bold text-white">
                                {t('admin.config.gamification.label')}
                            </h3>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-amber-300 uppercase mb-2">
                                {t('admin.config.gamification.challenge_label')}
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    id="config-challenge-days"
                                    placeholder="7"
                                    value={config.challenge_duration_days || '7'}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            challenge_duration_days: e.target.value,
                                        })
                                    }
                                />
                                <span className="text-slate-400 font-bold">{t('common.days') || 'Days'}</span>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                                <div>
                                    <span className="block font-bold text-white">
                                        {t('admin.config.gamification.leaderboard_label')}
                                    </span>
                                </div>
                                <div
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${config.show_leaderboard === 'true' ? 'bg-amber-600' : 'bg-slate-600'}`}
                                    id="config-toggle-leaderboard"
                                    onClick={() =>
                                        setConfig({
                                            ...config,
                                            show_leaderboard:
                                                config.show_leaderboard === 'true'
                                                    ? 'false'
                                                    : 'true',
                                        })
                                    }
                                >
                                    <div
                                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.show_leaderboard === 'true' ? 'translate-x-6' : ''}`}
                                    ></div>
                                </div>
                            </label>
                        </div>

                        <p className="text-xs text-slate-500">
                            {t('admin.config.gamification.desc')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            {t('admin.config.moodle.label')}
                        </label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={t('admin.config.moodle.url_label')}
                                value={config.moodle_url || ''}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        moodle_url: e.target.value,
                                    })
                                }
                            />
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={t('admin.config.moodle.client_id_label')}
                                value={config.moodle_client_id || ''}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        moodle_client_id: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('admin.config.moodle.desc')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            {t('admin.config.cors.label')}
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="https://example.com, https://app.example.com"
                            value={config.allowed_origins || ''}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    allowed_origins: e.target.value,
                                })
                            }
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {t('admin.config.cors.desc')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            {t('admin.config.announcement.label')}
                        </label>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl padding-4 text-white p-3 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={t(
                                'admin.config.announcement.placeholder'
                            )}
                            value={config.global_announcement}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    global_announcement: e.target.value,
                                })
                            }
                        />
                    </div>

                    <button
                        id="config-save-btn"
                        onClick={handleSave}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        {t('admin.config.save_btn')}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl h-fit">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {t('admin.config.data_mgmt.title')}
                </h2>
                <p className="text-slate-400 mb-6">
                    {t('admin.config.data_mgmt.desc')}
                </p>

                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                        {t('admin.config.data_mgmt.export_title')}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        {t('admin.config.data_mgmt.export_desc')}
                    </p>
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                        <button
                            onClick={() => handleBackup('json')}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors border border-slate-600 flex items-center gap-2 text-sm"
                        >
                            <span className="text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">
                                JSON
                            </span>
                            {t('admin.config.data_mgmt.download')}
                        </button>
                        <button
                            onClick={() => handleBackup('sql')}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors border border-slate-600 flex items-center gap-2 text-sm"
                        >
                            <span className="text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-blue-400">
                                SQL
                            </span>
                            {t('admin.config.data_mgmt.download_sql')}
                        </button>
                        <button
                            onClick={() => handleBackup('full')}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors border border-slate-600 flex items-center gap-2 text-sm"
                        >
                            <span className="text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-indigo-400">
                                ZIP
                            </span>
                            {t('admin.config.data_mgmt.download_full')}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-6 mt-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                        {t('admin.config.data_mgmt.restore_title')}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-xs">
                        {t('admin.config.data_mgmt.restore_desc')}
                    </p>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".json,.zip,.sql"
                            className="hidden"
                            id="restore-upload"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (
                                    !confirm(
                                        t(
                                            'admin.config.data_mgmt.restore_confirm',
                                            { filename: file.name }
                                        )
                                    )
                                ) {
                                    e.target.value = '';
                                    return;
                                }

                                const formData = new FormData();
                                formData.append('file', file);

                                setRestoring(true); // Start Spinner

                                try {
                                    const res = await fetch(
                                        '/api/admin/restore',
                                        {
                                            method: 'POST',
                                            headers: {
                                                'X-User-Name':
                                                    currentUser.username,
                                            },
                                            body: formData,
                                        }
                                    );
                                    const data = await res.json();
                                    if (res.ok) {
                                        alert(data.message);
                                        window.location.reload();
                                    } else {
                                        alert('Restore Failed: ' + data.error);
                                    }
                                } catch (err) {
                                    alert('Network Error');
                                } finally {
                                    setRestoring(false); // Stop Spinner
                                }
                                e.target.value = '';
                            }}
                        />
                        <label
                            htmlFor="restore-upload"
                            className="bg-red-900/50 hover:bg-red-900/70 text-red-100 font-bold py-2 px-6 rounded-lg transition-colors border border-red-800 cursor-pointer flex items-center gap-2"
                        >
                            {t('admin.config.data_mgmt.upload')}
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectorManager: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const { t } = useTranslation();
    const [sectors, setSectors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSector, setEditingSector] = useState<string | null>(null);
    const [newSectorName, setNewSectorName] = useState('');
    const [addSectorName, setAddSectorName] = useState('');

    const fetchSectors = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sectors');
            if (res.ok) {
                const data = await res.json();
                setSectors(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSectors();
    }, []);

    const handleAdd = async () => {
        if (!addSectorName.trim()) return;
        try {
            const res = await fetch('/api/sectors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username,
                },
                body: JSON.stringify({ name: addSectorName.trim() }),
            });
            if (res.ok) {
                setAddSectorName('');
                fetchSectors();
            } else {
                const err = await res.json();
                alert(`Failed to add sector: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error');
        }
    };

    const handleDelete = async (sectorName: string) => {
        if (!confirm(t('admin.sectors.confirm_delete', { sectorName }))) return;

        try {
            const res = await fetch(
                `/api/sectors/${encodeURIComponent(sectorName)}`,
                {
                    method: 'DELETE',
                    headers: { 'X-User-Name': currentUser.username },
                }
            );
            if (res.ok) {
                setSectors((prev) => prev.filter((s) => s !== sectorName));
            } else {
                const err = await res.json();
                alert(`Cannot delete: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error');
        }
    };

    const handleUpdate = async () => {
        if (!editingSector || !newSectorName.trim()) return;
        if (newSectorName === editingSector) {
            setEditingSector(null);
            return;
        }

        if (
            !confirm(
                t('admin.sectors.confirm_rename', {
                    editingSector,
                    newSectorName,
                })
            )
        )
            return;

        try {
            const res = await fetch(
                `/api/sectors/${encodeURIComponent(editingSector)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Name': currentUser.username,
                    },
                    body: JSON.stringify({ newName: newSectorName }),
                }
            );

            if (res.ok) {
                // Refresh list or optimistic update
                setEditingSector(null);
                setNewSectorName('');
                fetchSectors();
            } else {
                const err = await res.json();
                alert(`Update failed: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading)
        return (
            <div className="text-slate-400">{t('admin.sectors.loading')}</div>
        );

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">
                {t('admin.sectors.title')}
            </h2>
            <p className="text-slate-400 mb-6">{t('admin.sectors.desc')}</p>

            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder={t('admin.sectors.add_placeholder')}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-md"
                    value={addSectorName}
                    onChange={(e) => setAddSectorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                    onClick={handleAdd}
                    disabled={!addSectorName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-xl transition-colors"
                >
                    {t('admin.sectors.add_btn')}
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-700">
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">
                                {t('admin.sectors.table.header_name')}
                            </th>
                            <th className="px-6 py-4 text-right">
                                {t('admin.sectors.table.header_actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sectors.map((sector, index) => (
                            <tr
                                key={`${sector}-${index}`}
                                className="hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="px-6 py-4 font-medium text-white">
                                    {editingSector === sector ? (
                                        <div className="flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                value={newSectorName}
                                                onChange={(e) =>
                                                    setNewSectorName(
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter')
                                                        handleUpdate();
                                                    if (e.key === 'Escape')
                                                        setEditingSector(null);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        sector
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-3">
                                    {editingSector === sector ? (
                                        <>
                                            <button
                                                onClick={handleUpdate}
                                                className="text-green-400 hover:text-green-300 text-sm font-bold"
                                            >
                                                {t('common.save')}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setEditingSector(null)
                                                }
                                                className="text-slate-500 hover:text-slate-400 text-sm"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingSector(sector);
                                                    setNewSectorName(sector);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(sector)
                                                }
                                                className="text-red-400 hover:text-red-300 text-sm font-medium"
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sectors.length === 0 && (
                            <tr>
                                <td
                                    colSpan={2}
                                    className="px-6 py-8 text-center text-slate-500"
                                >
                                    {t('admin.sectors.table.no_sectors')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-xs text-slate-500">
                {t('admin.sectors.tip')}
            </div>
        </div>
    );
};

const SystemLogs: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/logs', {
                headers: { 'X-User-Name': currentUser.username },
            });
            if (res.ok) {
                const text = await res.text();
                setLogs(text);
            } else {
                setLogs(t('admin.logs.load_failed'));
            }
        } catch (e) {
            setLogs(t('admin.logs.network_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {t('admin.logs.title')}
                    </h2>
                    <p className="text-slate-400">{t('admin.logs.desc')}</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    title={t('admin.logs.refresh_tooltip')}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>
            </div>

            <div className="bg-black/50 rounded-xl border border-slate-800 p-4 font-mono text-xs text-green-400 h-[600px] overflow-auto whitespace-pre-wrap">
                {loading
                    ? t('admin.logs.loading')
                    : logs || t('admin.logs.no_logs')}
            </div>
        </div>
    );
};

export default AdminSettings;

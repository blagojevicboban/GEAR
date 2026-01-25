import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HelpPageProps {
    onStartTour?: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onStartTour }) => {
    const { t } = useTranslation();
    const [xrSupported, setXrSupported] = useState<boolean | null>(null);
    const [isSecure, setIsSecure] = useState<boolean>(false);
    const [browserName, setBrowserName] = useState<string>('');

    useEffect(() => {
        // Check Secure Context (HTTPS or localhost)
        // Fallback to checking protocol if isSecureContext is false but protocol is https
        const isHttps = window.location.protocol === 'https:';
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setIsSecure(window.isSecureContext || isHttps || isLocal);

        // Check Browser Name
        const userAgent = navigator.userAgent;
        if (userAgent.match(/OculusBrowser/i)) {
            setBrowserName('Meta Quest Browser');
        } else if (userAgent.match(/Chrome/i)) {
            setBrowserName('Chrome / Chromium');
        } else if (userAgent.match(/Firefox/i)) {
            setBrowserName('Firefox');
        } else if (userAgent.match(/Safari/i)) {
            setBrowserName('Safari');
        } else {
            setBrowserName('Unknown Browser');
        }

        // Check WebXR Support
        if ('xr' in navigator) {
            // @ts-ignore
            navigator.xr.isSessionSupported('immersive-vr')
                .then((supported: boolean) => setXrSupported(supported))
                .catch(() => setXrSupported(false));
        } else {
            setXrSupported(false);
        }
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {t('help.title')}
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                    {t('help.subtitle')}
                </p>
                {onStartTour && (
                    <button
                        onClick={onStartTour}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 flex items-center gap-2 mx-auto"
                    >
                        <span>🎬</span> {t('help.start_tour')}
                    </button>
                )}
            </div>

            <div className="space-y-12">
                {/* Section 0: System Diagnostics */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">🩺</span>
                        {t('help.diagnostics.title')}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-xl border ${isSecure ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${isSecure ? 'text-emerald-400' : 'text-rose-400'}`}>{t('help.diagnostics.connection')}</span>
                                <span>{isSecure ? '✅' : '❌'}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {isSecure ? t('help.diagnostics.secure') : t('help.diagnostics.insecure')}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${xrSupported ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${xrSupported ? 'text-emerald-400' : 'text-amber-400'}`}>{t('help.diagnostics.webxr')}</span>
                                <span>{xrSupported ? '✅' : '⚠️'}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {xrSupported === true && t('help.diagnostics.supported')}
                                {xrSupported === false && t('help.diagnostics.not_detected')}
                                {xrSupported === null && t('help.diagnostics.checking')}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border bg-slate-800/50 border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-300">{t('help.diagnostics.browser')}</span>
                                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{browserName}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {browserName === 'Meta Quest Browser' ? t('help.diagnostics.optimized') : t('help.diagnostics.meta_quest_tip')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 1: Quick Start (VR) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">🥽</span>
                        {t('help.sections.vr_start.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="tex-lg font-bold text-indigo-400">{t('help.sections.vr_start.requirements')}</h3>
                            <ul className="list-disc list-inside text-slate-400 space-y-2">
                                {(t('help.sections.vr_start.req_list', { returnObjects: true }) as string[]).map((req, i) => (
                                    <li key={i}>{req}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="tex-lg font-bold text-indigo-400">{t('help.sections.vr_start.how_to')}</h3>
                            <ol className="list-decimal list-inside text-slate-400 space-y-2">
                                {(t('help.sections.vr_start.how_list', { returnObjects: true }) as string[]).map((step, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{ __html: step.replace('the-gear.app', '<strong>the-gear.app</strong>').replace('Enter VR', `<span className="text-white px-2 py-0.5 bg-indigo-600 rounded text-xs">${t('help.sections.vr_start.enter_vr')}</span>`) }}></li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Section 2: Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">🎮</span>
                        {t('help.sections.controls.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-white mb-4">{t('help.sections.controls.desktop_title')}</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-start gap-2">
                                    {t('help.sections.controls.desktop_list.rotate')}
                                </li>
                                <li className="flex items-start gap-2">
                                    {t('help.sections.controls.desktop_list.pan')}
                                </li>
                                <li className="flex items-start gap-2">
                                    {t('help.sections.controls.desktop_list.zoom')}
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">{t('help.sections.controls.vr_title')}</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-start gap-2">
                                    {t('help.sections.controls.vr_list.move')}
                                </li>
                                <li className="flex items-start gap-2">
                                    {t('help.sections.controls.vr_list.grab')}
                                </li>
                                <li className="flex items-start gap-2">
                                    {t('help.sections.controls.vr_list.interact')}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 3: User Roles & Features */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">👥</span>
                        {t('help.sections.features.title')}
                    </h2>
                    <div className="space-y-6 text-slate-400">
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.features.students_title')}</strong>
                            {t('help.sections.features.students_desc')}
                        </div>
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.features.teachers_title')}</strong>
                            {t('help.sections.features.teachers_desc')}
                        </div>
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.features.workshops_title')}</strong>
                            {t('help.sections.features.workshops_desc')}
                        </div>
                    </div>
                </div>

                {/* Section 4: Gamified Learning */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">🎓</span>
                        {t('help.sections.learning.title')}
                    </h2>
                    <div className="space-y-6 text-slate-400">
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.learning.academy_title')}</strong>
                            {t('help.sections.learning.academy_desc')}
                        </div>
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.learning.lessons_title')}</strong>
                            {t('help.sections.learning.lessons_desc')}
                        </div>
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.learning.challenges_title')}</strong>
                            {t('help.sections.learning.challenges_desc')}
                        </div>
                    </div>
                </div>

                {/* Section 5: AI & Optimization */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">✨</span>
                        {t('help.sections.ai.title')}
                    </h2>
                    <div className="space-y-6 text-slate-400">
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.ai.opt_title')}</strong>
                            {t('help.sections.ai.opt_desc')}
                        </div>
                        <div>
                            <strong className="text-white block mb-1">{t('help.sections.ai.verdict_title')}</strong>
                            {t('help.sections.ai.verdict_desc')}
                        </div>
                    </div>
                </div>

                {/* Section 6: Offline & Installation */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">📱</span>
                        {t('help.sections.install.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-white mb-4">{t('help.sections.install.how_title')}</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-start gap-2">
                                    {t('help.sections.install.desktop_inst')}
                                </li>
                                <li className="flex items-start gap-2">
                                    {t('help.sections.install.android_inst')}
                                </li>
                                <li className="flex items-start gap-2">
                                    {t('help.sections.install.ios_inst')}
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">{t('help.sections.install.offline_title')}</h3>
                            <p className="text-slate-400 mb-4">
                                {t('help.sections.install.offline_desc')}
                            </p>
                            <ul className="list-disc list-inside text-slate-400 space-y-2">
                                {(t('help.sections.install.offline_list', { returnObjects: true }) as string[]).map((cap, i) => (
                                    <li key={i}>{cap}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-slate-500 mb-4">{t('help.footer.questions')}</p>
                    <a href="mailto:support@thegear.app" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                        {t('help.footer.contact')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;

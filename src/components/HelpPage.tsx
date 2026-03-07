import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

interface HelpPageProps {
    onStartTour?: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onStartTour }) => {
    const { t } = useTranslation();
    const [xrSupported, setXrSupported] = useState<boolean | null>(null);
    const [isSecure] = useState<boolean>(() => {
        const isHttps = window.location.protocol === 'https:';
        const isLocal =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        return window.isSecureContext || isHttps || isLocal;
    });
    const [browserName, setBrowserName] = useState<string>('');

    useEffect(() => {
        // Check Secure Context (Moved to state init)

        // Check Browser Name
        const userAgent = navigator.userAgent;
        if (userAgent.match(/OculusBrowser/i)) {
            setBrowserName('Meta Quest Browser'); // eslint-disable-line react-hooks/set-state-in-effect
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
            (navigator as any).xr
                .isSessionSupported('immersive-vr')
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
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                    {t('help.subtitle')}
                </p>
                {onStartTour && (
                        <button
                            onClick={onStartTour}
                            className="px-8 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 flex items-center gap-2 mx-auto"
                        >
                            <span>🎬</span> {t('help.start_tour')}
                        </button>
                )}
            </div>

            <div className="space-y-12">
                {/* Section 0: System Diagnostics */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                            🩺
                        </span>
                        {t('help.diagnostics.title')}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div
                            className={`p-4 rounded-xl border ${isSecure ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span
                                    className={`font-bold ${isSecure ? 'text-emerald-400' : 'text-rose-400'}`}
                                >
                                    {t('help.diagnostics.connection')}
                                </span>
                                <span>{isSecure ? '✅' : '❌'}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {isSecure
                                    ? t('help.diagnostics.secure')
                                    : t('help.diagnostics.insecure')}
                            </p>
                        </div>

                        <div
                            className={`p-4 rounded-xl border ${xrSupported ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span
                                    className={`font-bold ${xrSupported ? 'text-emerald-400' : 'text-amber-400'}`}
                                >
                                    {t('help.diagnostics.webxr')}
                                </span>
                                <span>{xrSupported ? '✅' : '⚠️'}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {xrSupported === true &&
                                    t('help.diagnostics.supported')}
                                {xrSupported === false &&
                                    t('help.diagnostics.not_detected')}
                                {xrSupported === null &&
                                    t('help.diagnostics.checking')}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {t('help.diagnostics.browser')}
                                </span>
                                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                    {browserName}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {browserName === 'Meta Quest Browser'
                                    ? t('help.diagnostics.optimized')
                                    : t('help.diagnostics.meta_quest_tip')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 1: Quick Start (VR) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            🥽
                        </span>
                        {t('help.sections.vr_start.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {t('help.sections.vr_start.requirements')}
                            </h3>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-3">
                                {(
                                    t('help.sections.vr_start.req_list', {
                                        returnObjects: true,
                                    }) as string[]
                                ).map((req, i) => (
                                    <li key={i}>{req}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {t('help.sections.vr_start.how_to')}
                            </h3>
                            <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-3">
                                {(
                                    t('help.sections.vr_start.how_list', {
                                        returnObjects: true,
                                    }) as string[]
                                ).map((step, i) => (
                                    <li
                                        key={i}
                                        dangerouslySetInnerHTML={{
                                            __html: step
                                                .replace(
                                                    'the-gear.app',
                                                    '<strong>the-gear.app</strong>'
                                                )
                                                .replace(
                                                    'Enter VR',
                                                    `<span class="text-white px-2 py-0.5 bg-indigo-600 rounded text-xs mx-1 font-bold">${t('help.sections.vr_start.enter_vr')}</span>`
                                                ),
                                        }}
                                    ></li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Section 1a: Text-to-Speech */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl mt-8 transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            🔊
                        </span>
                        {t('help.sections.tts.title')}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        {t('help.sections.tts.description')}
                    </p>
                    <ul className="grid md:grid-cols-3 gap-4">
                        {[
                            t('help.sections.tts.list.tasks'),
                            t('help.sections.tts.list.hotspots'),
                            t('help.sections.tts.list.languages'),
                        ].map((item, i) => (
                            <li key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-3">
                                <span className="text-indigo-500 font-bold">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Section 2: Controls */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            🎮
                        </span>
                        {t('help.sections.controls.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                <span className="text-indigo-500">💻</span> {t('help.sections.controls.desktop_title')}
                            </h3>
                            <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-bold text-indigo-500">🖱️</span>
                                    {t('help.sections.controls.desktop_list.rotate')}
                                </li>
                                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-bold text-indigo-500">✋</span>
                                    {t('help.sections.controls.desktop_list.pan')}
                                </li>
                                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-bold text-indigo-500">🔍</span>
                                    {t('help.sections.controls.desktop_list.zoom')}
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                <span className="text-indigo-500">🥽</span> {t('help.sections.controls.vr_title')}
                            </h3>
                            <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-bold text-indigo-500">🚶</span>
                                    {t('help.sections.controls.vr_list.move')}
                                </li>
                                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-bold text-indigo-500">✊</span>
                                    {t('help.sections.controls.vr_list.grab')}
                                </li>
                                <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <span className="font-bold text-indigo-500">✨</span>
                                    {t('help.sections.controls.vr_list.interact')}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 3: User Roles & Features */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            👥
                        </span>
                        {t('help.sections.features.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                        {[
                            { title: t('help.sections.features.students_title'), desc: t('help.sections.features.students_desc') },
                            { title: t('help.sections.features.teachers_title'), desc: t('help.sections.features.teachers_desc') },
                            { title: t('help.sections.features.workshops_title'), desc: t('help.sections.features.workshops_desc') },
                            { title: t('help.sections.features.sync_title'), desc: t('help.sections.features.sync_desc') },
                            { title: t('help.sections.features.exploded_title'), desc: t('help.sections.features.exploded_desc') },
                            { title: t('help.sections.features.gaze_title'), desc: t('help.sections.features.gaze_desc') },
                        ].map((feature, i) => (
                            <div key={i} className="group">
                                <strong className="text-slate-900 dark:text-white block mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {feature.title}
                                </strong>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: Gamified Learning */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-600/20">
                            🎓
                        </span>
                        {t('help.sections.learning.title')}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: t('help.sections.learning.academy_title'), desc: t('help.sections.learning.academy_desc'), icon: '📚' },
                            { title: t('help.sections.learning.lessons_title'), desc: t('help.sections.learning.lessons_desc'), icon: '📝' },
                            { title: t('help.sections.learning.challenges_title'), desc: t('help.sections.learning.challenges_desc'), icon: '🏆' },
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/50 transition-all group">
                                <div className="text-2xl mb-4 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
                                <strong className="text-slate-900 dark:text-white block mb-2 group-hover:text-emerald-500 transition-colors">
                                    {item.title}
                                </strong>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 5: Workbook Builder & Interactive Quizzes */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            🏗️
                        </span>
                        {t('help.sections.builder.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <strong className="text-slate-900 dark:text-white block mb-2 text-lg">
                                    {t('help.sections.builder.creation_title')}
                                </strong>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {t('help.sections.builder.creation_desc')}
                                </p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-2xl italic text-sm text-indigo-700 dark:text-indigo-300 shadow-sm transition-colors">
                                <span className="font-bold flex items-center gap-2 mb-1 not-italic opacity-70">💡 Tip</span>
                                {t('help.sections.builder.image_tip')}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                            <strong className="text-slate-900 dark:text-white block mb-4 text-sm uppercase tracking-widest opacity-70">
                                {t('help.sections.builder.interaction_types')}
                            </strong>
                            <ul className="space-y-4">
                                {[
                                    { emoji: '📖', text: t('help.sections.builder.read_desc') },
                                    { emoji: '🧩', text: t('help.sections.builder.find_part_desc') },
                                    { emoji: '❓', text: t('help.sections.builder.quiz_desc') },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                        <span className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm text-base">{item.emoji}</span>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 5: AI & Optimization */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-xl shadow-lg shadow-purple-600/20">
                            ✨
                        </span>
                        {t('help.sections.ai.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="group">
                            <strong className="text-slate-900 dark:text-white block mb-3 text-lg group-hover:text-purple-500 transition-colors">
                                {t('help.sections.ai.opt_title')}
                            </strong>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                {t('help.sections.ai.opt_desc')}
                            </p>
                        </div>
                        <div className="group">
                            <strong className="text-slate-900 dark:text-white block mb-3 text-lg group-hover:text-purple-500 transition-colors">
                                {t('help.sections.ai.verdict_title')}
                            </strong>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                {t('help.sections.ai.verdict_desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section: Materials Engine */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                            🎨
                        </span>
                        {t('materials.title')}
                    </h2>
                    <div className="space-y-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: t('materials.desc_title'), desc: t('materials.desc'), accent: 'bg-orange-600', text: 'text-orange-600' },
                                { title: t('materials.calculator_title'), desc: t('materials.calculator_desc'), accent: 'bg-teal-600', text: 'text-teal-600' },
                                { title: t('materials.ar_vr'), desc: t('materials.ar_desc'), accent: 'bg-purple-600', text: 'text-purple-600' },
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <strong className={`${item.text} block mb-1 uppercase text-xs tracking-wider transition-colors`}>
                                        {item.title}
                                    </strong>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm transition-colors">
                            <strong className="text-slate-900 dark:text-white font-bold inline-flex items-center gap-2 mb-1">
                                <span className="text-lg">💡</span> {t('materials.usage')}
                            </strong>
                        </p>
                    </div>
                </div>

                {/* Section 6: 3D Analytics & Heatmaps */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-xl shadow-lg shadow-rose-600/20">
                            📊
                        </span>
                        {t('help.sections.analytics.title')}
                    </h2>
                    <div className="space-y-8">
                        <p className="text-sm border-l-4 border-rose-500 pl-4 bg-rose-50 dark:bg-rose-900/10 p-4 rounded-r-2xl text-slate-700 dark:text-slate-300 shadow-sm transition-colors">
                            <strong className="text-rose-600 dark:text-rose-400 block mb-1 text-base">
                                {t('help.sections.analytics.note_teacher')}
                            </strong>{' '}
                            {t('help.sections.analytics.note_desc')}
                        </p>
                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="group">
                                <strong className="text-slate-900 dark:text-white block mb-3 text-lg group-hover:text-rose-500 transition-colors">
                                    {t('help.sections.analytics.how_works_title')}
                                </strong>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {t('help.sections.analytics.how_works_desc')}
                                </p>
                            </div>
                            <div className="group">
                                <strong className="text-slate-900 dark:text-white block mb-3 text-lg group-hover:text-rose-500 transition-colors">
                                    {t('help.sections.analytics.viewing_title')}
                                </strong>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {t('help.sections.analytics.viewing_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 7: LMS Integration (LTI 1.3) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-xl shadow-lg shadow-orange-600/20">
                            🏫
                        </span>
                        {t('help.sections.lti.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-4">
                                {t('help.sections.lti.seamless_title')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                {t('help.sections.lti.seamless_desc')}
                            </p>
                            <ul className="space-y-3">
                                {[
                                    t('help.sections.lti.no_accounts'),
                                    t('help.sections.lti.role_mapping'),
                                    t('help.sections.lti.secure_access'),
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
                            <h3 className="font-bold text-orange-400 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Settings className="w-4 h-4" /> {t('help.sections.lti.admin_title')}
                            </h3>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                                {t('help.sections.lti.admin_desc')}
                            </p>
                            <div className="space-y-3 font-mono text-[10px]">
                                {[
                                    { label: t('help.sections.lti.login_url'), value: '/lti/login' },
                                    { label: t('help.sections.lti.launch_url'), value: '/lti/launch' },
                                    { label: t('help.sections.lti.keys_url'), value: '/lti/keys' },
                                ].map((url, i) => (
                                    <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors group">
                                        <span className="text-slate-400 group-hover:text-orange-400/70 transition-colors">{url.label}:</span>
                                        <span className="text-orange-400 select-all font-bold">{url.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Erasmus+ Evidence */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            📜
                        </span>
                        {t('evidence.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-blue-400 mb-4">
                                {t('evidence.subtitle')}
                            </h3>
                            <p className="text-slate-400 mb-4">
                                {t('evidence.desc')}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 justify-center">
                            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-75">
                                🔒 {t('evidence.generate_btn')}
                            </button>
                            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-75">
                                🔒 {t('evidence.download_btn')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 6: Offline & Installation */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                            📱
                        </span>
                        {t('help.sections.install.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-white mb-4">
                                {t('help.sections.install.how_title')}
                            </h3>
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
                            <h3 className="font-bold text-white mb-4">
                                {t('help.sections.install.offline_title')}
                            </h3>
                            <p className="text-slate-400 mb-4">
                                {t('help.sections.install.offline_desc')}
                            </p>
                            <ul className="list-disc list-inside text-slate-400 space-y-2">
                                {(
                                    t('help.sections.install.offline_list', {
                                        returnObjects: true,
                                    }) as string[]
                                ).map((cap, i) => (
                                    <li key={i}>{cap}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 7: Platform Administration (v2.2) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            ⚙️
                        </span>
                        {t('help.sections.admin.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-lg mb-4">
                                {t('help.sections.admin.config_title')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                {t('help.sections.admin.config_desc')}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <ul className="grid gap-4">
                                {(
                                    t('help.sections.admin.features', {
                                         returnObjects: true,
                                     }) as string[]
                                ).map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-4 text-slate-600 dark:text-slate-300 text-sm font-medium group"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 8: Localization (v2.5) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-colors">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                            🌍
                        </span>
                        {t('help.sections.translations.title')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-lg mb-4">
                                {t('help.sections.translations.subtitle')}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                {t('help.sections.translations.desc')}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <ul className="grid gap-4">
                                {(
                                    t('help.sections.translations.features', {
                                         returnObjects: true,
                                     }) as string[]
                                ).map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-4 text-slate-600 dark:text-slate-300 text-sm font-medium group"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>


                <div className="text-center pt-8">
                    <p className="text-slate-500 mb-4">
                        {t('help.footer.questions')}
                    </p>
                    <a
                        href="mailto:support@thegear.app"
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                        {t('help.footer.contact')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;

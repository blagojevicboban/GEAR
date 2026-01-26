import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fixAssetUrl } from '../utils/urlUtils';
import { Clock, CheckCircle, Search } from 'lucide-react';
import HeatmapViewer from './HeatmapViewer';
import { VETModel } from '../types';

interface AttemptStat {
    lessonId: string;
    lessonTitle: string;
    status: 'started' | 'completed';
    score: number;
    started_at: string;
    completed_at: string | null;
    studentName: string;
    studentPic: string;
}

const TeacherDashboard: React.FC<{ currentUser: any, models?: VETModel[] }> = ({ currentUser, models = [] }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<AttemptStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
    const [selectedModelForHeatmap, setSelectedModelForHeatmap] = useState<VETModel | null>(null);

    useEffect(() => {
        fetch('/api/teacher/stats', {
            headers: { 'X-User-Name': currentUser.username }
        })
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [currentUser]);

    const filteredStats = stats.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    if (loading) return <div className="p-10 text-center text-slate-400">{t('teacher.dashboard.loading')}</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 text-slate-200">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('teacher.dashboard.title')}</h1>
                    <p className="text-slate-400">{t('teacher.dashboard.subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        3D Analytics 🚀
                    </button>
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    <div className="flex justify-end mb-6">
                        <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                            <div className="text-center px-4 border-r border-slate-700">
                                <div className="text-xl font-bold text-white">{stats.length}</div>
                                <div className="text-xs text-slate-500 uppercase">{t('teacher.dashboard.attempts')}</div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-xl font-bold text-emerald-400">
                                    {stats.filter(s => s.status === 'completed').length}
                                </div>
                                <div className="text-xs text-slate-500 uppercase">{t('teacher.dashboard.completed')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder={t('teacher.dashboard.search_placeholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Stats Table */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">{t('teacher.dashboard.table.student')}</th>
                                        <th className="p-4 font-semibold">{t('teacher.dashboard.table.lesson')}</th>
                                        <th className="p-4 font-semibold">{t('teacher.dashboard.table.status')}</th>
                                        <th className="p-4 font-semibold">{t('teacher.dashboard.table.score')}</th>
                                        <th className="p-4 font-semibold">{t('teacher.dashboard.table.started')}</th>
                                        <th className="p-4 font-semibold">{t('teacher.dashboard.table.completed')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredStats.length > 0 ? (
                                        filteredStats.map((stat, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 flex items-center gap-3">
                                                    {stat.studentPic ? (
                                                        <img src={fixAssetUrl(stat.studentPic)} className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                            {stat.studentName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-white">{stat.studentName}</span>
                                                </td>
                                                <td className="p-4 text-slate-300">{stat.lessonTitle}</td>
                                                <td className="p-4">
                                                    {stat.status === 'completed' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                            <CheckCircle size={12} /> {t('teacher.dashboard.completed')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                                                            <Clock size={12} /> {t('teacher.dashboard.in_progress')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-mono text-slate-300">
                                                    {stat.score > 0 ? stat.score : '-'}
                                                </td>
                                                <td className="p-4 text-slate-500 text-sm whitespace-nowrap">
                                                    {formatDate(stat.started_at)}
                                                </td>
                                                <td className="p-4 text-slate-500 text-sm whitespace-nowrap">
                                                    {stat.completed_at ? formatDate(stat.completed_at) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                                {t('teacher.dashboard.no_stats')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    {!selectedModelForHeatmap ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {models.filter(m => currentUser.role === 'admin' || m.uploadedBy === currentUser.username).map(model => (
                                <div
                                    key={model.id}
                                    onClick={() => setSelectedModelForHeatmap(model)}
                                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition-all hover:bg-slate-800 group"
                                >
                                    <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative">
                                        {model.thumbnailUrl ? (
                                            <img src={fixAssetUrl(model.thumbnailUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">No Preview</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                                            <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded">View Heatmap</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white truncate">{model.name}</h3>
                                    <p className="text-xs text-slate-500">{model.sector}</p>
                                </div>
                            ))}
                            {models.length === 0 && <div className="text-slate-500 col-span-3 text-center">No models available for analytics.</div>}
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={() => setSelectedModelForHeatmap(null)}
                                className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                            >
                                ← Back to Models
                            </button>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">Student Engagement Heatmap</h2>
                                    <div className="text-sm text-slate-400">Model: <span className="text-white font-bold">{selectedModelForHeatmap.name}</span></div>
                                </div>
                                <p className="text-sm text-slate-400 mb-6 max-w-2xl bg-slate-950 p-4 rounded-lg border border-slate-800">
                                    <span className="text-indigo-400 font-bold">ℹ️ How it works:</span> Red dots represent points on the model where students spent time looking or hovering during VR/3D sessions. Density indicates higher engagement.
                                </p>
                                <HeatmapViewer model={selectedModelForHeatmap} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;

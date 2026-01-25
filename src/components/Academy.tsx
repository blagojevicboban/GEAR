import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface AcademyProps {
    currentUser?: User | null;
}

const Academy: React.FC<AcademyProps> = ({ currentUser }) => {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState<'basics' | 'creation' | 'pedagogy'>('basics');
    const [videos, setVideos] = useState<any>({ basics: [], creation: [], pedagogy: [] });
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // New/Edit Video Form
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newDuration, setNewDuration] = useState('00:00');

    useEffect(() => {
        fetch('/api/academy')
            .then(res => res.json())
            .then(data => setVideos(data))
            .catch(err => console.error(err));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm(t('academy.delete_confirm'))) return;
        try {
            await fetch(`/api/academy/${id}`, { method: 'DELETE' });
            const newVids = { ...videos };
            newVids[activeCategory] = newVids[activeCategory].filter((v: any) => v.id !== id);
            setVideos(newVids);
        } catch (e) { alert(t('builder.errors.save_failed')); }
    };

    const handleEdit = (video: any) => {
        setEditingId(video.id);
        setNewTitle(video.title);
        setNewDesc(video.desc);
        setNewUrl(video.url);
        setNewDuration(video.duration);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com/watch?v=')) {
            return url.replace('watch?v=', 'embed/').split('&')[0];
        }
        if (url.includes('youtu.be/')) {
            return url.replace('youtu.be/', 'youtube.com/embed/');
        }
        return url;
    };

    const handleSave = async () => {
        if (!newTitle || !newUrl) return alert(t('academy.form.title') + " & URL required");

        const finalUrl = getEmbedUrl(newUrl);

        const payload = {
            category: activeCategory,
            video: { title: newTitle, desc: newDesc, url: finalUrl, duration: newDuration }
        };

        try {
            let res;
            if (editingId) {
                // Update
                res = await fetch(`/api/academy/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-User-Name': currentUser?.username || '' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create
                res = await fetch('/api/academy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-User-Name': currentUser?.username || '' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                // Refetch all to be safe or optimize local state
                const freshData = await (await fetch('/api/academy')).json();
                setVideos(freshData);

                setNewTitle(''); setNewUrl(''); setNewDesc('');
            }
        } catch (e) { alert(t('builder.errors.save_failed')); }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewTitle(''); setNewUrl(''); setNewDesc('');
    };

    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{t('academy.title')} <span className="text-white text-sm bg-indigo-600 px-2 py-1 rounded ml-2 shadow-lg">BETA</span></h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    {t('academy.subtitle')}
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center gap-4 mb-12">
                {(['basics', 'creation', 'pedagogy'] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full font-bold capitalize transition-all ${activeCategory === cat
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-105'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {cat === 'basics' ? t('academy.basics') : cat === 'creation' ? t('academy.creation') : t('academy.pedagogy')}
                    </button>
                ))}
            </div>

            {isAdmin && !isAdding && (
                <div className="mb-8 flex justify-end">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        <Plus size={16} /> {t('academy.add_video')}
                    </button>
                </div>
            )}

            {/* Admin Add/Edit Form */}
            {isAdmin && isAdding && (
                <div className="mb-8 bg-slate-900 border border-slate-700 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-white mb-4">{editingId ? t('academy.edit_video') : t('academy.form.add_new', { category: t(`academy.${activeCategory}`) })}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input placeholder={t('academy.form.title')} value={newTitle} onChange={e => setNewTitle(e.target.value)} className="bg-slate-950 border border-slate-700 p-2 rounded text-white" />
                        <input placeholder={t('academy.form.duration')} value={newDuration} onChange={e => setNewDuration(e.target.value)} className="bg-slate-950 border border-slate-700 p-2 rounded text-white" />
                        <input placeholder={t('academy.form.url')} value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-slate-950 border border-slate-700 p-2 rounded text-white col-span-2" />
                        <textarea placeholder={t('academy.form.description')} value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-slate-950 border border-slate-700 p-2 rounded text-white col-span-2" rows={2} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold">{editingId ? t('academy.update_video') : t('academy.save_video')}</button>
                        <button onClick={handleCancel} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold">{t('common.cancel')}</button>
                    </div>
                </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos[activeCategory]?.length > 0 ? videos[activeCategory].map((video: any) => (
                    <div key={video.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors group relative">

                        {isAdmin && (
                            <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(video)}
                                    className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-500 shadow-md"
                                    title={t('academy.edit_video')}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(video.id)}
                                    className="bg-rose-600 text-white p-2 rounded-full hover:bg-rose-500 shadow-md"
                                    title={t('common.delete')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}

                        <div className="aspect-video relative bg-black">
                            <iframe
                                src={video.url}
                                title={video.title}
                                className="w-full h-full"
                                allowFullScreen
                                frameBorder="0"
                            ></iframe>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{video.title}</h3>
                                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">{video.duration}</span>
                            </div>
                            <p className="text-sm text-slate-500">{video.desc}</p>

                            <button className="mt-4 w-full py-2 bg-slate-800/50 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-sm font-bold transition-all border border-slate-700 hover:border-indigo-500">
                                {t('academy.mark_completed')}
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-3 text-center py-12 text-slate-500">
                        {t('academy.no_videos')}
                    </div>
                )}
            </div>

            {/* Certification Banner */}
            <div className="mt-16 p-8 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-bold mb-2">{t('academy.get_certified')}</h3>
                    <p className="text-slate-400">{t('academy.cert_desc')}</p>
                </div>
                <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                    {t('academy.check_progress')}
                </button>
            </div>
        </div>
    );
};

export default Academy;

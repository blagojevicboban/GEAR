import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lesson, User } from '../types';
import { BookOpen, Calendar, Plus, User as UserIcon } from 'lucide-react';
import { fixAssetUrl } from '../utils/urlUtils';

interface LessonsListProps {
    currentUser: User | null;
    onViewLesson: (lesson: Lesson) => void;
    onEditLesson: (lesson: Lesson) => void;
    onCreateLesson: () => void;
    onViewUser: (username: string) => void;
    initialAuthorFilter?: string; // Username
}

const LessonsList: React.FC<LessonsListProps> = ({ currentUser, onViewLesson, onEditLesson, onCreateLesson, onViewUser, initialAuthorFilter }) => {
    const { t } = useTranslation();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSector, setFilterSector] = useState<string>('All');
    const [sectors, setSectors] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/lessons')
            .then(res => res.json())
            .then(data => {
                let displayedLessons = data;
                if (initialAuthorFilter) {
                    displayedLessons = data.filter((l: Lesson) => l.authorName === initialAuthorFilter);
                }
                setLessons(displayedLessons);

                const uniqueSectors = Array.from(new Set(displayedLessons.map((l: Lesson) => l.sectorName || 'Other'))).filter(Boolean) as string[];
                setSectors(uniqueSectors);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [initialAuthorFilter]);

    const filteredLessons = filterSector === 'All'
        ? lessons
        : lessons.filter(l => (l.sectorName || 'Other') === filterSector);

    const canCreate = currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher');

    if (loading) return <div className="p-8 text-center text-slate-400">{t('lessons.loading')}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {t('lessons.list_title')}
                    </h1>
                    <p className="text-slate-400 mt-2">{t('lessons.list_subtitle')}</p>
                </div>

                {canCreate && (
                    <button
                        onClick={onCreateLesson}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        {t('lessons.create_btn')}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterSector('All')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterSector === 'All'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    {t('lessons.all_sectors')}
                </button>
                {sectors.map(sector => (
                    <button
                        key={sector}
                        onClick={() => setFilterSector(sector)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterSector === sector
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {sector}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map(lesson => (
                    <div
                        key={lesson.id}
                        className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col"
                    >
                        {lesson.image_url && (
                            <div className="h-40 w-full overflow-hidden relative">
                                <img
                                    src={lesson.image_url}
                                    alt={lesson.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                            </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-2 py-1 bg-slate-800 text-indigo-300 text-xs rounded uppercase tracking-wider font-semibold">
                                    {lesson.sectorName || t('lessons.general')}
                                </span>
                                {/* Actions */}
                                {currentUser && (currentUser.id === lesson.author_id || currentUser.role === 'admin') && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                                            className="text-slate-500 hover:text-white text-xs underline"
                                        >
                                            {t('lessons.edit_btn')}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(t('lessons.delete_confirm'))) {
                                                    fetch(`/api/lessons/${lesson.id}`, {
                                                        method: 'DELETE',
                                                        headers: {
                                                            'X-User-Name': currentUser.username
                                                        }
                                                    }).then(res => {
                                                        if (res.ok) {
                                                            setLessons(prev => prev.filter(l => l.id !== lesson.id));
                                                        } else {
                                                            res.json().then(err => alert(err.error));
                                                        }
                                                    }).catch(err => console.error(err));
                                                }
                                            }}
                                            className="text-slate-500 hover:text-rose-500 text-xs underline"
                                        >
                                            {t('lessons.delete_btn')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">
                                {lesson.title}
                            </h3>
                            <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">
                                {lesson.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (lesson.authorName) onViewUser(lesson.authorName); }}
                                    className="flex items-center gap-2 hover:text-indigo-400 transition-colors group/author"
                                >
                                    {lesson.authorPic ? (
                                        <img src={fixAssetUrl(lesson.authorPic)} alt={lesson.authorName} className="w-5 h-5 rounded-full object-cover border border-slate-700 group-hover/author:border-indigo-500" />
                                    ) : (
                                        <UserIcon size={14} />
                                    )}
                                    <span className="font-medium">{lesson.authorName || t('lessons.unknown')}</span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onViewLesson(lesson)}
                            className="w-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white py-3 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <BookOpen size={18} />
                            {t('lessons.start_btn')}
                        </button>
                    </div>
                ))}

                {filteredLessons.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        {t('lessons.no_lessons')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonsList;

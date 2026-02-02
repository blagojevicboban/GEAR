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

const LessonsList: React.FC<LessonsListProps> = ({
    currentUser,
    onViewLesson,
    onEditLesson,
    onCreateLesson,
    onViewUser,
    initialAuthorFilter,
}) => {
    const { t } = useTranslation();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSector, setFilterSector] = useState<string>('All');
    const [sectors, setSectors] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/lessons')
            .then((res) => res.json())
            .then((data) => {
                let displayedLessons = data;
                if (initialAuthorFilter) {
                    displayedLessons = data.filter(
                        (l: Lesson) => l.authorName === initialAuthorFilter
                    );
                }
                setLessons(displayedLessons);

                const uniqueSectors = Array.from(
                    new Set(
                        displayedLessons.map(
                            (l: Lesson) => l.sectorName || 'Other'
                        )
                    )
                ).filter(Boolean) as string[];
                setSectors(uniqueSectors);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [initialAuthorFilter]);

    const filteredLessons =
        filterSector === 'All'
            ? lessons
            : lessons.filter((l) => (l.sectorName || 'Other') === filterSector);

    const canCreate =
        currentUser &&
        (currentUser.role === 'admin' || currentUser.role === 'teacher');

    if (loading)
        return (
            <div className="p-8 text-center text-slate-400">
                {t('lessons.loading')}
            </div>
        );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {t('lessons.list_title')}
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {t('lessons.list_subtitle')}
                    </p>
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
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filterSector === 'All'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    {t('lessons.all_sectors')}
                </button>
                {sectors.map((sector) => (
                    <button
                        key={sector}
                        onClick={() => setFilterSector(sector)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                            filterSector === sector
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        {sector}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col"
                    >
                        <div className="h-40 w-full overflow-hidden relative group-hover:opacity-100">
                            {lesson.image_url ? (
                                <img
                                    src={fixAssetUrl(lesson.image_url)}
                                    alt={lesson.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <BookOpen size={48} className="text-slate-700" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>

                             {/* Edit Button */}
                            {currentUser && (currentUser.id === lesson.author_id || currentUser.role === 'admin') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditLesson(lesson);
                                    }}
                                    className="absolute top-2 right-2 bg-indigo-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500"
                                    title={t('lessons.edit_btn')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            )}

                            {/* Delete Button */}
                            {currentUser && (currentUser.id === lesson.author_id || currentUser.role === 'admin') && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(t('lessons.delete_confirm'))) {
                                            fetch(`/api/lessons/${lesson.id}`, {
                                                method: 'DELETE',
                                                headers: { 'X-User-Name': currentUser.username },
                                            })
                                            .then((res) => {
                                                if (res.ok) {
                                                    setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
                                                } else {
                                                    res.json().then((err) => alert(err.error));
                                                }
                                            })
                                            .catch((err) => console.error(err));
                                        }
                                    }}
                                    className="absolute top-12 right-2 bg-rose-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500"
                                    title={t('lessons.delete_btn')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-2 py-1 bg-slate-800 text-indigo-300 text-xs rounded uppercase tracking-wider font-semibold">
                                    {lesson.sectorName || t('lessons.general')}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">
                                {lesson.title}
                            </h3>
                            <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">
                                {lesson.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (lesson.authorName)
                                            onViewUser(lesson.authorName);
                                    }}
                                    className="flex items-center gap-2 hover:text-indigo-400 transition-colors group/author"
                                >
                                    {lesson.authorPic ? (
                                        <img
                                            src={fixAssetUrl(lesson.authorPic)}
                                            alt={lesson.authorName}
                                            className="w-5 h-5 rounded-full object-cover border border-slate-700 group-hover/author:border-indigo-500"
                                        />
                                    ) : (
                                        <UserIcon size={14} />
                                    )}
                                    <span className="font-medium">
                                        {lesson.authorName ||
                                            t('lessons.unknown')}
                                    </span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(
                                            lesson.created_at
                                        ).toLocaleDateString()}
                                    </span>
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

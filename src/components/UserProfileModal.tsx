import React, { useState, useEffect } from 'react';
import { User, VETModel, Lesson } from '../types';
import { BookOpen } from 'lucide-react';
import { fixAssetUrl } from '../utils/urlUtils';

interface UserProfileModalProps {
    username: string;
    models: VETModel[];
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ username, models, onClose }) => {
    const [user, setUser] = useState<User | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/users/public/${username}`).then(res => res.ok ? res.json() : null),
            fetch(`/api/lessons`).then(res => res.json())
        ]).then(([userData, allLessons]) => {
            if (!userData) throw new Error('User not found');
            setUser(userData);
            if (allLessons && Array.isArray(allLessons)) {
                setLessons(allLessons.filter((l: any) => l.authorName === username)); // We filter by authorName which is username in this app, or better match ID if possible.
                // But typically public profile uses username. Let's check if user object has ID.
                // The public user endpoint returns username.
                // Lesson object has authorName and author_id.
                // Safest to filter by username since we have it.
            }
        })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [username]);

    const getUserModels = () => {
        return models.filter(m => m.uploadedBy === username);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="text-white">Loading profile...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 p-6 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-white">User Profile</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                        <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0 overflow-hidden">
                            {user.profilePicUrl ? (
                                <img src={user.profilePicUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                user.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="space-y-4 flex-1">
                            <div>
                                <h4 className="text-3xl font-bold text-white mb-1">{user.username}</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                    user.role === 'teacher' ? 'bg-green-500/20 text-green-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email</p>
                                    <p>{user.email}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Institution</p>
                                    <p>{user.institution || 'Not specified'}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg col-span-1 md:col-span-2">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Bio</p>
                                    <p>{user.bio || 'No bio provided.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            Uploaded Models
                            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
                                {getUserModels().length}
                            </span>
                        </h4>

                        {getUserModels().length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getUserModels().map(model => (
                                    <div key={model.id} className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all">
                                        <div className="aspect-video bg-slate-900 relative">
                                            <img src={fixAssetUrl(model.thumbnailUrl)} alt={model.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                                <h5 className="font-bold truncate">{model.name}</h5>
                                                <p className="text-xs text-slate-400 truncate">{model.equipmentType}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed mb-10">
                                <p className="text-slate-500">No models uploaded by this user.</p>
                            </div>
                        )}
                    </div>

                    {/* Lessons Section */}
                    {lessons.length > 0 && (
                        <div className="mt-10 pt-10 border-t border-slate-800">
                            <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                Created Lessons
                                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
                                    {lessons.length}
                                </span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lessons.map(lesson => (
                                    <div key={lesson.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                                                {lesson.sectorName || 'General'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(lesson.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h5 className="font-bold text-white mb-2">{lesson.title}</h5>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{lesson.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <BookOpen size={14} />
                                            <span>{lesson.steps?.length || 0} Steps</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;

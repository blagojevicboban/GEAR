import React, { useState, useEffect } from 'react';
import { User, VETModel } from '../types';
import { fixAssetUrl } from '../utils/urlUtils';

interface UserProfileModalProps {
    username: string;
    models: VETModel[];
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ username, models, onClose }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/users/public/${username}`)
            .then(res => {
                if (!res.ok) throw new Error('User not found');
                return res.json();
            })
            .then(data => setUser(data))
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
                            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                                <p className="text-slate-500">No models uploaded by this user.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;

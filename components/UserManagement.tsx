import React, { useState, useEffect } from 'react';
import { User, VETModel } from '../types';
import { fixAssetUrl } from '../utils/urlUtils';

interface UserManagementProps {
    currentUser: User;
    models: VETModel[];
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, models }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', institution: '', role: 'student' });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users', {
                headers: {
                    'X-User-Name': currentUser.username
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': currentUser.username
                }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username
                },
                body: JSON.stringify({
                    role: editingUser.role,
                    institution: editingUser.institution
                })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
                setEditingUser(null);
            } else {
                alert('Failed to update user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username
                },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                const createdUser = await res.json();
                setUsers([...users, createdUser]);
                setShowCreateForm(false);
                setNewUser({ username: '', email: '', password: '', institution: '', role: 'student' });
            } else {
                const err = await res.json();
                alert(`Failed to create user: ${err.error}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getUserModels = (username: string) => {
        return models.filter(m => m.uploadedBy === username);
    };

    if (loading) return <div className="text-white text-center py-10">Loading users...</div>;

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
                        <p className="text-slate-400">Manage registered users and their permissions.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        + Add New User
                    </button>
                </div>

                {showCreateForm && (
                    <div className="mb-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-bold text-white mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                required
                                type="text"
                                placeholder="Username"
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            />
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            />
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Institution"
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                                value={newUser.institution}
                                onChange={e => setNewUser({ ...newUser, institution: e.target.value })}
                            />
                            <select
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl">Create</button>
                                <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                        <thead className="text-xs uppercase bg-slate-800 text-slate-400">
                            <tr>
                                <th className="px-6 py-3">Username</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Institution</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {editingUser?.id === user.id ? (
                                            <input
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-full"
                                                value={editingUser.institution || ''}
                                                onChange={e => setEditingUser({ ...editingUser, institution: e.target.value })}
                                            />
                                        ) : user.institution || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingUser?.id === user.id ? (
                                            <select
                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1"
                                                value={editingUser.role}
                                                onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                            >
                                                <option value="student">Student</option>
                                                <option value="teacher">Teacher</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                                                user.role === 'teacher' ? 'bg-green-500/10 text-green-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {editingUser?.id === user.id ? (
                                            <>
                                                <button onClick={handleUpdate} className="text-green-400 hover:text-green-300 font-bold text-sm">Save</button>
                                                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-300 text-sm">Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setViewingUser(user)} className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">View</button>
                                                <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300 font-bold text-sm">Edit</button>
                                                <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profile View Modal */}
            {viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
                        <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 p-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white">User Profile</h3>
                            <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                                <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0 overflow-hidden">
                                    {viewingUser.profilePicUrl ? (
                                        <img src={viewingUser.profilePicUrl} alt={viewingUser.username} className="w-full h-full object-cover" />
                                    ) : (
                                        viewingUser.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h4 className="text-3xl font-bold text-white mb-1">{viewingUser.username}</h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${viewingUser.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                            viewingUser.role === 'teacher' ? 'bg-green-500/20 text-green-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {viewingUser.role}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                                        <div className="bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email</p>
                                            <p>{viewingUser.email}</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Institution</p>
                                            <p>{viewingUser.institution || 'Not specified'}</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-lg col-span-1 md:col-span-2">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Bio</p>
                                            <p>{viewingUser.bio || 'No bio provided.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    Uploaded Models
                                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
                                        {getUserModels(viewingUser.username).length}
                                    </span>
                                </h4>

                                {getUserModels(viewingUser.username).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getUserModels(viewingUser.username).map(model => (
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
            )}
        </div>
    );
};

export default UserManagement;

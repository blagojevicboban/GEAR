import React, { useState, useEffect } from 'react';
import { User, VETModel } from '../types';
import UserManagement from './UserManagement';

interface AdminSettingsProps {
    currentUser: User;
    models: VETModel[];
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ currentUser, models }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'sectors' | 'logs' | 'config'>('users');

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* Header / Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-0 px-6 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-6">Admin Settings</h1>
                    <div className="flex gap-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${activeTab === 'users'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                        >
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('sectors')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${activeTab === 'sectors'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                        >
                            Sector Management
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${activeTab === 'config'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                        >
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-4 px-2 font-medium text-sm transition-all border-b-2 ${activeTab === 'logs'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                        >
                            System Logs
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <UserManagement currentUser={currentUser} models={models} />
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
            </div>
        </div>
    );
};

// --- Sub-components ---

const SystemConfig: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [config, setConfig] = useState({ maintenance_mode: 'false', global_announcement: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/config', { headers: { 'X-User-Name': currentUser.username } })
            .then(res => res.json())
            .then(data => {
                setConfig(prev => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(e => console.error(e));
    }, []);

    const handleSave = async () => {
        try {
            await fetch('/api/admin/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username
                },
                body: JSON.stringify(config)
            });
            alert('Settings saved successfully!');
        } catch (e) {
            alert('Failed to save settings.');
        }
    };

    const handleBackup = () => {
        // Trigger download
        const link = document.createElement('a');
        link.href = '/api/admin/backup';
        // Add header if needed? Browser handles GET. But we need Auth middleware check on GET? 
        // Our GET endpoint checks X-User-Name header. Browser navigation doesn't send custom headers easily.
        // Quick fix: Admin endpoint should check session or token. 
        // Since we rely on 'X-User-Name' for this prototype auth, we need to fetch and blob it.

        fetch('/api/admin/backup', { headers: { 'X-User-Name': currentUser.username } })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                link.href = url;
                link.download = `gear_backup_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
            })
            .catch(e => alert("Backup failed: " + e));
    };

    if (loading) return <div className="text-slate-400">Loading settings...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Global Settings</h2>

                <div className="space-y-6">
                    <div>
                        <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                            <div>
                                <span className="block font-bold text-white">Maintenance Mode</span>
                                <span className="text-xs text-slate-400">Block login for non-admin users.</span>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.maintenance_mode === 'true' ? 'bg-indigo-600' : 'bg-slate-600'}`} onClick={() => setConfig({ ...config, maintenance_mode: config.maintenance_mode === 'true' ? 'false' : 'true' })}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.maintenance_mode === 'true' ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Global Announcement</label>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl padding-4 text-white p-3 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Enter a message to be displayed on the top of the dashboard..."
                            value={config.global_announcement}
                            onChange={(e) => setConfig({ ...config, global_announcement: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl h-fit">
                <h2 className="text-2xl font-bold text-white mb-2">Data Management</h2>
                <p className="text-slate-400 mb-6">Backup your data regularly to prevent data loss.</p>

                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Export Database</h3>
                    <p className="text-sm text-slate-500 mb-6">Download a complete JSON dump of all tables.</p>
                    <button
                        onClick={handleBackup}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors border border-slate-600"
                    >
                        Download Backup
                    </button>
                </div>
            </div>
        </div>
    );
};

const SectorManager: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [sectors, setSectors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSector, setEditingSector] = useState<string | null>(null);
    const [newSectorName, setNewSectorName] = useState('');

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

    const handleDelete = async (sectorName: string) => {
        if (!confirm(`Are you sure you want to delete the sector "${sectorName}"? This is only possible if no models are using it.`)) return;

        try {
            const res = await fetch(`/api/sectors/${encodeURIComponent(sectorName)}`, {
                method: 'DELETE',
                headers: { 'X-User-Name': currentUser.username }
            });
            if (res.ok) {
                setSectors(prev => prev.filter(s => s !== sectorName));
            } else {
                const err = await res.json();
                alert(`Cannot delete: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error");
        }
    };

    const handleUpdate = async () => {
        if (!editingSector || !newSectorName.trim()) return;
        if (newSectorName === editingSector) {
            setEditingSector(null);
            return;
        }

        if (!confirm(`Rename "${editingSector}" to "${newSectorName}"? This will update all associated models.`)) return;

        try {
            const res = await fetch(`/api/sectors/${encodeURIComponent(editingSector)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username
                },
                body: JSON.stringify({ newName: newSectorName })
            });

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

    if (loading) return <div className="text-slate-400">Loading sectors...</div>;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Sector Management</h2>
            <p className="text-slate-400 mb-6">Manage the list of educational sectors. Rename to fix typos or consolidate categories.</p>

            <div className="overflow-hidden rounded-xl border border-slate-700">
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Sector Name</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sectors.map((sector, index) => (
                            <tr key={`${sector}-${index}`} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    {editingSector === sector ? (
                                        <div className="flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                value={newSectorName}
                                                onChange={e => setNewSectorName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleUpdate();
                                                    if (e.key === 'Escape') setEditingSector(null);
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
                                            <button onClick={handleUpdate} className="text-green-400 hover:text-green-300 text-sm font-bold">Save</button>
                                            <button onClick={() => setEditingSector(null)} className="text-slate-500 hover:text-slate-400 text-sm">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => { setEditingSector(sector); setNewSectorName(sector); }}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                            >
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sector)}
                                                className="text-red-400 hover:text-red-300 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {sectors.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">No custom sectors found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-xs text-slate-500">
                Tip: New sectors are automatically created when uploading models if they don't exist.
            </div>
        </div>
    );
};

const SystemLogs: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/logs', {
                headers: { 'X-User-Name': currentUser.username }
            });
            if (res.ok) {
                const text = await res.text();
                setLogs(text);
            } else {
                setLogs('Failed to load logs. You might not have permission.');
            }
        } catch (e) {
            setLogs('Network error loading logs.');
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
                    <h2 className="text-2xl font-bold text-white mb-1">System Logs</h2>
                    <p className="text-slate-400">View the last 100 lines of server error logs.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    title="Refresh Logs"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="bg-black/50 rounded-xl border border-slate-800 p-4 font-mono text-xs text-green-400 h-[600px] overflow-auto whitespace-pre-wrap">
                {loading ? 'Loading logs...' : (logs || 'No logs available.')}
            </div>
        </div>
    );
};

export default AdminSettings;

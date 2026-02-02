import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VETModel, User } from '../types';
import { Search, Trash2, Star, Download, ExternalLink, Box, Copy, Pencil, AlertTriangle, RefreshCw, Folder, File } from 'lucide-react';
import { fixAssetUrl } from '../utils/urlUtils';

interface LibraryManagerProps {
    currentUser: User;
    models: VETModel[];
    onDeleteModel: (id: string) => Promise<void>;
    onUpdateModel: (model: VETModel) => Promise<void>;
    onCloneModel: (id: string) => Promise<void>;
    onEditModel: (model: VETModel) => void;
}

const LibraryManager: React.FC<LibraryManagerProps> = ({
    currentUser,
    models,
    onDeleteModel,
    onUpdateModel,
    onCloneModel,
    onEditModel,
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSector, setSelectedSector] = useState('All');
    const [selectedUploader, setSelectedUploader] = useState('All');
    const [sortConfig] = useState<{
        key: keyof VETModel | 'date';
        direction: 'ascending' | 'descending';
    }>({ key: 'date', direction: 'descending' });

    // Filter and Sort
    const filteredModels = useMemo(() => {
        let items = [...models];

        // Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(
                (m) =>
                    m.name.toLowerCase().includes(lower) ||
                    m.uploadedBy.toLowerCase().includes(lower) ||
                    m.sector.toLowerCase().includes(lower)
            );
        }

        if (selectedSector !== 'All') {
            items = items.filter((m) => m.sector === selectedSector);
        }

        if (selectedUploader !== 'All') {
            items = items.filter((m) => m.uploadedBy === selectedUploader);
        }

        // Sort
        items.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof VETModel];
            let valB: any = b[sortConfig.key as keyof VETModel];

            // Special handling for date (createdAt might be missing on old models, implies newest)
            if (sortConfig.key === 'date') {
                valA = a.createdAt || '';
                valB = b.createdAt || '';
            }

            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return items;
    }, [models, searchTerm, selectedSector, selectedUploader, sortConfig]);

    // Derived lists for filters
    const sectors = useMemo(() => {
        const unique = Array.from(new Set(models.map((m) => m.sector)));
        return unique.sort();
    }, [models]);

    const uploaders = useMemo(() => {
        const unique = Array.from(new Set(models.map((m) => m.uploadedBy)));
        return unique.sort();
    }, [models]);

    const handleToggleFeatured = async (model: VETModel) => {
        try {
            const updatedModel = { ...model, isFeatured: !model.isFeatured };
            await onUpdateModel(updatedModel);
        } catch (error) {
            console.error('Failed to toggle featured status', error);
            alert(t('admin.settings.alerts.update_failed'));
        }
    };

    const handleDelete = async (model: VETModel) => {
        if (confirm(t('admin.library.confirm_delete', { name: model.name }))) {
            await onDeleteModel(model.id);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Orphans Logic
    const [orphans, setOrphans] = useState<any[]>([]);
    const [loadingOrphans, setLoadingOrphans] = useState(false);
    const [showOrphans, setShowOrphans] = useState(false);

    const loadOrphans = async () => {
        setLoadingOrphans(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/orphans', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'x-user-name': currentUser.username
                }
            });
            if (res.ok) {
                setOrphans(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOrphans(false);
        }
    };

    useEffect(() => {
        if (showOrphans) {
            loadOrphans();
        }
    }, [showOrphans]);

    const handleDeleteOrphan = async (name: string) => {
        if (!confirm(`Are you sure you want to delete orphan "${name}"? This cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/orphans/${encodeURIComponent(name)}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'x-user-name': currentUser.username 
                }
            });
            if (res.ok) {
                setOrphans(prev => prev.filter(o => o.name !== name));
            } else {
                alert('Failed to delete orphan');
            }
        } catch (e) { 
            console.error(e);
            alert('Error deleting orphan');
        }
    };

    const handleDeleteAllOrphans = async () => {
        if (!confirm('Are you sure you want to delete ALL orphan files? This operation is permanent and cannot be undone!')) return;
        
        setLoadingOrphans(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/orphans/all', {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'x-user-name': currentUser.username 
                }
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Successfully deleted ${data.count} orphans.`);
                setOrphans([]);
            } else {
                alert('Failed to delete orphans');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting orphans');
        } finally {
            setLoadingOrphans(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {t('admin.library.title')}
                    </h2>
                    <p className="text-slate-400">
                        {t('admin.library.desc')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Sector Filter */}
                    <div className="relative">
                        <select
                           value={selectedSector}
                           onChange={(e) => setSelectedSector(e.target.value)}
                           className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-48 p-2.5 outline-none appearance-none"
                        >
                            <option value="All">{t('admin.library.filters.all_sectors')}</option>
                            {sectors.map((sector) => (
                                <option key={sector} value={sector}>{sector}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {/* Uploader Filter */}
                     <div className="relative">
                        <select
                           value={selectedUploader}
                           onChange={(e) => setSelectedUploader(e.target.value)}
                           className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-48 p-2.5 outline-none appearance-none"
                        >
                            <option value="All">{t('admin.library.filters.all_uploaders')}</option>
                            {uploaders.map((u) => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder={t('admin.library.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/50 text-slate-400 text-sm uppercase tracking-wider border-b border-slate-800">
                            <th className="p-4 font-medium">{t('admin.library.table.thumb')}</th>
                            <th className="p-4 font-medium">{t('admin.library.table.name')}</th>
                            <th className="p-4 font-medium">{t('admin.library.table.sector')}</th>
                            <th className="p-4 font-medium">{t('admin.library.table.uploader')}</th>
                            <th className="p-4 font-medium text-right">{t('admin.library.table.size')}</th>
                            <th className="p-4 font-medium text-center">{t('admin.library.table.featured')}</th>
                            <th className="p-4 font-medium text-right">{t('admin.library.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredModels.length > 0 ? (
                            filteredModels.map((model) => (
                                <tr key={model.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
                                            {model.thumbnailUrl ? (
                                                <img 
                                                    src={fixAssetUrl(model.thumbnailUrl)}  
                                                    alt={model.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Box className="w-6 h-6 text-slate-600" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-white">{model.name}</div>
                                        <div className="text-xs text-slate-500 font-mono truncate max-w-[150px]" title={model.modelUrl}>
                                            {model.modelUrl.split('/api/uploads/')[1]?.split('/')[0] || 'root'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs text-nowrap">
                                            {model.sector}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {model.uploadedBy}
                                    </td>
                                    <td className="p-4 text-right text-slate-400 font-mono text-sm">
                                        {formatFileSize(model.fileSize)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleToggleFeatured(model)}
                                            className={`p-2 rounded-full transition-all ${
                                                model.isFeatured 
                                                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                                    : 'text-slate-600 hover:bg-slate-700 hover:text-slate-400'
                                            }`}
                                            title="Toggle Featured Status"
                                        >
                                            <Star className={`w-5 h-5 ${model.isFeatured ? 'fill-amber-400' : ''}`} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <a
                                                href={model.modelUrl}
                                                download
                                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                title="Download Model"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <a
                                                href={`/?modelId=${model.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                                title="View in New Tab"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            t('admin.library.confirm_clone', { name: model.name })
                                                        )
                                                    ) {
                                                        onCloneModel(model.id);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                                                title={t('admin.library.actions.clone')}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEditModel(model)}
                                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title={t('admin.library.actions.edit')}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(model)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Model"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                                    {t('admin.library.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-xs text-slate-500 text-right">
                Showing {filteredModels.length} of {models.length} models
            </div>

            {/* Orphans Section */}
            <div className="mt-12 pt-8 border-t border-slate-800">
                <button 
                    onClick={() => setShowOrphans(!showOrphans)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-lg">Orphaned Files & Folders</span>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-500">Maintenance</span>
                </button>

                {showOrphans && (
                    <div className="bg-slate-950/30 rounded-xl border border-slate-800/50 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-slate-400 max-w-2xl">
                                These files/folders are present in the uploads directory but are <strong>not referenced in the database</strong>. 
                                They are likely leftovers from deleted models or failed uploads. 
                                <br />
                                <span className="text-amber-500/80">Warning: Deletion is permanent.</span>
                            </p>
                            <button 
                                onClick={loadOrphans}
                                disabled={loadingOrphans}
                                className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors mr-2"
                                title="Refresh List"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingOrphans ? 'animate-spin' : ''}`} />
                            </button>
                            {orphans.length > 0 && (
                                <button 
                                    onClick={handleDeleteAllOrphans}
                                    disabled={loadingOrphans}
                                    className="px-3 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/40 transition-colors flex items-center gap-2 text-sm"
                                    title="Delete All Orphans"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete All
                                </button>
                            )}
                        </div>

                        {loadingOrphans ? (
                            <div className="text-center py-8 text-slate-500">Scanning uploads directory...</div>
                        ) : orphans.length === 0 ? (
                            <div className="text-center py-8 text-green-500/50 flex flex-col items-center gap-2">
                                <Box className="w-8 h-8" />
                                <span>No orphans found. Your storage is clean! ✨</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 text-slate-400">
                                        <tr>
                                            <th className="p-3 font-medium">Type</th>
                                            <th className="p-3 font-medium">Name</th>
                                            <th className="p-3 font-medium text-right">Size</th>
                                            <th className="p-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {orphans.map((orphan) => (
                                            <tr key={orphan.name} className="hover:bg-slate-800/20">
                                                <td className="p-3 text-slate-500 w-12 text-center">
                                                    {orphan.type === 'folder' ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                                                </td>
                                                <td className="p-3 text-slate-300 font-mono">{orphan.name}</td>
                                                <td className="p-3 text-slate-400 text-right font-mono">{formatFileSize(orphan.size)}</td>
                                                <td className="p-3 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteOrphan(orphan.name)}
                                                        className="text-red-400 hover:text-red-300 hover:underline flex items-center justify-end gap-1 ml-auto"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryManager;

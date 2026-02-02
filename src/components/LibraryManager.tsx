import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { VETModel, User } from '../types';
import { Search, Trash2, Star, Download, ExternalLink, Box, Copy, Pencil } from 'lucide-react';
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
    models,
    onDeleteModel,
    onUpdateModel,
    onCloneModel,
    onEditModel,
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
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
    }, [models, searchTerm, sortConfig]);

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
                                        <div className="text-xs text-slate-500 font-mono truncate max-w-[150px]">
                                            {model.id}
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
        </div>
    );
};

export default LibraryManager;

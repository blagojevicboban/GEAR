import React, { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { VETModel, EDUSector, User } from '../types';

interface ModelGalleryProps {
  models: VETModel[];
  currentUser: User | null;
  sectors: string[]; // Dynamic sectors
  onViewModel: (m: VETModel) => void;
  onEnterWorkshop: (m: VETModel) => void;
  onEditModel: (m: VETModel) => void;
  onDeleteModel: (id: string) => void;
  onViewUser: (username: string) => void;
  onOptimizeModel?: (m: VETModel) => void;
  onUpload?: () => void;
  initialUserFilter?: string;
}

import { fixAssetUrl } from '../utils/urlUtils';
import Hero3D from './Hero3D';
import { Sparkles, BrainCircuit } from 'lucide-react';

const ModelGallery: React.FC<ModelGalleryProps> = ({ models, currentUser, sectors, onViewModel, onEnterWorkshop, onEditModel, onDeleteModel, onViewUser, onOptimizeModel, onUpload, initialUserFilter }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('All'); // Changed from EDUSector | 'All' to string
  const [userFilter, setUserFilter] = useState<string>(initialUserFilter || 'All');
  const [search, setSearch] = useState('');
  const [targetPos, setTargetPos] = useState<{ x: number, y: number } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate normalized coordinates (-1 to 1)
    const x = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
    // Position at the lower part of the image (approx 130px from top)
    const y = -(((rect.top + 130) / window.innerHeight) * 2 - 1);
    setTargetPos({ x, y });
  };

  const handleMouseLeave = () => {
    setTargetPos(null);
  };

  // Extract unique uploaders for the filter dropdown
  const uniqueUploaders = Array.from(new Set(models.map(m => m.uploadedBy))).sort();

  const filteredModels = models.filter(m => {
    const matchesSector = filter === 'All' || m.sector === filter;
    const matchesUser = userFilter === 'All' || m.uploadedBy === userFilter;
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.equipmentType.toLowerCase().includes(search.toLowerCase());
    return matchesSector && matchesUser && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative">
      {/* 3D Hero Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-100">
        <Suspense fallback={null}>
          <Hero3D targetPosition={targetPos} />
        </Suspense>
      </div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('gallery.title')}</h1>
          <p className="text-slate-400">{t('gallery.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {filteredModels.length > 0 && currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher') && onUpload && (
            <button
              onClick={onUpload}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 animate-pulse"
            >
              <span className="text-lg leading-none">+</span> {t('gallery.upload')}
            </button>
          )}
          <input
            type="text"
            placeholder={t('gallery.search_placeholder')}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">{t('gallery.all_sectors')}</option>
            {sectors && sectors.length > 0 ? (
              sectors.map(s => <option key={s} value={s}>{s}</option>)
            ) : (
              Object.values(EDUSector).map(s => <option key={s} value={s}>{s}</option>)
            )}
          </select>
          <select
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="All">{t('gallery.all_users')}</option>
            {uniqueUploaders.map(user => <option key={user} value={user}>{user}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModels.map(model => (
          <div
            key={model.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative h-40 overflow-hidden">
              <img src={fixAssetUrl(model.thumbnailUrl)} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

              {/* Edit Button - Visible to Admin or Owner */}
              {currentUser && (currentUser.role === 'admin' || currentUser.username === model.uploadedBy) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditModel(model); }}
                  className="absolute top-2 right-2 bg-indigo-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500"
                  title={t('gallery.edit_tooltip')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {/* Optimize Button - Visible to Admin or Owner if NOT optimized */}
              {currentUser && (currentUser.role === 'admin' || currentUser.username === model.uploadedBy) && !model.optimized && onOptimizeModel && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOptimizeModel(model); }}
                  className="absolute top-2 left-2 bg-emerald-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500"
                  title={t('gallery.optimize_tooltip')}
                >
                  <BrainCircuit size={16} />
                </button>
              )}

              {/* Delete Button - Visible to Admin or Owner */}
              {currentUser && (currentUser.role === 'admin' || currentUser.username === model.uploadedBy) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteModel(model.id); }}
                  className="absolute top-12 right-2 bg-rose-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500"
                  title={t('gallery.delete_tooltip')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onViewModel(model)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                >
                  {t('gallery.quick_view')}
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded uppercase tracking-widest">{model.sector}</span>
                <span
                  className="text-[10px] font-bold text-slate-500 uppercase cursor-help hover:text-indigo-400 transition-colors"
                  title={`File: ${model.modelUrl.split('/').pop()}`}
                >
                  {model.modelUrl.split('.').pop()?.toUpperCase() || 'CAD'} • {(model.fileSize / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">{model.name}</h3>
                {model.optimized && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30" title="Optimized by AI CAD Engine">
                    <Sparkles size={10} />
                    <span className="text-[10px] font-bold uppercase">{t('gallery.ai_optimized')}</span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-xs mb-3 flex-1 line-clamp-2">{model.description}</p>

              <div className="mb-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white uppercase overflow-hidden shrink-0">
                  {model.uploaderProfilePic ? (
                    <img src={fixAssetUrl(model.uploaderProfilePic)} alt={model.uploadedBy} className="w-full h-full object-cover" />
                  ) : (
                    model.uploadedBy.charAt(0)
                  )}
                </div>
                <p className="text-[10px] text-slate-500 italic">By <button onClick={(e) => { e.stopPropagation(); onViewUser(model.uploadedBy); }} className="hover:text-indigo-400 hover:underline">{model.uploadedBy}</button></p>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={() => onViewModel(model)}
                  className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 rounded-lg text-sm font-bold transition-all"
                >
                  {t('gallery.explore_xr')}
                </button>
                <div className="flex gap-2">
                  <a
                    href={fixAssetUrl(model.modelUrl)}
                    download
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    title="Download 3D Model"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t('gallery.download')}
                  </a>
                  <button
                    onClick={() => onEnterWorkshop(model)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                    title="Join Workshop"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {t('gallery.join')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredModels.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500 italic">{t('gallery.no_models')}</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default ModelGallery;

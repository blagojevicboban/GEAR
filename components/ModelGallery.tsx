import React, { useState } from 'react';
import { VETModel, EDUSector, User } from '../types';

interface ModelGalleryProps {
  models: VETModel[];
  currentUser: User | null;
  onViewModel: (m: VETModel) => void;
  onEnterWorkshop: (m: VETModel) => void;
  onEditModel: (m: VETModel) => void;
  onDeleteModel: (id: string) => void;
  onViewUser: (username: string) => void;
  initialUserFilter?: string;
}

import { fixAssetUrl } from '../utils/urlUtils';

const ModelGallery: React.FC<ModelGalleryProps> = ({ models, currentUser, onViewModel, onEnterWorkshop, onEditModel, onDeleteModel, onViewUser, initialUserFilter }) => {
  const [filter, setFilter] = useState<EDUSector | 'All'>('All');
  const [userFilter, setUserFilter] = useState<string>(initialUserFilter || 'All');
  const [search, setSearch] = useState('');

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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">VET Equipment Repository</h1>
          <p className="text-slate-400">Standardized, optimized, and interactive 3D twins.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search equipment..."
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="All">All Sectors</option>
            {Object.values(EDUSector).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="All">All Users</option>
            {uniqueUploaders.map(user => <option key={user} value={user}>{user}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModels.map(model => (
          <div key={model.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-colors group">
            <div className="relative h-40 overflow-hidden">
              <img src={fixAssetUrl(model.thumbnailUrl)} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

              {/* Edit Button - Visible to Admin or Owner */}
              {currentUser && (currentUser.role === 'admin' || currentUser.username === model.uploadedBy) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditModel(model); }}
                  className="absolute top-2 right-2 bg-indigo-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500"
                  title="Edit Model Metadata & Hotspots"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {/* Delete Button - Visible to Admin or Owner */}
              {currentUser && (currentUser.role === 'admin' || currentUser.username === model.uploadedBy) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteModel(model.id); }}
                  className="absolute top-12 right-2 bg-rose-600 p-2 rounded-lg text-white shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500"
                  title="Delete Model"
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
                  Quick View
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded uppercase tracking-widest">{model.sector}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{(model.fileSize / 1024 / 1024).toFixed(1)}MB</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{model.name}</h3>
              <p className="text-slate-500 text-xs mb-3 flex-1 line-clamp-2">{model.description}</p>

              <div className="mb-4">
                <p className="text-[10px] text-slate-500 italic">By <button onClick={(e) => { e.stopPropagation(); onViewUser(model.uploadedBy); }} className="hover:text-indigo-400 hover:underline">{model.uploadedBy}</button></p>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={() => onViewModel(model)}
                  className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 rounded-lg text-sm font-bold transition-all"
                >
                  Explore in XR
                </button>
                <button
                  onClick={() => onEnterWorkshop(model)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Join Workshop
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredModels.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500 italic">No models found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelGallery;

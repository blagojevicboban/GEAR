
import React from 'react';
import { VETModel } from '../types';

interface DashboardProps {
  modelsCount: number;
  onGetStarted: () => void;
  featuredModels: VETModel[];
  onViewModel: (m: VETModel) => void;
  onViewUser: (username: string) => void;
}



import { fixAssetUrl } from '../utils/urlUtils';

const Dashboard: React.FC<DashboardProps> = ({ modelsCount, onGetStarted, featuredModels, onViewModel, onViewUser }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-tight">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              VET Training
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-xl">
            THE GEAR is the ultimate WebXR open-source repository for vocational schools.
            Upload, optimize, and simulate industrial equipment in 1:1 scale directly in your Meta Quest browser.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Explore Hub
            </button>
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-bold text-white">{modelsCount}</span>
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Active Models</span>
            </div>
          </div>
        </div>

        <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl group">
          <img
            src="https://picsum.photos/seed/xr-hero/1200/800"
            alt="VET VR Training"
            className="object-cover w-full h-full opacity-60 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold rounded-full mb-3">
              LIVE WORKSHOP
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Multi-user Collaborative Lab</h3>
            <p className="text-slate-400 text-sm">Join teachers and students from across the globe in virtual workshops.</p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Equipment</h2>
          <button onClick={onGetStarted} className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm">View all →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredModels.map(model => (
            <div
              key={model.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer group"
              onClick={() => onViewModel(model)}
            >
              <div className="relative h-48 overflow-hidden">
                <img src={fixAssetUrl(model.thumbnailUrl)} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                  {model.level}
                </div>
              </div>
              <div className="p-6">
                <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">{model.sector}</span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">{model.name}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{model.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 italic">By <button onClick={(e) => { e.stopPropagation(); onViewUser(model.uploadedBy); }} className="hover:text-indigo-400 hover:underline">{model.uploadedBy}</button></span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-tighter">VR Ready</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

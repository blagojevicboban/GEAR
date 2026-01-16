
import React, { useState } from 'react';
import { EDUSector, EquipmentLevel, VETModel } from '../types';
import { generateOptimizationSuggestions } from '../services/geminiService';

interface ModelUploadFormProps {
  onUploadSuccess: (model: VETModel) => void;
  userName: string;
}

const ModelUploadForm: React.FC<ModelUploadFormProps> = ({ onUploadSuccess, userName }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [showCustomSector, setShowCustomSector] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sector: EDUSector.MECHATRONICS as string,
    customSector: '',
    equipmentType: '',
    level: EquipmentLevel.BASIC,
    uploadedBy: userName,
    modelFile: null as File | null,
    thumbnailFile: null as File | null
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [optSuggestions, setOptSuggestions] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, thumbnailFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'CUSTOM') {
      setShowCustomSector(true);
      setFormData({ ...formData, sector: '' });
    } else {
      setShowCustomSector(false);
      setFormData({ ...formData, sector: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelFile) return;

    setIsUploading(true);
    setUploadStep(2); // Optimization phase

    // Mock optimization process
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Upload File
      const fileData = new FormData();
      fileData.append('file', formData.modelFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: fileData
      });

      if (!uploadRes.ok) throw new Error('File upload failed');
      const uploadJson = await uploadRes.json();
      const uploadedUrl = uploadJson.url;

      // Get AI suggestions for further optimization
      const finalSector = showCustomSector ? formData.customSector : formData.sector;
      const tips = await generateOptimizationSuggestions(formData.modelFile.size, finalSector);
      setOptSuggestions(tips);

      setUploadStep(3); // Metadata phase
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Detect if pdb or step to append fragment
      const fileName = formData.modelFile.name.toLowerCase();
      let fragment = '';
      if (fileName.endsWith('.pdb')) fragment = '#pdb';
      else if (fileName.endsWith('.stp') || fileName.endsWith('.step')) fragment = '#step';

      const finalModelUrl = uploadedUrl + fragment;

      const newModel: VETModel = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        description: formData.description,
        sector: finalSector as any,
        equipmentType: formData.equipmentType,
        level: formData.level,
        modelUrl: finalModelUrl,
        thumbnailUrl: thumbnailPreview || `https://picsum.photos/seed/${formData.name}/600/400`,
        optimized: true,
        fileSize: formData.modelFile.size,
        uploadedBy: formData.uploadedBy,
        createdAt: new Date().toISOString().split('T')[0],
        hotspots: []
      };

      // Post metadata
      setTimeout(() => {
        onUploadSuccess(newModel);
        setIsUploading(false);
      }, 500);

    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-white">Upload VET Asset</h2>
          <div className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">
            Uploader Session: {userName}
          </div>
        </div>
        <p className="text-slate-400 mb-8">Contribute to the repository. Assets are auto-optimized for Meta Quest performance.</p>

        {isUploading ? (
          <div className="py-12 text-center">
            <div className="mb-8 flex flex-col items-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {uploadStep === 2 ? 'Analyzing & Optimizing...' : 'Finalizing Digital Twin...'}
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Applying Draco compression and PBR texture standardization.
              </p>
            </div>

            {optSuggestions && (
              <div className="mt-8 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-left animate-in fade-in slide-in-from-bottom-4">
                <h4 className="text-indigo-400 text-xs font-bold uppercase mb-3 tracking-widest">AI Performance Tuning:</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-mono">{optSuggestions}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Asset Files Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">1. 3D Model Source (.glb / .gltf)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-all cursor-pointer bg-slate-950/50 group h-40 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept=".glb,.gltf,.pdb,.stp,.step"
                    className="hidden"
                    id="model-upload"
                    onChange={e => setFormData({ ...formData, modelFile: e.target.files?.[0] || null })}
                  />
                  <label htmlFor="model-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    <svg className={`w-8 h-8 mb-2 transition-colors ${formData.modelFile ? 'text-green-500' : 'text-slate-600 group-hover:text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-sm text-slate-300 font-semibold truncate max-w-[200px]">{formData.modelFile ? formData.modelFile.name : 'Select 3D Mesh (.glb/gltf/pdb/stp)'}</p>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">2. Gallery Thumbnail</label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-2 text-center hover:border-indigo-500/50 transition-all cursor-pointer bg-slate-950/50 group h-40 flex items-center justify-center relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="thumb-upload"
                    onChange={handleThumbnailChange}
                  />
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Preview" />
                  ) : null}
                  <label htmlFor="thumb-upload" className="cursor-pointer z-10 w-full h-full flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 mb-2 text-slate-600 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-slate-300 font-semibold">{formData.thumbnailFile ? 'Image Loaded' : 'Select Image'}</p>
                  </label>
                </div>
              </div>
            </div>

            {/* Core Info Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Technical Metadata
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Asset Name</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CNC Milling Hub"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Equipment Type</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.equipmentType}
                    onChange={e => setFormData({ ...formData, equipmentType: e.target.value })}
                    placeholder="e.g., Lathe Machine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">VET Sector</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={showCustomSector ? 'CUSTOM' : formData.sector}
                    onChange={handleSectorChange}
                  >
                    {Object.values(EDUSector).map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="CUSTOM">+ Other / Custom Sector...</option>
                  </select>
                  {showCustomSector && (
                    <input
                      required
                      type="text"
                      placeholder="Enter custom sector name..."
                      className="w-full mt-2 bg-indigo-500/5 border border-indigo-500/30 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white animate-in slide-in-from-top-2 transition-all"
                      value={formData.customSector}
                      onChange={e => setFormData({ ...formData, customSector: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Complexity Level</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value as EquipmentLevel })}
                  >
                    {Object.values(EquipmentLevel).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Uploaded By</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.uploadedBy}
                    onChange={e => setFormData({ ...formData, uploadedBy: e.target.value })}
                    placeholder="Your name or institution"
                  />
                </div>
                <div className="hidden md:block"></div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Educational Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none resize-none text-white transition-all"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the learning objectives and mechanical specs..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!formData.modelFile}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-lg shadow-2xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Confirm and Optimize
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModelUploadForm;

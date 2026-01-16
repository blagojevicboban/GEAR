
import React, { useState } from 'react';
import { EDUSector, EquipmentLevel, VETModel, Hotspot } from '../types';
import { generateOptimizationSuggestions } from '../services/geminiService';

interface ModelEditFormProps {
  model: VETModel;
  onUpdateSuccess: (model: VETModel) => void;
  userName: string;
  onCancel: () => void;
}

const ModelEditForm: React.FC<ModelEditFormProps> = ({ model, onUpdateSuccess, userName, onCancel }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCustomSector, setShowCustomSector] = useState(false);
  const [formData, setFormData] = useState({
    name: model.name,
    description: model.description,
    sector: model.sector as string,
    customSector: '',
    equipmentType: model.equipmentType,
    level: model.level,
    uploadedBy: model.uploadedBy,
    isFeatured: model.isFeatured || false,
    modelFile: null as File | null,
    thumbnailFile: null as File | null
  });
  const [hotspots, setHotspots] = useState<Hotspot[]>(model.hotspots || []);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(model.thumbnailUrl);
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

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          // We need to use functional update to ensure we have latest formData state? 
          // Actually, since this is an event listener added once, we might have stale closure issues if we don't list dependencies.
          // But adding dependencies re-binds the listener.

          const reader = new FileReader();
          reader.onloadend = () => {
            setThumbnailPreview(reader.result as string);
            setFormData(prev => ({ ...prev, thumbnailFile: file }));
          };
          reader.readAsDataURL(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

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
  // ... (trimmed for brevity effectively since I can only check imports and usage in range)
  // Actually I need to be careful with the range. I'll target the import and the specific usages.


  const handleAddHotspot = () => {
    const newHs: Hotspot = {
      id: 'hs-' + Math.random().toString(36).substr(2, 5),
      position: { x: 0, y: 1, z: 0 },
      title: 'New Hotspot',
      description: 'Educational info goes here.',
      type: 'info'
    };
    setHotspots([...hotspots, newHs]);
  };

  const handleRemoveHotspot = (id: string) => {
    setHotspots(hotspots.filter(h => h.id !== id));
  };

  const handleHotspotChange = (id: string, field: keyof Hotspot | 'pos_x' | 'pos_y' | 'pos_z', value: any) => {
    setHotspots(hotspots.map(h => {
      if (h.id !== id) return h;
      if (field === 'pos_x') return { ...h, position: { ...h.position, x: parseFloat(value) || 0 } };
      if (field === 'pos_y') return { ...h, position: { ...h.position, y: parseFloat(value) || 0 } };
      if (field === 'pos_z') return { ...h, position: { ...h.position, z: parseFloat(value) || 0 } };
      return { ...h, [field]: value };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    let updatedModel = { ...model };
    const finalSector = showCustomSector ? formData.customSector : formData.sector;

    // If a new 3D file was provided
    // If a new 3D file was provided
    if (formData.modelFile) {
      // Upload File
      try {
        const fileData = new FormData();
        fileData.append('file', formData.modelFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fileData
        });

        if (!uploadRes.ok) throw new Error('File upload failed');
        const uploadJson = await uploadRes.json();
        const uploadedUrl = uploadJson.url;

        const tips = await generateOptimizationSuggestions(formData.modelFile.size, finalSector);
        setOptSuggestions(tips);

        // Detect if pdb to append fragment
        const isPdb = formData.modelFile.name.toLowerCase().endsWith('.pdb');
        updatedModel.modelUrl = uploadedUrl + (isPdb ? '#pdb' : '');
        updatedModel.fileSize = formData.modelFile.size;

      } catch (err) {
        console.error("File upload failed in edit", err);
        alert("Failed to upload new model file. Metadata will still be updated.");
        // We continue to update metadata even if file upload fails, or we could return here.
        // For now, let's stop to avoid broken state if the user expected a file change.
        setIsUpdating(false);
        return;
      }
    } else {
      // Mock delay if no file upload
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // If a new thumbnail was provided
    if (formData.thumbnailFile) {
      // Upload Thumbnail
      try {
        const thumbData = new FormData();
        thumbData.append('file', formData.thumbnailFile);

        const thumbRes = await fetch('/api/upload', {
          method: 'POST',
          body: thumbData
        });

        if (!thumbRes.ok) throw new Error('Thumbnail upload failed');
        const thumbJson = await thumbRes.json();
        updatedModel.thumbnailUrl = thumbJson.url;
      } catch (err) {
        console.error("Thumbnail upload failed", err);
        // We can choose to alert and stop, or just continue with old thumbnail
        alert("Failed to upload thumbnail image. It will remain unchanged.");
        // If critical, return; otherwise continue
      }
    } else if (updatedModel.thumbnailUrl.startsWith('data:')) {
      // Should not happen if we only set thumbnailFile on change/paste, unless initial state was data url?
      // But just in case
    }

    // Map form changes and hotspots
    updatedModel = {
      ...updatedModel,
      name: formData.name,
      description: formData.description,
      sector: finalSector as any,
      equipmentType: formData.equipmentType,
      level: formData.level,
      uploadedBy: formData.uploadedBy,
      isFeatured: formData.isFeatured,
      hotspots: hotspots
    };

    setTimeout(() => {
      onUpdateSuccess(updatedModel);
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-white">Edit VET Asset</h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-slate-400 mb-8 text-sm">Update technical details and pedagogical markers for {model.name}.</p>

        {isUpdating ? (
          <div className="py-12 text-center">
            <div className="mb-8 flex flex-col items-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Saving Changes...</h3>
              <p className="text-slate-500 text-sm">Re-syncing Digital Twin to cloud repository.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Asset Visuals Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Visual Representation
              </h3>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Thumbnail Image</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                      id="thumbnail-upload-edit"
                    />
                    <label
                      htmlFor="thumbnail-upload-edit"
                      className="flex items-center gap-3 px-6 py-4 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-all group-hover:bg-slate-900"
                    >
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-medium text-slate-300 truncate max-w-[150px]">
                        {formData.thumbnailFile ? formData.thumbnailFile.name : 'Replace Image'}
                      </span>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 italic uppercase tracking-tighter">Recommended 1200x675px resolution.</p>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Core Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Asset Name</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Equipment Type</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.equipmentType}
                    onChange={e => setFormData({ ...formData, equipmentType: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl p-4">
                <input
                  type="checkbox"
                  id="isFeatured"
                  className="w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                  checked={formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
                <label htmlFor="isFeatured" className="text-sm font-bold text-slate-200 cursor-pointer select-none">
                  Feature this Model on Dashboard
                </label>
                <span className="text-xs text-slate-500 ml-auto">Visible on homepage</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">VET Sector</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
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
                      placeholder="New sector name..."
                      className="w-full mt-2 bg-indigo-500/5 border border-indigo-500/30 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white animate-in slide-in-from-top-1 transition-all"
                      value={formData.customSector}
                      onChange={e => setFormData({ ...formData, customSector: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Complexity Level</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white transition-all"
                    value={formData.uploadedBy}
                    onChange={e => setFormData({ ...formData, uploadedBy: e.target.value })}
                  />
                </div>
                <div className="hidden md:block"></div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Educational Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none resize-none text-white transition-all"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Hotspots Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Interactive Hotspots
                </h3>
                <button
                  type="button"
                  onClick={handleAddHotspot}
                  className="text-xs font-bold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all"
                >
                  + Add Point of Interest
                </button>
              </div>

              {hotspots.length === 0 ? (
                <div className="py-10 text-center bg-slate-950/30 border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-sm">No hotspots defined yet. Add points to guide students through the model.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {hotspots.map((hs) => (
                    <div key={hs.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveHotspot(hs.id)}
                        className="absolute top-4 right-4 text-slate-600 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Hotspot Title</label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none text-white text-sm"
                              value={hs.title}
                              onChange={e => handleHotspotChange(hs.id, 'title', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Pedagogical Description</label>
                            <textarea
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none text-white text-sm resize-none"
                              value={hs.description}
                              onChange={e => handleHotspotChange(hs.id, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Local Coordinates (X, Y, Z)</label>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number" step="0.01"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 focus:border-indigo-500 outline-none text-white text-center text-xs"
                              value={hs.position.x}
                              onChange={e => handleHotspotChange(hs.id, 'pos_x', e.target.value)}
                            />
                            <input
                              type="number" step="0.01"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 focus:border-indigo-500 outline-none text-white text-center text-xs"
                              value={hs.position.y}
                              onChange={e => handleHotspotChange(hs.id, 'pos_y', e.target.value)}
                            />
                            <input
                              type="number" step="0.01"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 focus:border-indigo-500 outline-none text-white text-center text-xs"
                              value={hs.position.z}
                              onChange={e => handleHotspotChange(hs.id, 'pos_z', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Type</label>
                            <select
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 focus:border-indigo-500 outline-none text-white text-xs"
                              value={hs.type}
                              onChange={e => handleHotspotChange(hs.id, 'type', e.target.value)}
                            >
                              <option value="info">Information</option>
                              <option value="video">Video Link</option>
                              <option value="pdf">Manual / PDF</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Asset Replacement Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Digital Twin Replacement
              </h3>
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer bg-slate-950/50">
                <input
                  type="file"
                  accept=".glb,.gltf,.pdb"
                  className="hidden"
                  id="model-file-edit-v2"
                  onChange={e => setFormData({ ...formData, modelFile: e.target.files?.[0] || null })}
                />
                <label htmlFor="model-file-edit-v2" className="cursor-pointer">
                  <p className="text-sm text-slate-300 font-semibold">{formData.modelFile ? formData.modelFile.name : 'Click to select new 3D source'}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">Optional replacement of .glb, .gltf, or .pdb binary.</p>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                Sync All Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModelEditForm;

import React, { useState, useEffect } from 'react';
import { fixAssetUrl } from '../utils/urlUtils';
import RichTextEditor from './RichTextEditor';

import { Lesson, LessonStep, VETModel } from '../types';
import { Plus, Trash2, Save, ArrowLeft, MoveUp, MoveDown } from 'lucide-react';

interface LessonEditorProps {
    lessonToEdit?: Lesson; // If null, create mode
    currentUser: any;
    onSaveSuccess: (lessonId: string) => void;
    onCancel: () => void;
    availableModels: VETModel[];
    availableSectors: string[];
}

const LessonEditor: React.FC<LessonEditorProps> = ({
    lessonToEdit,
    currentUser,
    onSaveSuccess,
    onCancel,
    availableModels,
    availableSectors
}) => {
    // Lesson Metadata State
    const [title, setTitle] = useState(lessonToEdit?.title || '');
    const [description, setDescription] = useState(lessonToEdit?.description || '');
    const [sector, setSector] = useState(lessonToEdit?.sector || (availableSectors[0] || 'Mechatronics'));
    const [imageUrl, setImageUrl] = useState(lessonToEdit?.image_url || '');
    const [isUploading, setIsUploading] = useState(false);

    // Steps State
    const [steps, setSteps] = useState<LessonStep[]>([]);

    useEffect(() => {
        if (lessonToEdit && lessonToEdit.steps) {
            setSteps(lessonToEdit.steps);
            if (lessonToEdit.image_url) setImageUrl(lessonToEdit.image_url);
        } else if (lessonToEdit) {
            fetch(`/api/lessons/${lessonToEdit.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.steps) setSteps(data.steps);
                    if (data.image_url) setImageUrl(data.image_url);
                });
        } else {
            // New lesson, start with one empty step
            setSteps([{
                id: '', // new
                lesson_id: '',
                step_order: 1,
                title: 'Introduction',
                content: '# Welcome to this lesson\n\nStart by explaining the topic.',
                model_id: ''
            }]);
        }
    }, [lessonToEdit]);

    const handleAddStep = () => {
        setSteps(prev => [
            ...prev,
            {
                id: '',
                lesson_id: '',
                step_order: prev.length + 1,
                title: `Step ${prev.length + 1}`,
                content: '',
                model_id: ''
            }
        ]);
    };

    const handleRemoveStep = (index: number) => {
        if (steps.length <= 1) return; // Prevent deleting last step
        const newSteps = steps.filter((_, i) => i !== index);
        // Reorder
        setSteps(newSteps.map((s, i) => ({ ...s, step_order: i + 1 })));
    };

    const handleStepChange = (index: number, field: keyof LessonStep, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const newSteps = [...steps];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];

        // Reassign order
        setSteps(newSteps.map((s, i) => ({ ...s, step_order: i + 1 })));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setImageUrl(data.url);
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                return data.url;
            } else {
                alert('Upload failed: ' + data.error);
                return null;
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
            return null;
        }
    };

    const handleStepImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = await handleUploadFile(file);
        if (url) {
            handleStepChange(index, 'image_url', url);
        }
    };

    const handlePaste = async (index: number, e: React.ClipboardEvent, target: 'content' | 'image') => {
        const items = e.clipboardData.items;
        let file = null;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                file = items[i].getAsFile();
                break;
            }
        }

        if (file) {
            e.preventDefault();
            const url = await handleUploadFile(file);
            if (url) {
                if (target === 'image') {
                    handleStepChange(index, 'image_url', url);
                } else {
                    // HTML Image Insertion using execCommand
                    // Since RichTextEditor is focused (or just was pasted into), this might work.
                    // But preventDefault was called. We need to manually insert.
                    // If we can't ensure focus/selection, we append.
                    // But RichTextEditor handles focus.
                    // Let's try execCommand.
                    document.execCommand('insertImage', false, url);

                    // Note: handleInput in RichTextEditor will trigger onChange, updating state properly.
                    // So we don't need handleStepChange here if execCommand works.
                    // But if execCommand fails (no focus), we might need fallback.
                    // Fallback: Append to content.
                    // handleStepChange(index, 'content', steps[index].content + `<img src="${url}" />`);
                }
            }
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return alert('Please enter a lesson title');

        const payload = {
            title,
            description,
            sector_id: sector,
            image_url: imageUrl,
            steps: steps
        };

        try {
            let url = '/api/lessons';
            let method = 'POST';

            if (lessonToEdit) {
                url = `/api/lessons/${lessonToEdit.id}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                onSaveSuccess(data.id);
            } else {
                const err = await res.json();
                alert(`Failed to save: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error saving lesson');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-slate-900 min-h-screen text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-2xl font-bold text-white">
                        {lessonToEdit ? 'Edit Lesson' : 'Create New Lesson'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Save size={18} />
                    Save Lesson
                </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Lesson Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Introduction to Robotics"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Sector</label>
                        <select
                            value={sector}
                            onChange={e => setSector(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {availableSectors.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Lesson Image</label>
                        <div className="flex items-center gap-4">
                            {imageUrl && (
                                <img src={imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                            />
                        </div>
                        {isUploading && <p className="text-xs text-indigo-400 mt-1">Uploading...</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full h-[180px] bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="Brief overview of what this lesson covers..."
                    ></textarea>
                </div>
            </div>

            {/* Steps Editor */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Lesson Steps</h2>
                    <button
                        onClick={handleAddStep}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                    >
                        <Plus size={16} /> Add Step
                    </button>
                </div>

                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative group">
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleMoveStep(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30">
                                    <MoveUp size={16} />
                                </button>
                                <button onClick={() => handleMoveStep(index, 'down')} disabled={index === steps.length - 1} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30">
                                    <MoveDown size={16} />
                                </button>
                                <button onClick={() => handleRemoveStep(index)} className="p-1 hover:bg-rose-900/30 text-rose-500 rounded ml-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-slate-700 w-8 h-8 flex items-center justify-center rounded-full text-slate-300 font-bold border border-slate-600">
                                    {index + 1}
                                </div>
                                <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                                    className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-500 outline-none text-lg font-bold text-indigo-300 w-full max-w-md px-2"
                                    placeholder="Step Title"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Content (Rich Text)</label>
                                    <RichTextEditor
                                        value={step.content}
                                        onChange={(html) => handleStepChange(index, 'content', html)}
                                        placeholder="Write the lesson content here..."
                                        onPaste={(e) => handlePaste(index, e, 'content')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Step Image (Optional)</label>
                                    <div
                                        className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        onPaste={(e) => handlePaste(index, e, 'image')}
                                        tabIndex={0}
                                    >
                                        <div className="flex items-center gap-3">
                                            {step.image_url ? (
                                                <div className="relative w-16 h-16 rounded overflow-hidden group/img shrink-0">
                                                    <img src={step.image_url} alt="Step" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => handleStepChange(index, 'image_url', '')}
                                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 text-rose-500 transition-opacity"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center text-slate-600 shrink-0">
                                                    <span className="text-xs">No Img</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleStepImageUpload(index, e)}
                                                    className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                                                />
                                                <p className="text-[10px] text-slate-500 mt-1 ml-1">
                                                    Click here and paste (Ctrl+V) an image
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Linked 3D Model</label>
                                    <select
                                        value={step.model_id || ''}
                                        onChange={(e) => handleStepChange(index, 'model_id', e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none mb-4"
                                    >
                                        <option value="">No Model (Text only)</option>
                                        {availableModels.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.sector})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Model Preview (Mini) */}
                                    {step.model_id && (
                                        <div className="w-full h-32 bg-black rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center relative">
                                            {/* Just a static preview image or text for now */}
                                            {(() => {
                                                const m = availableModels.find(mod => mod.id === step.model_id);
                                                return m ? (
                                                    <>
                                                        <img src={fixAssetUrl(m.thumbnailUrl)} className="w-full h-full object-cover opacity-50" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="bg-black/70 px-2 py-1 rounded text-xs text-white">{m.name}</span>
                                                        </div>
                                                    </>
                                                ) : <span className="text-xs text-red-500">Model not found</span>
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-800">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Save size={18} />
                    Save Lesson
                </button>
            </div>
        </div>
    );
};

export default LessonEditor;

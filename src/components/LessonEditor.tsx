import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fixAssetUrl } from '../utils/urlUtils';
import RichTextEditor from './RichTextEditor';

import { Lesson, LessonStep, VETModel } from '../types';
import { Plus, Trash2, Save, ArrowLeft, MoveUp, MoveDown, Target, BrainCircuit } from 'lucide-react';
import VRViewer from './VRViewer';

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
    const { t } = useTranslation();
    // Lesson Metadata State
    const [title, setTitle] = useState(lessonToEdit?.title || '');
    const [description, setDescription] = useState(lessonToEdit?.description || '');
    const [sector, setSector] = useState(lessonToEdit?.sector || (availableSectors[0] || 'Mechatronics'));
    const [imageUrl, setImageUrl] = useState(lessonToEdit?.image_url || '');
    const [isUploading, setIsUploading] = useState(false);

    // Steps State
    const [steps, setSteps] = useState<LessonStep[]>([]);

    // Picker Modal State
    const [pickingStepIndex, setPickingStepIndex] = useState<number | null>(null);
    const [pickerModel, setPickerModel] = useState<VETModel | null>(null);

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
                title: t('lessons.editor.intro_title'),
                content: t('lessons.editor.intro_content'),
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
                title: `${t('lessons.editor.add_step').split(' ')[1]} ${prev.length + 1}`,
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
                alert(t('builder.errors.save_failed') + ': ' + data.error);
                return null;
            }
        } catch (err) {
            console.error(err);
            alert(t('builder.errors.save_failed'));
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

    const handleObjectClick = (meshName: string) => {
        if (pickingStepIndex !== null) {
            handleStepChange(pickingStepIndex, 'interaction_data', JSON.stringify({ targetMesh: meshName }));
            setPickingStepIndex(null);
            setPickerModel(null);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return alert(t('lessons.editor.errors.enter_title'));

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
            alert(t('builder.errors.network_error'));
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
                        {lessonToEdit ? t('lessons.editor.edit_title') : t('lessons.editor.create_title')}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Save size={18} />
                    {t('lessons.editor.save_btn')}
                </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('lessons.editor.lesson_title')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={t('lessons.editor.title_placeholder')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('lessons.editor.sector')}</label>
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
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('lessons.editor.image')}</label>
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
                        {isUploading && <p className="text-xs text-indigo-400 mt-1">{t('lessons.editor.uploading')}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('lessons.editor.description')}</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full h-[180px] bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder={t('lessons.editor.desc_placeholder')}
                    ></textarea>
                </div>
            </div>

            {/* Steps Editor */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{t('lessons.editor.steps_title')}</h2>
                    <button
                        onClick={handleAddStep}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                    >
                        <Plus size={16} /> {t('lessons.editor.add_step')}
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
                                    placeholder={t('lessons.editor.step_title_placeholder')}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('lessons.editor.step_type')}</label>
                                    <div className="flex gap-2 mb-4">
                                        {(['read', 'quiz', 'find_part'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleStepChange(index, 'interaction_type', type)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize border transition-all ${(step.interaction_type || 'read') === type
                                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {type === 'read' && t('lessons.editor.read')}
                                                {type === 'quiz' && t('lessons.editor.quiz')}
                                                {type === 'find_part' && t('lessons.editor.find_part')}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        {step.interaction_type === 'quiz' ? t('lessons.editor.question') : t('lessons.editor.content_rich')}
                                    </label>
                                    <RichTextEditor
                                        value={step.content}
                                        onChange={(html) => handleStepChange(index, 'content', html)}
                                        placeholder={step.interaction_type === 'quiz' ? t('lessons.editor.question_placeholder') : t('lessons.editor.content_placeholder')}
                                        onPaste={(e) => handlePaste(index, e, 'content')}
                                    />

                                    {/* Quiz Editor */}
                                    {step.interaction_type === 'quiz' && (
                                        <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('lessons.editor.answers')}</label>
                                            <div className="space-y-2">
                                                {(() => {
                                                    const data = step.interaction_data ? JSON.parse(step.interaction_data) : { options: ['', '', '', ''], correctIndex: 0 };
                                                    const updateQuiz = (newData: any) => handleStepChange(index, 'interaction_data', JSON.stringify({ ...data, ...newData }));

                                                    return data.options.map((opt: string, i: number) => (
                                                        <div key={i} className="flex gap-2 items-center">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${index}`}
                                                                checked={data.correctIndex === i}
                                                                onChange={() => updateQuiz({ correctIndex: i })}
                                                                className="accent-indigo-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...data.options];
                                                                    newOpts[i] = e.target.value;
                                                                    updateQuiz({ options: newOpts });
                                                                }}
                                                                placeholder={t('lessons.editor.option', { number: i + 1 })}
                                                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                                            />
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Find Part Editor */}
                                    {step.interaction_type === 'find_part' && (
                                        <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('lessons.editor.target_part')}</label>

                                            {(() => {
                                                const data = step.interaction_data ? JSON.parse(step.interaction_data) : { targetMesh: '' };
                                                return (
                                                    <div>
                                                        <div className="flex gap-2 items-center mb-2">
                                                            <div className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-indigo-300 truncate">
                                                                {data.targetMesh || t('lessons.editor.no_part')}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (!step.model_id) return alert(t('lessons.editor.errors.link_model_first'));
                                                                    const m = availableModels.find(mod => mod.id === step.model_id);
                                                                    if (m) {
                                                                        setPickerModel(m);
                                                                        setPickingStepIndex(index);
                                                                    }
                                                                }}
                                                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold whitespace-nowrap"
                                                            >
                                                                {t('lessons.editor.pointer')}
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500">
                                                            {t('lessons.editor.pointer_tip')}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('lessons.editor.step_image')}</label>
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
                                                    <span className="text-xs">{t('lessons.editor.no_img')}</span>
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
                                                    {t('lessons.editor.paste_img_tip')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('lessons.editor.linked_model')}</label>
                                    <select
                                        value={step.model_id || ''}
                                        onChange={(e) => handleStepChange(index, 'model_id', e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none mb-4"
                                    >
                                        <option value="">{t('lessons.editor.no_model_text')}</option>
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
                                                ) : <span className="text-xs text-red-500">{t('lessons.editor.model_not_found')}</span>
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleAddStep}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                    >
                        <Plus size={16} /> {t('lessons.editor.add_step')}
                    </button>
                </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-800">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Save size={18} />
                    {t('lessons.editor.save_btn')}
                </button>
            </div>
            {/* Part Picker Modal */}
            {pickingStepIndex !== null && pickerModel && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="absolute top-4 left-4 z-20 bg-slate-900/90 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-white font-bold mb-2">{t('lessons.editor.select_target')}</h3>
                        <p className="text-xs text-slate-400 mb-4">{t('lessons.editor.select_target_tip')}</p>
                        <button
                            onClick={() => { setPickingStepIndex(null); setPickerModel(null); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                    <VRViewer
                        model={pickerModel}
                        onExit={() => { setPickingStepIndex(null); setPickerModel(null); }}
                        onObjectClick={handleObjectClick}
                        workshopMode={false}
                    />
                </div>
            )}
        </div>
    );
};

export default LessonEditor;

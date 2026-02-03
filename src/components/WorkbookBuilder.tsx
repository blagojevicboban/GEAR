import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import RichTextEditor from './RichTextEditor';
import VRViewer from './VRViewer';
import AILessonGeneratorModal from './AILessonGeneratorModal';
import { Lesson, LessonStep, VETModel, Hotspot } from '../types';
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    MapPin,
    Globe,
    Layout,
    MousePointer,
    Info,
    Sparkles,
    Image as ImageIcon,
} from 'lucide-react';
import { fixAssetUrl } from '../utils/urlUtils';

interface WorkbookBuilderProps {
    lessonToEdit?: Lesson;
    currentUser: any;
    onSaveSuccess: (lessonId: string) => void;
    onCancel: () => void;
    availableModels: VETModel[];
    availableSectors: string[];
}

const WorkbookBuilder: React.FC<WorkbookBuilderProps> = ({
    lessonToEdit,
    currentUser,
    onSaveSuccess,
    onCancel,
    availableModels,
    availableSectors,
}) => {
    const { t } = useTranslation();
    // --- State: Lesson Metadata ---
    const [title, setTitle] = useState(lessonToEdit?.title || '');
    const [description, setDescription] = useState(
        lessonToEdit?.description || ''
    );
    const [sector, setSector] = useState(

        lessonToEdit?.sector || availableSectors[0] || 'Mechatronics'
    );
    const [imageUrl, setImageUrl] = useState(lessonToEdit?.image_url || '');

    // --- State: Steps ---
    const [steps, setSteps] = useState<LessonStep[]>([]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    // --- State: Editor Mode ---
    const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
    const [tempHotspotPos, setTempHotspotPos] = useState<{
        pos: any;
        normal: any;
    } | null>(null);
    const [showHotspotModal, setShowHotspotModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    // New Hotspot Data Form
    const [newHotspotTitle, setNewHotspotTitle] = useState('');
    const [newHotspotDesc, setNewHotspotDesc] = useState('');

    // --- Initialization ---
    useEffect(() => {
        if (lessonToEdit && lessonToEdit.steps) {
            setSteps(lessonToEdit.steps);
            if (lessonToEdit.image_url) setImageUrl(lessonToEdit.image_url);
        } else if (lessonToEdit) {
            // Fetch full details
            fetch(`/api/lessons/${lessonToEdit.id}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.steps) setSteps(data.steps);
                    if (data.image_url) setImageUrl(data.image_url);
                });
        } else {
            // Default first step
            setSteps([
                {
                    id: 'step-init',
                    lesson_id: '',
                    step_order: 1,
                    title: t('builder.intro_title'),
                    content: t('builder.intro_content'),
                    model_id: '',
                    interaction_type: 'read',
                },
            ]);
        }
    }, [lessonToEdit]);

    // --- Helpers ---
    const currentStep = steps[activeStepIndex];
    // Find the model associated with the current step
    const currentModel = currentStep?.model_id
        ? availableModels.find((m) => m.id === currentStep.model_id)
        : null;

    const handleStepChange = (field: keyof LessonStep, value: any) => {
        const newSteps = [...steps];
        newSteps[activeStepIndex] = {
            ...newSteps[activeStepIndex],
            [field]: value,
        };
        setSteps(newSteps);
    };

    const handleAddStep = () => {
        const newStep: LessonStep = {
            id: `step-${Date.now()}`,
            lesson_id: '',
            step_order: steps.length + 1,
            title: `${t('builder.step_editor').split(' ')[0]} ${steps.length + 1}`,
            content: '',
            model_id: currentStep?.model_id || '', // Inherit model from previous step
            interaction_type: 'read',
        };
        setSteps([...steps, newStep]);
        setActiveStepIndex(steps.length); // Switch to new step
    };

    const handleRemoveStep = (index: number) => {
        if (steps.length <= 1) return;
        const newSteps = steps.filter((_, i) => i !== index);
        setSteps(newSteps.map((s, i) => ({ ...s, step_order: i + 1 })));
        if (activeStepIndex >= newSteps.length)
            setActiveStepIndex(newSteps.length - 1);
    };

    const handleAIGeneratedSteps = (newSteps: LessonStep[]) => {
        setSteps(newSteps);
        setActiveStepIndex(0);
        // Optionally update title if empty
        if (!title && newSteps.length > 0) {
            // Maybe guess title from first model?
        }
    };

    // --- Image Upload & Paste Logic ---
    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUrl(''); // Clear current preview/url while uploading (optional UI feedback)
        
        try {
            const url = await handleUploadFile(file);
            if (url) {
                setImageUrl(url);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
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

    const handleStepImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = await handleUploadFile(file);
        if (url) {
            handleStepChange('image_url', url);
        }
    };

    const handlePaste = async (
        e: React.ClipboardEvent,
        target: 'content' | 'image'
    ) => {
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
                    handleStepChange('image_url', url);
                } else {
                    // HTML Image Insertion using execCommand
                    document.execCommand('insertImage', false, url);
                }
            }
        }
    };

    // --- Hotspot Logic ---
    const handleStartPlacingHotspot = () => {
        if (!currentModel) return alert(t('builder.errors.select_model'));
        setIsPlacingHotspot(true);
    };

    const onHotspotPlace = useCallback(
        (pos: any, normal: any) => {
            setTempHotspotPos({ pos, normal });
            setIsPlacingHotspot(false);
            setShowHotspotModal(true);
            setNewHotspotTitle(t('builder.define_hotspot'));
            setNewHotspotDesc('');
        },
        [t]
    );

    const handleSaveHotspot = async () => {
        if (!currentModel || !tempHotspotPos) return;

        // 1. Create Hotspot Object
        const newHotspot: Hotspot = {
            id: `hs-${Date.now()}`,
            model_id: currentModel.id,
            position: tempHotspotPos.pos,
            normal: tempHotspotPos.normal,
            title: newHotspotTitle,
            description: newHotspotDesc,
            type: 'info',
        };

        // 2. Add to Model's Hotspot list
        // Note: availableModels is a prop, we can't mutate it directly in valid React.
        // But for the purpose of the Viewer, we need to update the model in the backend state.
        // We will optimistically update a local copy, BUT we also need to persist it to the backend.

        const updatedModel = {
            ...currentModel,
            hotspots: [...(currentModel.hotspots || []), newHotspot],
        };

        try {
            // Save Model Changes to Backend
            await fetch(`/api/models/${currentModel.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username,
                },
                body: JSON.stringify(updatedModel),
            });

            // 3. Link to Step
            handleStepChange('hotspot_id', newHotspot.id);

            // 4. Force refresh of model in the parent app?
            // Reuse logic

            // Reset UI
            setShowHotspotModal(false);
            setTempHotspotPos(null);
        } catch (e) {
            console.error('Failed to save hotspot', e);
            alert(t('builder.errors.save_failed'));
        }
    };

    // --- Main Save ---
    const handleSaveLesson = async () => {
        if (!title.trim()) return alert(t('builder.errors.enter_title'));

        const payload = {
            title,
            description,
            sector_id: sector,
            image_url: imageUrl,
            steps: steps,
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
                    'X-User-Name': currentUser.username,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json();
                onSaveSuccess(data.id);
            }
        } catch (e) {
            alert(t('builder.errors.network_error'));
        }
    };

    return (
        <div className="flex w-full h-screen bg-slate-900 text-slate-200 overflow-hidden">
            {/* --- LEFT PANEL: Settings & Step Editor (35%) --- */}
            <div className="w-[400px] flex flex-col border-r border-slate-800 bg-slate-950 shadow-2xl z-10">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    {/* Add AI Button */}
                    <button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-amber-500/30"
                        title="Auto-Generate Lesson"
                    >
                        <Sparkles size={14} /> AI Draft
                    </button>

                    <button
                        onClick={handleSaveLesson}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <Save size={16} /> {t('common.save')}
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {/* Lesson Meta */}
                    <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent text-xl font-bold w-full outline-none placeholder:text-slate-600"
                            placeholder={t('builder.lesson_title')}
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-900 rounded p-2 text-xs text-slate-400 resize-none outline-none focus:ring-1 focus:ring-slate-700"
                            rows={2}
                            placeholder={t('builder.short_description')}
                        />


                        {/* Sector & Image Controls */}
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                className="w-full bg-slate-900 rounded p-2 text-xs text-slate-400 outline-none focus:ring-1 focus:ring-slate-700 cursor-pointer"
                            >
                                {availableSectors.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            <div className="relative group">
                                <button
                                    onClick={() => document.getElementById('lesson-meta-img')?.click()}
                                    className="w-full bg-slate-900 rounded p-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2 border border-transparent hover:border-slate-700 transition-all truncate"
                                    title={imageUrl ? 'Change Cover Image' : 'Upload Cover Image'}
                                >
                                    <ImageIcon size={14} />
                                    {imageUrl ? 'Change Cover' : 'Upload Cover'}
                                </button>
                                <input
                                    id="lesson-meta-img"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                {imageUrl && (
                                    <div className="absolute bottom-full left-0 mb-2 w-32 h-20 bg-slate-900 rounded shadow-xl border border-slate-700 overflow-hidden hidden group-hover:block z-50">
                                        <img src={fixAssetUrl(imageUrl)} className="w-full h-full object-cover" alt="Cover Preview" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pedagogical Tip (Result 4) */}
                        <div className="mt-2 p-2 bg-indigo-900/20 border border-indigo-500/20 rounded-lg flex gap-2">
                            <Info
                                size={14}
                                className="text-indigo-400 flex-shrink-0 mt-0.5"
                            />
                            <div>
                                <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-0.5">
                                    {t('builder.pedagogical_tip')}
                                </span>
                                <p className="text-[10px] text-slate-400 italic">
                                    {t('builder.bloom_tip')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 noscrollbar">
                        {steps.map((_s, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveStepIndex(i)}
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    activeStepIndex === i
                                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950'
                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={handleAddStep}
                            className="flex-shrink-0 w-8 h-8 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-400 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Active Step Editor */}
                    {currentStep && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] uppercase">
                                        {t('builder.step_editor').split(' ')[0]}{' '}
                                        {activeStepIndex + 1}
                                    </span>
                                    {t('builder.step_editor').split(' ')[1]}
                                </h3>
                                <button
                                    onClick={() =>
                                        handleRemoveStep(activeStepIndex)
                                    }
                                    className="text-rose-500 hover:bg-rose-900/20 p-1.5 rounded transition-colors"
                                    title={t('common.delete')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <input
                                type="text"
                                value={currentStep.title}
                                onChange={(e) =>
                                    handleStepChange('title', e.target.value)
                                }
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                                placeholder={t('builder.step_headline')}
                            />

                            {/* Model Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                        {t('builder.attached_model')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={currentStep.model_id || ''}
                                            onChange={(e) =>
                                                handleStepChange(
                                                    'model_id',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs appearance-none focus:ring-1 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">
                                                {t('builder.no_model')}
                                            </option>
                                            {availableModels.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Globe
                                            className="absolute left-3 top-2.5 text-slate-500"
                                            size={14}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                        {t('builder.step_image')}
                                    </label>
                                    <div
                                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 focus-within:ring-1 focus-within:ring-indigo-500 outline-none transition-all"
                                        onPaste={(e) => handlePaste(e, 'image')}
                                        tabIndex={0}
                                    >
                                        <div className="flex items-center gap-3">
                                            {currentStep.image_url ? (
                                                <div className="relative w-10 h-10 rounded overflow-hidden group/img shrink-0 border border-slate-700">
                                                    <img
                                                        src={
                                                            currentStep.image_url
                                                        }
                                                        alt="Step"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            handleStepChange(
                                                                'image_url',
                                                                ''
                                                            )
                                                        }
                                                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 text-rose-500 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-950 rounded flex items-center justify-center text-slate-700 shrink-0 border border-dashed border-slate-800">
                                                    <span className="text-[8px] font-bold">
                                                        {t('builder.no_img')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    type="text"
                                                    value={
                                                        currentStep.image_url ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        handleStepChange(
                                                            'image_url',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full bg-transparent text-[10px] text-slate-300 outline-none placeholder:text-slate-700"
                                                    placeholder={t(
                                                        'builder.image_placeholder'
                                                    )}
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={
                                                        handleStepImageUpload
                                                    }
                                                    className="hidden"
                                                    id="step-img-upload"
                                                />
                                                <label
                                                    htmlFor="step-img-upload"
                                                    className="inline-block text-[9px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer uppercase"
                                                >
                                                    [ {t('builder.upload_file')}{' '}
                                                    ]
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Editor */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                    {t('builder.step_content')}
                                </label>
                                <RichTextEditor
                                    value={currentStep.content}
                                    onChange={(val) =>
                                        handleStepChange('content', val)
                                    }
                                    placeholder={t(
                                        'builder.content_placeholder'
                                    )}
                                    onPaste={(e) => handlePaste(e, 'content')}
                                />
                            </div>

                            {/* INTERACTION CONFIG */}
                            <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                        <MousePointer size={12} />{' '}
                                        {t('builder.interaction')}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleStepChange(
                                                'interaction_type',
                                                'read'
                                            )
                                        }
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${currentStep.interaction_type === 'read' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                                    >
                                        {t('builder.read')}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleStepChange(
                                                'interaction_type',
                                                'find_part'
                                            )
                                        }
                                        disabled={!currentModel}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${currentStep.interaction_type === 'find_part' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                        title={
                                            !currentModel
                                                ? "Attach a model to use 'Find Part'"
                                                : ''
                                        }
                                    >
                                        {t('builder.find_part')}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleStepChange(
                                                'interaction_type',
                                                'quiz'
                                            )
                                        }
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${currentStep.interaction_type === 'quiz' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                                    >
                                        {t('builder.quiz')}
                                    </button>
                                </div>

                                {/* Quiz Specific Editor */}
                                {currentStep.interaction_type === 'quiz' &&
                                    (() => {
                                        const quizData =
                                            currentStep.interaction_data
                                                ? JSON.parse(
                                                      currentStep.interaction_data
                                                  )
                                                : {
                                                      type: 'single',
                                                      options: ['', ''],
                                                      correctIndex: 0,
                                                      correctIndices: [0],
                                                      targetMesh: '',
                                                  };

                                        const updateQuiz = (updates: any) => {
                                            handleStepChange(
                                                'interaction_data',
                                                JSON.stringify({
                                                    ...quizData,
                                                    ...updates,
                                                })
                                            );
                                        };

                                        return (
                                            <div className="space-y-3 bg-slate-950/50 p-3 rounded-lg border border-indigo-500/10 transition-all">
                                                <div className="flex gap-1 mb-2">
                                                    {(
                                                        [
                                                            'single',
                                                            'multiple',
                                                            'model_click',
                                                            'true_false',
                                                        ] as const
                                                    ).map((qt) => (
                                                        <button
                                                            key={qt}
                                                            onClick={() =>
                                                                updateQuiz({
                                                                    type: qt,
                                                                })
                                                            }
                                                            className={`flex-1 py-1 rounded text-[7px] font-bold uppercase transition-all ${quizData.type === qt ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}
                                                        >
                                                            {t(
                                                                `builder.quiz_types.${qt}`
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>

                                                {quizData.type ===
                                                'model_click' ? (
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-bold uppercase text-slate-500">
                                                            Correct Part (Mesh
                                                            Name)
                                                        </label>
                                                        <input
                                                            value={
                                                                quizData.targetMesh
                                                            }
                                                            onChange={(e) =>
                                                                updateQuiz({
                                                                    targetMesh:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Enter mesh name (e.g. Engine)..."
                                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                    </div>
                                                ) : quizData.type ===
                                                  'true_false' ? (
                                                    <div className="flex gap-2">
                                                        {['true', 'false'].map(
                                                            (val, i) => (
                                                                <button
                                                                    key={val}
                                                                    onClick={() =>
                                                                        updateQuiz(
                                                                            {
                                                                                correctIndex:
                                                                                    i,
                                                                            }
                                                                        )
                                                                    }
                                                                    className={`flex-1 py-2 rounded border text-[10px] font-bold transition-all ${quizData.correctIndex === i ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                                                                >
                                                                    {t(
                                                                        `builder.true_false.${val}`
                                                                    )}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <label className="block text-[9px] font-bold uppercase text-slate-500">
                                                            Question Options
                                                        </label>
                                                        {quizData.options.map(
                                                            (
                                                                opt: string,
                                                                i: number
                                                            ) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex gap-2 items-center"
                                                                >
                                                                    <input
                                                                        type={
                                                                            quizData.type ===
                                                                            'multiple'
                                                                                ? 'checkbox'
                                                                                : 'radio'
                                                                        }
                                                                        checked={
                                                                            quizData.type ===
                                                                            'multiple'
                                                                                ? (
                                                                                      quizData.correctIndices ||
                                                                                      []
                                                                                  ).includes(
                                                                                      i
                                                                                  )
                                                                                : quizData.correctIndex ===
                                                                                  i
                                                                        }
                                                                        onChange={() => {
                                                                            if (
                                                                                quizData.type ===
                                                                                'multiple'
                                                                            ) {
                                                                                const indices =
                                                                                    [
                                                                                        ...(quizData.correctIndices ||
                                                                                            []),
                                                                                    ];
                                                                                if (
                                                                                    indices.includes(
                                                                                        i
                                                                                    )
                                                                                ) {
                                                                                    updateQuiz(
                                                                                        {
                                                                                            correctIndices:
                                                                                                indices.filter(
                                                                                                    (
                                                                                                        idx
                                                                                                    ) =>
                                                                                                        idx !==
                                                                                                        i
                                                                                                ),
                                                                                        }
                                                                                    );
                                                                                } else {
                                                                                    updateQuiz(
                                                                                        {
                                                                                            correctIndices:
                                                                                                [
                                                                                                    ...indices,
                                                                                                    i,
                                                                                                ],
                                                                                        }
                                                                                    );
                                                                                }
                                                                            } else {
                                                                                updateQuiz(
                                                                                    {
                                                                                        correctIndex:
                                                                                            i,
                                                                                    }
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="accent-indigo-500"
                                                                    />
                                                                    <input
                                                                        value={
                                                                            opt
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const newOpts =
                                                                                [
                                                                                    ...quizData.options,
                                                                                ];
                                                                            newOpts[
                                                                                i
                                                                            ] =
                                                                                e.target.value;
                                                                            updateQuiz(
                                                                                {
                                                                                    options:
                                                                                        newOpts,
                                                                                }
                                                                            );
                                                                        }}
                                                                        placeholder={`Option ${i + 1}`}
                                                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                                    />
                                                                    {quizData
                                                                        .options
                                                                        .length >
                                                                        2 && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const newOpts =
                                                                                    quizData.options.filter(
                                                                                        (
                                                                                            _: any,
                                                                                            idx: number
                                                                                        ) =>
                                                                                            idx !==
                                                                                            i
                                                                                    );
                                                                                updateQuiz(
                                                                                    {
                                                                                        options:
                                                                                            newOpts,
                                                                                        correctIndex: 0,
                                                                                        correctIndices:
                                                                                            (
                                                                                                quizData.correctIndices ||
                                                                                                []
                                                                                            )
                                                                                                .filter(
                                                                                                    (
                                                                                                        idx: number
                                                                                                    ) =>
                                                                                                        idx !==
                                                                                                        i
                                                                                                )
                                                                                                .map(
                                                                                                    (
                                                                                                        idx: number
                                                                                                    ) =>
                                                                                                        idx >
                                                                                                        i
                                                                                                            ? idx -
                                                                                                              1
                                                                                                            : idx
                                                                                                ),
                                                                                    }
                                                                                );
                                                                            }}
                                                                            className="text-slate-600 hover:text-rose-500"
                                                                        >
                                                                            <Trash2
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                updateQuiz({
                                                                    options: [
                                                                        ...quizData.options,
                                                                        '',
                                                                    ],
                                                                })
                                                            }
                                                            className="w-full py-1 border border-dashed border-slate-700 rounded text-[10px] text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50"
                                                        >
                                                            + Add Option
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}

                                {/* Find Part Specific Editor */}
                                {currentStep.interaction_type === 'find_part' &&
                                    currentModel &&
                                    (() => {
                                        const data =
                                            currentStep.interaction_data
                                                ? JSON.parse(
                                                      currentStep.interaction_data
                                                  )
                                                : { targetMesh: '' };
                                        return (
                                            <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-indigo-500/10">
                                                <label className="block text-[9px] font-bold uppercase text-slate-500">
                                                    Target Mesh Name
                                                </label>
                                                <input
                                                    value={data.targetMesh}
                                                    onChange={(e) =>
                                                        handleStepChange(
                                                            'interaction_data',
                                                            JSON.stringify({
                                                                ...data,
                                                                targetMesh:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="Enter exact part name..."
                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                />
                                                <p className="text-[9px] text-slate-500 italic leading-tight">
                                                    Must match the mesh ID in
                                                    the 3D model (e.g.
                                                    'Engine_Block').
                                                </p>
                                            </div>
                                        );
                                    })()}

                                {/* Action Buttons */}
                                {currentModel && (
                                    <>
                                        <button
                                            onClick={handleStartPlacingHotspot}
                                            disabled={isPlacingHotspot}
                                            className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-xs transition-all ${
                                                isPlacingHotspot
                                                    ? 'bg-amber-600 text-white animate-pulse'
                                                    : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                                            }`}
                                        >
                                            <MapPin size={14} />
                                            {isPlacingHotspot
                                                ? t(
                                                      'builder.hotspot_instruction'
                                                  )
                                                : t('builder.place_hotspot')}
                                        </button>

                                        {currentStep.hotspot_id && (
                                            <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-400">
                                                <span className="font-bold">
                                                    ✓{' '}
                                                    {t(
                                                        'builder.hotspot_linked'
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleStepChange(
                                                            'hotspot_id',
                                                            ''
                                                        )
                                                    }
                                                    className="ml-auto hover:text-white"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT PANEL: 3D Preview (65%) --- */}
            <div className="flex-1 bg-black relative">
                {currentModel ? (
                    <>
                        {isPlacingHotspot && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-600 text-white px-4 py-2 rounded-full shadow-xl font-bold text-sm animate-bounce">
                                {t('builder.aim_click_tip')}
                            </div>
                        )}
                        <VRViewer
                            model={currentModel}
                            onExit={() => {}} // Disabled in builder
                            isEditMode={isPlacingHotspot}
                            onHotspotPlace={onHotspotPlace}
                            workshopMode={false}
                        />
                    </>
                ) : currentStep?.image_url ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-950">
                        <img
                            src={currentStep.image_url}
                            alt="Step Preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700 text-[10px] font-bold text-slate-400">
                            2D IMAGE PREVIEW
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                        <Layout size={48} className="mb-4 opacity-50" />
                        <p className="font-bold">
                            {t('builder.no_model_selected')}
                        </p>
                        <p className="text-sm">{t('builder.no_model_tip')}</p>
                    </div>
                )}
            </div>

            {/* --- MODAL: New Hotspot Details --- */}
            {showHotspotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl w-96 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">
                            {t('builder.define_hotspot')}
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                    {t('builder.hotspot_title')}
                                </label>
                                <input
                                    type="text"
                                    value={newHotspotTitle}
                                    onChange={(e) =>
                                        setNewHotspotTitle(e.target.value)
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                    {t('builder.hotspot_description')}
                                </label>
                                <textarea
                                    value={newHotspotDesc}
                                    onChange={(e) =>
                                        setNewHotspotDesc(e.target.value)
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowHotspotModal(false);
                                    setIsPlacingHotspot(false);
                                }}
                                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSaveHotspot}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg"
                            >
                                {t('builder.create_link')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: AI Lesson Generator --- */}
            {showAIModal && (
                <AILessonGeneratorModal
                    availableModels={availableModels}
                    currentModelId={currentStep?.model_id}
                    onClose={() => setShowAIModal(false)}
                    onGenerate={handleAIGeneratedSteps}
                />
            )}
        </div>
    );
};

export default WorkbookBuilder;

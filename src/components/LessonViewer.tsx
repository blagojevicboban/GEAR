import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Lesson, LessonStep, VETModel } from '../types';
import VRViewer from './VRViewer';
import CADViewer from './CADViewer';
import PDBViewer from './PDBViewer';
import { ChevronLeft, ChevronRight, X, Menu, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface LessonViewerProps {
    lessonId: string;
    onExit: () => void;
    currentUser: any;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId, onExit, currentUser }) => {
    const { t } = useTranslation();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Interaction State
    const [quizSelected, setQuizSelected] = useState<number | null>(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [findPartFeedback, setFindPartFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Reset interaction state on step change
    useEffect(() => {
        setQuizSelected(null);
        setQuizSubmitted(false);
        setFindPartFeedback(null);
    }, [currentStepIndex]);

    useEffect(() => {
        fetch(`/api/lessons/${lessonId}`)
            .then(res => res.json())
            .then(data => {
                setLesson(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [lessonId]);

    // Progress Tracking
    const recordProgress = async (status?: 'started' | 'completed', score?: number) => {
        if (!currentUser || !lessonId) return;
        try {
            await fetch(`/api/lessons/${lessonId}/attempt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Name': currentUser.username
                },
                body: JSON.stringify({
                    status,
                    score,
                    last_step: currentStepIndex
                })
            });
        } catch (e) {
            console.error("Progress save failed", e);
        }
    };

    // Initialize attempt
    useEffect(() => {
        if (!loading && lesson) {
            recordProgress('started');
        }
    }, [loading, lesson]);

    // Save step progress
    useEffect(() => {
        if (!loading && lesson) {
            recordProgress(undefined);
        }
    }, [currentStepIndex]);

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">{t('lessons.viewer.loading')}</div>;
    if (!lesson) return <div className="h-screen bg-black text-white flex items-center justify-center">{t('lessons.viewer.not_found')}</div>;

    const steps = lesson.steps || [];
    const totalSteps = steps.length;
    // Step 0 is the "Intro" effectively if we want? Or just start with Step 1?
    // Let's assume steps are the content. 
    // If steps is empty, show lesson description.

    const currentStep = steps[currentStepIndex];

    const handleObjectClick = (meshName: string) => {
        if (!currentStep || currentStep.interaction_type !== 'find_part') return;

        const data = currentStep.interaction_data ? JSON.parse(currentStep.interaction_data) : {};
        const target = data.targetMesh;

        if (!target) return;

        if (meshName === target) {
            setFindPartFeedback({ type: 'success', msg: t('lessons.viewer.find_success', { target }) });
            // Optional: Auto-advance after delay?
        } else {
            setFindPartFeedback({ type: 'error', msg: t('lessons.viewer.find_error', { meshName }) });
        }
    };

    // Helper to determine viewer type
    const renderViewer = () => {
        if (!currentStep) return null;

        // If no model, check for step image to show in main view
        if (!currentStep.model_id) {
            if (currentStep.image_url) {
                return (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                        <img src={currentStep.image_url} alt="Step" className="max-w-full max-h-full object-contain" />
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950">
                    <div className="text-6xl mb-4">📚</div>
                    <p>{t('lessons.viewer.no_model')}</p>
                </div>
            );
        }

        // We only have limited model info from the join (url, name).
        // ... (rest of model rendering logic)

        const modelStub: any = {
            id: currentStep.model_id,
            name: (currentStep as any).modelName || 'Lesson Model',
            description: 'Loaded from lesson step',
            modelUrl: (currentStep as any).modelUrl,
            hotspots: [],
            sector: lesson.sector,
            uploadedBy: lesson.authorName,
        };

        const url = modelStub.modelUrl?.toLowerCase() || '';

        if (url.endsWith('.pdb') || url.includes('#pdb')) {
            return <PDBViewer pdbUrl={url.replace('#pdb', '')} onExit={() => !isSidebarOpen ? setIsSidebarOpen(true) : onExit()} />;
        } else if (url.endsWith('.stp') || url.endsWith('.step') || url.includes('#step')) {
            return <CADViewer fileUrl={url.replace('#step', '')} onExit={() => !isSidebarOpen ? setIsSidebarOpen(true) : onExit()} fileName={modelStub.name} />;
        } else {
            return (
                <VRViewer
                    model={modelStub}
                    onExit={() => !isSidebarOpen ? setIsSidebarOpen(true) : onExit()}
                    workshopMode={false}
                    user={currentUser}
                    onObjectClick={handleObjectClick}
                />
            );
        }
    };

    const handleNext = () => {
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Finish
            recordProgress('completed', 100); // Score 100 for completion? Or calculate.
            onExit();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 overflow-hidden relative">

            {/* Sidebar (Content) */}
            <div
                className={`absolute inset-y-0 left-0 z-20 w-full md:w-[400px] bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">{t('lessons.viewer.interactive_lesson')}</h2>
                        <h1 className="text-xl font-bold text-white leading-tight">{lesson.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Toggle Sidebar (Mobile/Desktop) */}
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-lg">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={onExit} className="text-slate-500 hover:text-white transition-colors p-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
                    {currentStep ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                                    {t('lessons.viewer.step_x_of_y', { current: currentStepIndex + 1, total: totalSteps })}
                                </span>
                                <h3 className="text-lg font-semibold text-slate-200">{currentStep.title}</h3>
                            </div>

                            {/* Show image in sidebar if we have a model (since main view shows model) */}
                            {currentStep.model_id && currentStep.image_url && (
                                <div className="mb-6 rounded-lg overflow-hidden border border-slate-700">
                                    <img src={currentStep.image_url} alt="Step Visual" className="w-full h-auto object-cover" />
                                </div>
                            )}

                            <div
                                className="prose prose-invert prose-sm max-w-none text-slate-300"
                                dangerouslySetInnerHTML={{ __html: currentStep.content }}
                            />

                            {/* Interaction Area */}
                            <div className="mt-8">
                                {currentStep.interaction_type === 'quiz' && (() => {
                                    const data = currentStep.interaction_data ? JSON.parse(currentStep.interaction_data) : { options: [], correctIndex: 0 };
                                    const isCorrect = quizSelected === data.correctIndex;

                                    return (
                                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                <HelpCircle size={16} className="text-indigo-400" />
                                                {t('lessons.viewer.quiz')}
                                            </h4>
                                            <div className="space-y-2">
                                                {data.options.map((opt: string, i: number) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => !quizSubmitted && setQuizSelected(i)}
                                                        disabled={quizSubmitted}
                                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${quizSelected === i
                                                            ? 'bg-indigo-600/20 border-indigo-500 text-white border'
                                                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-700'
                                                            } ${quizSubmitted && i === data.correctIndex ? '!bg-emerald-500/20 !border-emerald-500 !text-emerald-400' : ''}
                                                          ${quizSubmitted && quizSelected === i && !isCorrect ? '!bg-rose-500/20 !border-rose-500 !text-rose-400' : ''}
                                                        `}
                                                    >
                                                        <span className="font-mono opacity-50 mr-2">{String.fromCharCode(65 + i)}.</span>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                            {!quizSubmitted && (
                                                <button
                                                    onClick={() => setQuizSubmitted(true)}
                                                    disabled={quizSelected === null}
                                                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold text-xs"
                                                >
                                                    {t('lessons.viewer.submit_answer')}
                                                </button>
                                            )}
                                            {quizSubmitted && (
                                                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                    {isCorrect ? t('lessons.viewer.correct_answer') : t('lessons.viewer.incorrect_answer')}
                                                    {!isCorrect && (
                                                        <button onClick={() => { setQuizSubmitted(false); setQuizSelected(null); }} className="ml-auto underline opacity-80">{t('lessons.viewer.retry')}</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {currentStep.interaction_type === 'find_part' && (() => {
                                    const data = currentStep.interaction_data ? JSON.parse(currentStep.interaction_data) : { targetMesh: '...' };
                                    return (
                                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                <CheckCircle size={16} className="text-indigo-400" />
                                                {t('lessons.viewer.find_task')}
                                            </h4>
                                            <p className="text-sm text-slate-300 mb-4">
                                                {t('lessons.viewer.find_instruction', { target: data.targetMesh })}
                                            </p>

                                            {findPartFeedback && (
                                                <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${findPartFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {findPartFeedback.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                    {findPartFeedback.msg}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-400">
                            <p className="mb-4">{lesson.description}</p>
                            <button onClick={() => setCurrentStepIndex(0)} className="text-indigo-400 underline">{t('lessons.viewer.start_first')}</button>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> {t('lessons.viewer.previous')}
                    </button>

                    <div className="flex gap-1">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${idx === currentStepIndex ? 'bg-indigo-500' : 'bg-slate-700'}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${currentStepIndex === totalSteps - 1
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                    >
                        {currentStepIndex === totalSteps - 1 ? (
                            <>{t('lessons.viewer.finish')} <CheckCircle size={16} /></>
                        ) : (
                            <>{t('lessons.viewer.next')} <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content (3D Viewer) */}
            <div className="flex-1 relative h-full bg-black">
                {/* Toggle Sidebar Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-4 left-4 z-10 p-2 bg-slate-900/80 backdrop-blur text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                    <Menu size={20} />
                </button>

                {/* Viewer */}
                <div className="w-full h-full">
                    {renderViewer()}
                </div>
            </div>

        </div>
    );
};

export default LessonViewer;

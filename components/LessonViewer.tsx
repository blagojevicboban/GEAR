import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Lesson, LessonStep, VETModel } from '../types';
import VRViewer from './VRViewer';
import CADViewer from './CADViewer';
import PDBViewer from './PDBViewer';
import { ChevronLeft, ChevronRight, X, Menu } from 'lucide-react';

interface LessonViewerProps {
    lessonId: string;
    onExit: () => void;
    currentUser: any;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId, onExit, currentUser }) => {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Lesson...</div>;
    if (!lesson) return <div className="h-screen bg-black text-white flex items-center justify-center">Lesson not found.</div>;

    const steps = lesson.steps || [];
    const totalSteps = steps.length;
    // Step 0 is the "Intro" effectively if we want? Or just start with Step 1?
    // Let's assume steps are the content. 
    // If steps is empty, show lesson description.

    const currentStep = steps[currentStepIndex];

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
                    <p>No model attached to this step.</p>
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
                />
            );
        }
    };

    const handleNext = () => {
        if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(prev => prev + 1);
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
                        <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Interactive Lesson</h2>
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
                                    Step {currentStepIndex + 1} of {totalSteps}
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
                        </div>
                    ) : (
                        <div className="text-slate-400">
                            <p className="mb-4">{lesson.description}</p>
                            <button onClick={() => setCurrentStepIndex(0)} className="text-indigo-400 underline">Start First Step</button>
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
                        <ChevronLeft size={16} /> Previous
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
                        disabled={currentStepIndex === totalSteps - 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next <ChevronRight size={16} />
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

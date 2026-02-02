import { useState } from 'react';
import { Sparkles, X, Loader2, BookOpen } from 'lucide-react';
import { VETModel, EquipmentLevel } from '../types';

interface AILessonGeneratorModalProps {
    availableModels: VETModel[];
    currentModelId?: string;
    onClose: () => void;
    onGenerate: (steps: any[]) => void;
}

const AILessonGeneratorModal: React.FC<AILessonGeneratorModalProps> = ({
    availableModels,
    currentModelId,
    onClose,
    onGenerate,
}) => {
    // const { t } = useTranslation(); // translations todo
    const [selectedModelId, setSelectedModelId] = useState(
        currentModelId || availableModels[0]?.id || ''
    );
    const [level, setLevel] = useState<EquipmentLevel>(
        EquipmentLevel.INTERMEDIATE
    );
    const [topic, setTopic] = useState('');
    const [stepCount, setStepCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        const model = availableModels.find((m) => m.id === selectedModelId);
        if (!model) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/models/ai/generate-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modelName: model.name,
                    modelDescription: model.description,
                    level: level,
                    topic: topic,
                    stepCount: stepCount,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Generation failed');
            }

            const data = await res.json();

            // Attach the model_id to every step since the API doesn't know our DB IDs
            const stepsWithModel = data.steps.map((s: any) => ({
                ...s,
                model_id: selectedModelId,
            }));

            onGenerate(stepsWithModel);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-indigo-900/20 p-4 border-b border-indigo-500/20 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-amber-400" />
                        AI Lesson Generator
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-rose-900/20 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Model Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Target Model
                        </label>
                        <select
                            value={selectedModelId}
                            onChange={(e) => setSelectedModelId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {availableModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.equipmentType})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Level & Steps Row */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Difficulty Level
                            </label>
                            <select
                                value={level}
                                onChange={(e) =>
                                    setLevel(e.target.value as EquipmentLevel)
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value={EquipmentLevel.BASIC}>
                                    Basic / Beginner
                                </option>
                                <option value={EquipmentLevel.INTERMEDIATE}>
                                    Intermediate
                                </option>
                                <option value={EquipmentLevel.ADVANCED}>
                                    Advanced / Expert
                                </option>
                            </select>
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Num Steps
                            </label>
                            <input
                                type="number"
                                min={3}
                                max={10}
                                value={stepCount}
                                onChange={(e) =>
                                    setStepCount(Number(e.target.value))
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Topic Focus */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Topic Focus (Optional)
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Diagnosis, Maintenance, Safety Procedures..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                        />
                    </div>

                    {/* Pedagogy Note */}
                    <div className="flex gap-3 p-3 bg-indigo-500/10 rounded-lg">
                        <BookOpen
                            size={16}
                            className="text-indigo-400 shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-indigo-300/80">
                            The AI will generate structured steps with
                            educational content and suggested interaction points
                            based on the model&apos;s geometry.
                        </p>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !selectedModelId}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" /> Generating
                                Plan...
                            </>
                        ) : (
                            <>
                                <Sparkles className="fill-white/20" /> Generate
                                Lesson
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AILessonGeneratorModal;

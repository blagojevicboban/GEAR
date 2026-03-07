import React, { useState, useEffect } from 'react';
import { PhysicsEngine, MaterialProperties } from '../utils/PhysicsEngine';
import { EvidenceManager, EvidenceReceipt } from '../utils/EvidenceManager';
import { FileCheck, ShieldCheck, Search, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CrystalStructureViewer from './CrystalStructureViewer';

interface Material {
    id: string;
    name: string;
    formula: string;
    properties: MaterialProperties;
}

const MaterialSelector: React.FC = () => {
    const { t } = useTranslation();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
        null
    );
    const [thickness, setThickness] = useState<number>(3); // mm
    const [power, setPower] = useState<number>(80); // Watts
    const [cuttingSpeed, setCuttingSpeed] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('Si'); // Default search
    const [receipt, setReceipt] = useState<EvidenceReceipt | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchMaterials = (query: string) => {
        setLoading(true);
        setApiError(null);
        fetch(`/api/materials/search?query=${query}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setApiError(data.error);
                }
                if (data.data && Array.isArray(data.data)) {
                    // Map API response to our internal structure
                    const mappedMaterials = data.data.map((m: any) => ({
                        id: m.id,
                        name: m.name,
                        formula: m.formula,
                        properties: {
                            density: m.density,
                            thermalConductivity: 150, // Default fallback as API might not return it
                            meltingPoint: 1400, // Default fallback
                            elasticity: 0, // Default
                        },
                    }));
                    setMaterials(mappedMaterials);
                    if (mappedMaterials.length > 0)
                        setSelectedMaterial(mappedMaterials[0]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch materials:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchMaterials(searchQuery); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    useEffect(() => {
        if (selectedMaterial) {
            const speed = PhysicsEngine.calculateLaserCuttingSpeed(
                selectedMaterial.properties,
                {
                    power: power,
                    speed: 0, // Not used in input, calculated output
                    thickness: thickness,
                }
            );
            setCuttingSpeed(speed); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [selectedMaterial, thickness, power]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMaterials(searchQuery);
    };

    const handleCompleteSimulation = async () => {
        if (!selectedMaterial || cuttingSpeed === null) return;

        try {
            const result = await EvidenceManager.submitEvidence({
                userId: 'student-demo-123', // In real app, from Auth Context
                simulationId: 'sim-laser-cutter-01',
                parameters: {
                    material: selectedMaterial.name,
                    thickness: thickness,
                    power: power,
                },
                result: {
                    estimatedSpeed: cuttingSpeed,
                    efficiency: power / thickness, // rough metric
                },
            });
            setReceipt(result);
        } catch (e) {
            alert('Failed to generate evidence log.');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-500/30 rounded-3xl p-8 max-w-lg shadow-xl dark:shadow-[0_0_25px_rgba(20,184,166,0.15)] transition-all duration-300">
            <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-6 tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-8 h-8" />
                {t('materials.title')}
            </h2>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="mb-6 relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Formula (e.g. SiO2, Au)"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl p-4 pl-12 border border-slate-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-teal-500 outline-none uppercase transition-all shadow-sm"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                <button
                    type="submit"
                    className="absolute right-2.5 top-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-md shadow-teal-900/10"
                >
                    {t('common.search')}
                </button>
            </form>

            {apiError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
                    <div className="p-1 bg-red-500/20 rounded-full mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                        <h4 className="text-red-400 text-sm font-bold">
                            API Error (Using Mock Data)
                        </h4>
                        <p className="text-red-300 text-xs mt-1">{apiError}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <label className="block text-slate-500 dark:text-slate-400 text-sm font-semibold mb-3 ml-1">
                            {t('materials.usage')}
                        </label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl p-4 border border-slate-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-teal-500 outline-none transition-all appearance-none shadow-sm"
                            value={selectedMaterial?.id || ''}
                            onChange={(e) =>
                                setSelectedMaterial(
                                    materials.find(
                                        (m) => m.id === e.target.value
                                    ) || null
                                )
                            }
                        >
                            {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.formula}) - [{m.id}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Crystal Structure Viewer & Integrated Calculator */}
                    {selectedMaterial &&
                        selectedMaterial.id.startsWith('mp-') && (
                            <div className="mb-4">
                                <CrystalStructureViewer
                                    materialId={selectedMaterial.id}
                                    formula={selectedMaterial.formula}
                                    onSpeedChange={(speed) =>
                                        setCuttingSpeed(speed)
                                    }
                                />
                            </div>
                        )}

                    {!selectedMaterial?.id.startsWith('mp-') && (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-slate-500 dark:text-slate-400 text-sm font-semibold mb-3 ml-1">
                                        Thickness (mm)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl p-4 border border-slate-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-teal-500 outline-none transition-all shadow-sm"
                                        value={thickness}
                                        onChange={(e) =>
                                            setThickness(Number(e.target.value))
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-500 dark:text-slate-400 text-sm font-semibold mb-3 ml-1">
                                        Laser Power (W)
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="150"
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-4 transition-all"
                                        value={power}
                                        onChange={(e) =>
                                            setPower(Number(e.target.value))
                                        }
                                    />
                                    <div className="text-right text-xs text-teal-400 mt-1">
                                        {power} W
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-teal-500/30 rounded-3xl p-6 mt-8 mb-8 text-center transition-all">
                                <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                    Calculated Cutting Speed
                                </div>
                                <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white">
                                    {cuttingSpeed
                                        ? cuttingSpeed.toFixed(2)
                                        : '---'}{' '}
                                    <span className="text-base font-sans text-slate-400 dark:text-slate-500">
                                        mm/s
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {!receipt ? (
                        <button
                            onClick={handleCompleteSimulation}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-900/20 active:scale-[0.98]"
                        >
                            <FileCheck className="w-6 h-6" />
                            {t('evidence.generate_btn')}
                        </button>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/50 rounded-2xl p-6 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-3 text-green-600 dark:text-green-400 font-bold mb-4">
                                <ShieldCheck className="w-6 h-6" />
                                <span className="text-lg">{t('evidence.title')} Generated</span>
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 font-mono break-all bg-white dark:bg-black/30 p-3 rounded-xl mb-3 border border-green-100 dark:border-green-900/50 shadow-sm">
                                SESSION: {receipt.sessionId}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono break-all px-1">
                                SIG: {receipt.signature}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MaterialSelector;

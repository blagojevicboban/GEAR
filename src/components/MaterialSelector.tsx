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
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
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
            .then(res => res.json())
            .then(data => {
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
                            elasticity: 0 // Default
                        }
                    }));
                    setMaterials(mappedMaterials);
                    if (mappedMaterials.length > 0) setSelectedMaterial(mappedMaterials[0]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch materials:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchMaterials(searchQuery);
    }, []);

    useEffect(() => {
        if (selectedMaterial) {
            const speed = PhysicsEngine.calculateLaserCuttingSpeed(
                selectedMaterial.properties,
                {
                    power: power,
                    speed: 0, // Not used in input, calculated output
                    thickness: thickness
                }
            );
            setCuttingSpeed(speed);
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
                    power: power
                },
                result: {
                    estimatedSpeed: cuttingSpeed,
                    efficiency: power / thickness // rough metric
                }
            });
            setReceipt(result);
        } catch (e) {
            alert('Failed to generate evidence log.');
        }
    };

    return (
        <div className="bg-gray-900 border border-teal-500 rounded-lg p-6 max-w-md shadow-[0_0_15px_rgba(20,184,166,0.5)]">
            <h2 className="text-2xl font-bold text-teal-400 mb-4 tracking-wider flex items-center gap-2">
                {t('materials.title')}
            </h2>
            
            {/* Search Box */}
            <form onSubmit={handleSearch} className="mb-4 relative">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Formula (e.g. SiO2, Au)"
                    className="w-full bg-gray-800 text-white rounded p-2 pl-9 border border-gray-700 focus:border-teal-500 outline-none uppercase"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <button 
                    type="submit"
                    className="absolute right-2 top-2 bg-teal-600 hover:bg-teal-500 text-white text-xs px-2 py-1 rounded"
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
                        <h4 className="text-red-400 text-sm font-bold">API Error (Using Mock Data)</h4>
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
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">{t('materials.usage')}</label>
                        <select 
                            className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-teal-500 outline-none"
                            value={selectedMaterial?.id || ''}
                            onChange={(e) => setSelectedMaterial(materials.find(m => m.id === e.target.value) || null)}
                        >
                            {materials.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.formula}) - [{m.id}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Crystal Structure Viewer */}
                    {selectedMaterial && selectedMaterial.id.startsWith('mp-') && (
                        <div className="mb-4">
                            <CrystalStructureViewer
                                materialId={selectedMaterial.id}
                                formula={selectedMaterial.formula}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Thickness (mm)</label>
                            <input 
                                type="number" 
                                min="1" max="20"
                                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                                value={thickness}
                                onChange={(e) => setThickness(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Laser Power (W)</label>
                            <input 
                                type="range" 
                                min="10" max="150"
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-3"
                                value={power}
                                onChange={(e) => setPower(Number(e.target.value))}
                            />
                            <div className="text-right text-xs text-teal-400 mt-1">{power} W</div>
                        </div>
                    </div>

                    <div className="bg-black/50 rounded p-4 mt-6 border-l-4 border-teal-500 mb-6">
                        <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Calculated Cutting Speed</div>
                        <div className="text-3xl font-mono text-white">
                            {cuttingSpeed} <span className="text-sm text-gray-500">mm/s</span>
                        </div>
                        
                        {selectedMaterial && selectedMaterial.properties && (
                            <div className="mt-2 text-xs text-gray-500 font-mono">
                                Density: {selectedMaterial.properties.density.toFixed(2)} g/cm³ <br/>
                                Formula: {selectedMaterial.formula} <br/>
                                <span className="text-teal-600">Source: Materials Project API (v2)</span>
                            </div>
                        )}
                    </div>

                    {!receipt ? (
                        <button
                            onClick={handleCompleteSimulation}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded transition-all flex items-center justify-center gap-2"
                        >
                            <FileCheck className="w-5 h-5" />
                            {t('evidence.generate_btn')}
                        </button>
                    ) : (
                        <div className="bg-green-900/30 border border-green-500 rounded p-4 animate-in fade-in zoom-in">
                            <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                <ShieldCheck className="w-5 h-5" />
                                {t('evidence.title')} Generated
                            </div>
                            <div className="text-xs text-green-300 font-mono break-all bg-black/30 p-2 rounded mb-2">
                                SESSION: {receipt.sessionId}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono break-all">
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

import React, { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPES from 'three';
const THREE = (window as any).THREE as typeof THREE_TYPES;

// Element color map (CPK coloring)
const ELEMENT_COLORS: Record<string, number> = {
    H: 0xffffff, He: 0xd9ffff, Li: 0xcc80ff, Be: 0xc2ff00, B: 0xffb5b5,
    C: 0x909090, N: 0x3050f8, O: 0xff0d0d, F: 0x90e050, Ne: 0xb3e3f5,
    Na: 0xab5cf2, Mg: 0x8aff00, Al: 0xbfa6a6, Si: 0xf0c8a0, P: 0xff8000,
    S: 0xffff30, Cl: 0x1ff01f, Ar: 0x80d1e3, K: 0x8f40d4, Ca: 0x3dff00,
    Sc: 0xe6e6e6, Ti: 0xbfc2c7, V: 0xa6a6ab, Cr: 0x8a99c7, Mn: 0x9c7ac7,
    Fe: 0xe06633, Co: 0xf090a0, Ni: 0x50d050, Cu: 0xc88033, Zn: 0x7d80b0,
    Ga: 0xc28f8f, Ge: 0x668f8f, As: 0xbd80e3, Se: 0xffa100, Br: 0xa62929,
    Rb: 0x702eb0, Sr: 0x00ff00, Y: 0x94ffff, Zr: 0x94e0e0, Nb: 0x73c2c9,
    Mo: 0x54b5b5, Ru: 0x248f8f, Rh: 0x0a7d8c, Pd: 0x006985, Ag: 0xc0c0c0,
    Cd: 0xffd98f, In: 0xa67573, Sn: 0x668080, Sb: 0x9e63b5, Te: 0xd47a00,
    I: 0x940094, Ba: 0x00c900, La: 0x70d4ff, Ce: 0xffffc7, Pt: 0xd0d0e0,
    Au: 0xffd123, Pb: 0x575961, Bi: 0x9e4fb5, U: 0x008fff,
};

// Element radius map (approximate covalent radii in Angstroms)
const ELEMENT_RADII: Record<string, number> = {
    H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71,
    O: 0.66, F: 0.57, Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07,
    S: 1.05, Cl: 1.02, K: 2.03, Ca: 1.76, Ti: 1.60, V: 1.53, Cr: 1.39,
    Mn: 1.39, Fe: 1.32, Co: 1.26, Ni: 1.24, Cu: 1.32, Zn: 1.22, Ga: 1.22,
    Ge: 1.20, As: 1.19, Se: 1.20, Br: 1.20, Sr: 2.15, Zr: 1.75, Mo: 1.54,
    Ag: 1.45, Sn: 1.39, Ba: 2.15, Au: 1.36, Pb: 1.46, Bi: 1.48, U: 1.96,
};

interface CrystalStructureViewerProps {
    materialId: string;
    formula: string;
}

interface StructureData {
    materialId: string;
    formula: string;
    // Summary properties
    energy_above_hull: number;
    band_gap: number;
    formation_energy_per_atom: number;
    ordering: string;
    total_magnetization: number;
    is_stable: boolean;
    density: number;
    nsites: number;
    volume: number;
    theoretical: boolean;
    // Symmetry
    symmetry: {
        crystal_system: string;
        symbol: string;
        number: number;
        point_group: string;
    } | null;
    // Lattice
    lattice: {
        matrix: number[][];
        a: number;
        b: number;
        c: number;
        alpha: number;
        beta: number;
        gamma: number;
        volume: number;
    } | null;
    // Sites
    sites: {
        element: string;
        xyz: number[];
        abc: number[];
    }[];
}

// Magnetic ordering label map
const ORDERING_LABELS: Record<string, string> = {
    NM: 'Non-magnetic',
    FM: 'Ferromagnetic',
    AFM: 'Antiferromagnetic',
    FiM: 'Ferrimagnetic',
};

// Helper: property row
const PropRow: React.FC<{ label: string; value: string | number | React.ReactNode; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50 last:border-0">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="text-white text-xs font-medium">
            {value}{unit && <span className="text-gray-500 ml-1">{unit}</span>}
        </span>
    </div>
);

// Helper: section card
const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3">
        <h4 className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">{title}</h4>
        {children}
    </div>
);

const CrystalStructureViewer: React.FC<CrystalStructureViewerProps> = ({
    materialId,
    formula,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [structureData, setStructureData] = useState<StructureData | null>(null);
    const rendererRef = useRef<any>(null);
    const animFrameRef = useRef<number>(0);
    const [showAtomicPositions, setShowAtomicPositions] = useState(false);

    // Fetch structure data
    useEffect(() => {
        if (!materialId) return;

        setLoading(true);
        setError(null);

        fetch(`/api/materials/structure/${materialId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }
                if (data.data) {
                    setStructureData(data.data);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError('Failed to fetch structure: ' + err.message);
                setLoading(false);
            });
    }, [materialId]);

    // Render 3D structure
    useEffect(() => {
        if (!containerRef.current || !structureData || !structureData.lattice || !structureData.sites?.length) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0f);

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);
        const backLight = new THREE.DirectionalLight(0x4488ff, 0.3);
        backLight.position.set(-5, -5, -5);
        scene.add(backLight);

        // Build Structure
        const structureGroup = new THREE.Group();
        scene.add(structureGroup);

        const sites = structureData.sites;
        const latticeMatrix = structureData.lattice!.matrix;

        // Calculate center of all atoms
        let centerX = 0, centerY = 0, centerZ = 0;
        sites.forEach((site) => {
            centerX += site.xyz[0];
            centerY += site.xyz[1];
            centerZ += site.xyz[2];
        });
        centerX /= sites.length;
        centerY /= sites.length;
        centerZ /= sites.length;

        // Add Atoms as spheres
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

        sites.forEach((site) => {
            const element = site.element;
            const color = ELEMENT_COLORS[element] || 0x888888;
            const radius = (ELEMENT_RADII[element] || 1.0) * 0.35; // Scale down for visibility

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.3,
                metalness: 0.6,
            });

            const mesh = new THREE.Mesh(sphereGeometry, material);
            mesh.position.set(
                site.xyz[0] - centerX,
                site.xyz[1] - centerY,
                site.xyz[2] - centerZ
            );
            mesh.scale.setScalar(radius);
            structureGroup.add(mesh);
        });

        // Draw unit cell edges
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x44ffaa,
            opacity: 0.5,
            transparent: true,
        });

        // Origin (relative to center)
        const o = new THREE.Vector3(-centerX, -centerY, -centerZ);
        const a = new THREE.Vector3(latticeMatrix[0][0], latticeMatrix[0][1], latticeMatrix[0][2]);
        const b = new THREE.Vector3(latticeMatrix[1][0], latticeMatrix[1][1], latticeMatrix[1][2]);
        const c = new THREE.Vector3(latticeMatrix[2][0], latticeMatrix[2][1], latticeMatrix[2][2]);

        // 12 edges of the parallelepiped
        const edges = [
            [o, o.clone().add(a)],
            [o, o.clone().add(b)],
            [o, o.clone().add(c)],
            [o.clone().add(a), o.clone().add(a).add(b)],
            [o.clone().add(a), o.clone().add(a).add(c)],
            [o.clone().add(b), o.clone().add(b).add(a)],
            [o.clone().add(b), o.clone().add(b).add(c)],
            [o.clone().add(c), o.clone().add(c).add(a)],
            [o.clone().add(c), o.clone().add(c).add(b)],
            [o.clone().add(a).add(b), o.clone().add(a).add(b).add(c)],
            [o.clone().add(a).add(c), o.clone().add(a).add(b).add(c)],
            [o.clone().add(b).add(c), o.clone().add(a).add(b).add(c)],
        ];

        edges.forEach(([start, end]) => {
            const points = [start, end];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            structureGroup.add(line);
        });

        // Draw bonds (connect atoms within bonding distance)
        const bondMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.3,
        });
        const bondGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1, 8);
        bondGeometry.rotateX(Math.PI / 2);

        for (let i = 0; i < sites.length; i++) {
            for (let j = i + 1; j < sites.length; j++) {
                const dx = sites[i].xyz[0] - sites[j].xyz[0];
                const dy = sites[i].xyz[1] - sites[j].xyz[1];
                const dz = sites[i].xyz[2] - sites[j].xyz[2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                const r1 = ELEMENT_RADII[sites[i].element] || 1.5;
                const r2 = ELEMENT_RADII[sites[j].element] || 1.5;
                const maxBondDist = (r1 + r2) * 1.3; // 130% of sum of covalent radii

                if (dist < maxBondDist && dist > 0.1) {
                    const start = new THREE.Vector3(
                        sites[i].xyz[0] - centerX,
                        sites[i].xyz[1] - centerY,
                        sites[i].xyz[2] - centerZ
                    );
                    const end = new THREE.Vector3(
                        sites[j].xyz[0] - centerX,
                        sites[j].xyz[1] - centerY,
                        sites[j].xyz[2] - centerZ
                    );

                    const mid = start.clone().add(end).multiplyScalar(0.5);
                    const direction = end.clone().sub(start);
                    const length = direction.length();

                    const bond = new THREE.Mesh(bondGeometry.clone(), bondMaterial);
                    bond.position.copy(mid);
                    bond.scale.set(1, 1, length);
                    bond.lookAt(end);
                    structureGroup.add(bond);
                }
            }
        }

        // Add axis arrows
        const axisLength = 1.0;
        const arrowX = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(-centerX - 1, -centerY - 1, -centerZ - 1),
            axisLength, 0xff0000, 0.2, 0.1
        );
        const arrowY = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0), new THREE.Vector3(-centerX - 1, -centerY - 1, -centerZ - 1),
            axisLength, 0x00ff00, 0.2, 0.1
        );
        const arrowZ = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(-centerX - 1, -centerY - 1, -centerZ - 1),
            axisLength, 0x0044ff, 0.2, 0.1
        );
        structureGroup.add(arrowX);
        structureGroup.add(arrowY);
        structureGroup.add(arrowZ);

        // Camera Position
        const maxDim = Math.max(
            structureData.lattice!.a,
            structureData.lattice!.b,
            structureData.lattice!.c
        );
        camera.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
        camera.lookAt(0, 0, 0);

        // Simple orbit (mouse-driven rotation)
        let isDragging = false;
        let previousMouseX = 0;
        let previousMouseY = 0;
        let rotationX = 0;
        let rotationY = 0;

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaX = e.clientX - previousMouseX;
            const deltaY = e.clientY - previousMouseY;
            rotationY += deltaX * 0.005;
            rotationX += deltaY * 0.005;
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        };
        const onMouseUp = () => { isDragging = false; };

        // Touch support
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                isDragging = true;
                previousMouseX = e.touches[0].clientX;
                previousMouseY = e.touches[0].clientY;
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isDragging || e.touches.length !== 1) return;
            const deltaX = e.touches[0].clientX - previousMouseX;
            const deltaY = e.touches[0].clientY - previousMouseY;
            rotationY += deltaX * 0.005;
            rotationX += deltaY * 0.005;
            previousMouseX = e.touches[0].clientX;
            previousMouseY = e.touches[0].clientY;
        };
        const onTouchEnd = () => { isDragging = false; };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('mouseleave', onMouseUp);
        renderer.domElement.addEventListener('touchstart', onTouchStart);
        renderer.domElement.addEventListener('touchmove', onTouchMove);
        renderer.domElement.addEventListener('touchend', onTouchEnd);

        // Zoom
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const dir = camera.position.clone().normalize();
            camera.position.addScaledVector(dir, e.deltaY * 0.01);
        };
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        // Auto-rotate (slow)
        let autoRotate = true;

        // Animation Loop
        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);

            if (autoRotate && !isDragging) {
                rotationY += 0.003;
            }

            structureGroup.rotation.x = rotationX;
            structureGroup.rotation.y = rotationY;

            renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        // Toggle auto-rotate on click
        const toggleAutoRotate = () => { autoRotate = !autoRotate; };
        renderer.domElement.addEventListener('dblclick', toggleAutoRotate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('resize', onResize);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('mouseleave', onMouseUp);
            renderer.domElement.removeEventListener('touchstart', onTouchStart);
            renderer.domElement.removeEventListener('touchmove', onTouchMove);
            renderer.domElement.removeEventListener('touchend', onTouchEnd);
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('dblclick', toggleAutoRotate);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [structureData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">Loading Structure...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-32 bg-red-900/20 rounded-lg border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (!structureData) return null;

    // Get unique elements for the sites table
    const uniqueSites = structureData.sites.reduce((acc, site) => {
        const existing = acc.find(s => s.element === site.element);
        if (!existing) {
            acc.push({ ...site, count: 1 });
        } else {
            existing.count++;
        }
        return acc;
    }, [] as (typeof structureData.sites[0] & { count: number })[]);

    return (
        <div className="space-y-3">
            {/* 3D Structure Viewer */}
            <div className="rounded-lg border border-gray-700 bg-gray-900" style={{ overflow: 'hidden', position: 'relative', zIndex: 0 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800/80 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                        <span className="text-white text-sm font-bold">{formula}</span>
                        <span className="text-gray-500 text-xs">{materialId}</span>
                    </div>
                    {structureData.lattice && (
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>a={structureData.lattice.a.toFixed(2)}Å</span>
                            <span>b={structureData.lattice.b.toFixed(2)}Å</span>
                            <span>c={structureData.lattice.c.toFixed(2)}Å</span>
                        </div>
                    )}
                </div>

                {/* 3D Viewer */}
                <div
                    ref={containerRef}
                    style={{ width: '100%', height: '250px', cursor: 'grab', overflow: 'hidden', position: 'relative' }}
                />

                {/* Viewer Footer */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 border-t border-gray-700 text-xs text-gray-500">
                    <span>{structureData.nsites} atoms • V={structureData.volume?.toFixed(1)} ų</span>
                    <span className="italic">Drag • Scroll • Dbl-click</span>
                </div>
            </div>

            {/* Summary Properties Card */}
            <InfoCard title="Summary">
                <PropRow label="Energy Above Hull" value={structureData.energy_above_hull?.toFixed(3)} unit="eV/atom" />
                <PropRow label="Band Gap" value={structureData.band_gap?.toFixed(2)} unit="eV" />
                <PropRow label="Formation Energy" value={structureData.formation_energy_per_atom?.toFixed(3)} unit="eV/atom" />
                <PropRow label="Density" value={structureData.density?.toFixed(2)} unit="g/cm³" />
                <PropRow label="Magnetic Ordering" value={ORDERING_LABELS[structureData.ordering] || structureData.ordering} />
                <PropRow label="Total Magnetization" value={structureData.total_magnetization?.toFixed(2)} unit="µB/f.u." />
                <PropRow label="Experimentally Observed" value={structureData.theoretical ? 'No' : 'Yes'} />
                <PropRow label="Stable" value={
                    <span className={structureData.is_stable ? 'text-green-400' : 'text-red-400'}>
                        {structureData.is_stable ? '✓ Yes' : '✗ No'}
                    </span>
                } />
            </InfoCard>

            {/* Symmetry + Lattice Row */}
            <div className="grid grid-cols-2 gap-3">
                {/* Symmetry */}
                {structureData.symmetry && (
                    <InfoCard title="Symmetry">
                        <PropRow label="Crystal System" value={structureData.symmetry.crystal_system} />
                        <PropRow label="Space Group" value={structureData.symmetry.symbol} />
                        <PropRow label="Number" value={structureData.symmetry.number} />
                        <PropRow label="Point Group" value={structureData.symmetry.point_group} />
                    </InfoCard>
                )}

                {/* Lattice */}
                {structureData.lattice && (
                    <InfoCard title="Lattice">
                        <PropRow label="a" value={structureData.lattice.a.toFixed(2)} unit="Å" />
                        <PropRow label="b" value={structureData.lattice.b.toFixed(2)} unit="Å" />
                        <PropRow label="c" value={structureData.lattice.c.toFixed(2)} unit="Å" />
                        <PropRow label="α" value={structureData.lattice.alpha.toFixed(1)} unit="°" />
                        <PropRow label="β" value={structureData.lattice.beta.toFixed(1)} unit="°" />
                        <PropRow label="γ" value={structureData.lattice.gamma.toFixed(1)} unit="°" />
                        <PropRow label="Volume" value={structureData.lattice.volume.toFixed(2)} unit="ų" />
                    </InfoCard>
                )}
            </div>

            {/* Atomic Positions (collapsible) */}
            {uniqueSites.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3">
                    <button
                        onClick={() => setShowAtomicPositions(!showAtomicPositions)}
                        className="w-full flex items-center justify-between cursor-pointer"
                    >
                        <h4 className="text-teal-400 text-xs font-semibold uppercase tracking-wider">
                            Atomic Positions ({structureData.sites.length})
                        </h4>
                        <span className="text-gray-400 text-xs transition-transform" style={{ transform: showAtomicPositions ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            ▼
                        </span>
                    </button>
                    {showAtomicPositions && (
                        <div className="overflow-x-auto mt-2">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="text-left py-1 pr-2">Element</th>
                                        <th className="text-right py-1 px-2">x</th>
                                        <th className="text-right py-1 px-2">y</th>
                                        <th className="text-right py-1 pl-2">z</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {structureData.sites.map((site, i) => (
                                        <tr key={i} className="border-b border-gray-700/30 last:border-0">
                                            <td className="py-1 pr-2 text-teal-300 font-medium">{site.element}</td>
                                            <td className="text-right py-1 px-2 text-white">{site.abc[0].toFixed(4)}</td>
                                            <td className="text-right py-1 px-2 text-white">{site.abc[1].toFixed(4)}</td>
                                            <td className="text-right py-1 pl-2 text-white">{site.abc[2].toFixed(4)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CrystalStructureViewer;

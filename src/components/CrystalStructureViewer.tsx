import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Maximize2,
    Rotate3d,
    Box,
    Radius,
    Activity,
    Settings,
} from 'lucide-react';
import type * as THREE_TYPES from 'three';
const THREE = (window as any).THREE as typeof THREE_TYPES;
import { ARButton } from '../lib/three-examples/webxr/ARButton.js';

// Element color map (CPK coloring)
const ELEMENT_COLORS: Record<string, number> = {
    H: 0xffffff,
    He: 0xd9ffff,
    Li: 0xcc80ff,
    Be: 0xc2ff00,
    B: 0xffb5b5,
    C: 0x909090,
    N: 0x3050f8,
    O: 0xff0d0d,
    F: 0x90e050,
    Ne: 0xb3e3f5,
    Na: 0xab5cf2,
    Mg: 0x8aff00,
    Al: 0xbfa6a6,
    Si: 0xf0c8a0,
    P: 0xff8000,
    S: 0xffff30,
    Cl: 0x1ff01f,
    Ar: 0x80d1e3,
    K: 0x8f40d4,
    Ca: 0x3dff00,
    Sc: 0xe6e6e6,
    Ti: 0xbfc2c7,
    V: 0xa6a6ab,
    Cr: 0x8a99c7,
    Mn: 0x9c7ac7,
    Fe: 0xe06633,
    Co: 0xf090a0,
    Ni: 0x50d050,
    Cu: 0xc88033,
    Zn: 0x7d80b0,
    Ga: 0xc28f8f,
    Ge: 0x668f8f,
    As: 0xbd80e3,
    Se: 0xffa100,
    Br: 0xa62929,
    Rb: 0x702eb0,
    Sr: 0x00ff00,
    Y: 0x94ffff,
    Zr: 0x94e0e0,
    Nb: 0x73c2c9,
    Mo: 0x54b5b5,
    Ru: 0x248f8f,
    Rh: 0x0a7d8c,
    Pd: 0x006985,
    Ag: 0xc0c0c0,
    Cd: 0xffd98f,
    In: 0xa67573,
    Sn: 0x668080,
    Sb: 0x9e63b5,
    Te: 0xd47a00,
    I: 0x940094,
    Ba: 0x00c900,
    La: 0x70d4ff,
    Ce: 0xffffc7,
    Pt: 0xd0d0e0,
    Au: 0xffd123,
    Pb: 0x575961,
    Bi: 0x9e4fb5,
    U: 0x008fff,
};

// Element radius map (approximate covalent radii in Angstroms)
const ELEMENT_RADII: Record<string, number> = {
    H: 0.31,
    He: 0.28,
    Li: 1.28,
    Be: 0.96,
    B: 0.84,
    C: 0.76,
    N: 0.71,
    O: 0.66,
    F: 0.57,
    Na: 1.66,
    Mg: 1.41,
    Al: 1.21,
    Si: 1.11,
    P: 1.07,
    S: 1.05,
    Cl: 1.02,
    K: 2.03,
    Ca: 1.76,
    Ti: 1.6,
    V: 1.53,
    Cr: 1.39,
    Mn: 1.39,
    Fe: 1.32,
    Co: 1.26,
    Ni: 1.24,
    Cu: 1.32,
    Zn: 1.22,
    Ga: 1.22,
    Ge: 1.2,
    As: 1.19,
    Se: 1.2,
    Br: 1.2,
    Sr: 2.15,
    Zr: 1.75,
    Mo: 1.54,
    Ag: 1.45,
    Sn: 1.39,
    Ba: 2.15,
    Au: 1.36,
    Pb: 1.46,
    Bi: 1.48,
    U: 1.96,
};

interface CrystalStructureViewerProps {
    materialId: string;
    formula: string;
    onSpeedChange?: (speed: number | null) => void;
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
const PropRow: React.FC<{
    label: string;
    value: string | number | React.ReactNode;
    unit?: string;
}> = ({ label, value, unit }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50 last:border-0">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="text-white text-xs font-medium">
            {value}
            {unit && <span className="text-gray-500 ml-1">{unit}</span>}
        </span>
    </div>
);

// Helper: section card
const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
}) => (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3">
        <h4 className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
            {title}
        </h4>
        {children}
    </div>
);

// --- Sub-component: 3D Viewer Logic ---
interface CrystalViewer3DProps {
    structureData: StructureData;
    isFullScreen?: boolean;
    drawRepeats?: boolean;
    drawOutside?: boolean;
    visualStyle?: 'bs' | 'space' | 'bone';
}

const CrystalViewer3D: React.FC<CrystalViewer3DProps> = ({
    structureData,
    isFullScreen,
    drawRepeats = true,
    drawOutside = true,
    visualStyle = 'bs',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<any>(null);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        if (
            !containerRef.current ||
            !structureData ||
            !structureData.lattice ||
            !structureData.sites?.length
        )
            return;

        const container = containerRef.current;
        const width =
            container.clientWidth || (isFullScreen ? window.innerWidth : 300);
        const height =
            container.clientHeight || (isFullScreen ? window.innerHeight : 200);

        // Scene
        const scene = new THREE.Scene();
        scene.background = isFullScreen
            ? new THREE.Color(0x000000)
            : new THREE.Color(0x0a0a0f);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            50,
            width / height,
            0.1,
            100
        );

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: isFullScreen,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        let arButton: HTMLElement | null = null;
        let onXRSessionEnd: (() => void) | null = null;

        if (isFullScreen) {
            renderer.xr.enabled = true;
            arButton = ARButton.createButton(renderer, {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['hand-tracking'],
            });
            arButton.style.bottom = '40px';
            arButton.style.zIndex = '10000';
            document.body.appendChild(arButton);
        }

        container.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        // Build Structure
        const structureGroup = new THREE.Group();
        scene.add(structureGroup);

        const sites = structureData.sites;
        const latticeMatrix = structureData.lattice!.matrix;

        // Calculate center
        let centerX = 0,
            centerY = 0,
            centerZ = 0;
        sites.forEach((site) => {
            centerX += site.xyz[0];
            centerY += site.xyz[1];
            centerZ += site.xyz[2];
        });
        centerX /= sites.length;
        centerY /= sites.length;
        centerZ /= sites.length;

        // Atoms rendering with periodic repeats
        const sphereGeometry = new THREE.SphereGeometry(1, 24, 24);
        const renderedAtoms: any[] = [];

        sites.forEach((site) => {
            const element = site.element;
            const color = ELEMENT_COLORS[element] || 0x888888;
            const radius = (ELEMENT_RADII[element] || 1.0) * 0.35;

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.3,
                metalness: 0.6,
            });

            // Base position
            const basePos = new THREE.Vector3(
                site.xyz[0] - centerX,
                site.xyz[1] - centerY,
                site.xyz[2] - centerZ
            );

            // Adjust radius based on style
            let styledRadius = radius;
            if (visualStyle === 'space')
                styledRadius = (ELEMENT_RADII[element] || 1.0) * 0.8;
            else if (visualStyle === 'bone') styledRadius = radius * 0.5;

            // Function to add a mesh
            const addAtomMesh = (pos: THREE_TYPES.Vector3, abc: number[]) => {
                const mesh = new THREE.Mesh(sphereGeometry, material);
                mesh.position.copy(pos);
                mesh.scale.setScalar(styledRadius);
                structureGroup.add(mesh);
                renderedAtoms.push({ element, pos: pos.clone(), abc });
            };

            addAtomMesh(basePos, site.abc);

            // Periodic repeats if enabled
            if (drawRepeats) {
                const ep = 0.05; // epsilon for boundary check
                const dirs = [];
                if (site.abc[0] < ep) dirs.push([1, 0, 0]);
                if (site.abc[0] > 1 - ep) dirs.push([-1, 0, 0]);
                if (site.abc[1] < ep) dirs.push([0, 1, 0]);
                if (site.abc[1] > 1 - ep) dirs.push([0, -1, 0]);
                if (site.abc[2] < ep) dirs.push([0, 0, 1]);
                if (site.abc[2] > 1 - ep) dirs.push([0, 0, -1]);

                // Generate combinations (edges and corners)
                const combinations: number[][][] = [[]];
                dirs.forEach((d) => {
                    const len = combinations.length;
                    for (let i = 0; i < len; i++) {
                        combinations.push([...combinations[i], d]);
                    }
                });

                combinations.shift(); // Remove empty
                combinations.forEach((combo) => {
                    const offset = new THREE.Vector3(0, 0, 0);
                    const newABC = [site.abc[0], site.abc[1], site.abc[2]];
                    combo.forEach((d) => {
                        const vec = new THREE.Vector3(
                            latticeMatrix[0][0],
                            latticeMatrix[0][1],
                            latticeMatrix[0][2]
                        )
                            .multiplyScalar(d[0])
                            .add(
                                new THREE.Vector3(
                                    latticeMatrix[1][0],
                                    latticeMatrix[1][1],
                                    latticeMatrix[1][2]
                                ).multiplyScalar(d[1])
                            )
                            .add(
                                new THREE.Vector3(
                                    latticeMatrix[2][0],
                                    latticeMatrix[2][1],
                                    latticeMatrix[2][2]
                                ).multiplyScalar(d[2])
                            );
                        offset.add(vec);
                        newABC[0] += d[0];
                        newABC[1] += d[1];
                        newABC[2] += d[2];
                    });
                    addAtomMesh(basePos.clone().add(offset), newABC);
                });
            }
        });

        // Unit Cell Edges
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x44ffaa,
            opacity: 0.5,
            transparent: true,
        });
        const o = new THREE.Vector3(-centerX, -centerY, -centerZ);
        const a = new THREE.Vector3(
            latticeMatrix[0][0],
            latticeMatrix[0][1],
            latticeMatrix[0][2]
        );
        const b = new THREE.Vector3(
            latticeMatrix[1][0],
            latticeMatrix[1][1],
            latticeMatrix[1][2]
        );
        const c = new THREE.Vector3(
            latticeMatrix[2][0],
            latticeMatrix[2][1],
            latticeMatrix[2][2]
        );

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
            const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
            structureGroup.add(new THREE.Line(geo, lineMaterial));
        });

        // Bonds rendering
        const bondMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.3,
        });

        let bondRadius = 0.06;
        if (visualStyle === 'bone') bondRadius = 0.03;
        else if (visualStyle === 'space') bondRadius = 0.01; // Almost invisible

        const bondGeometry = new THREE.CylinderGeometry(
            bondRadius,
            bondRadius,
            1,
            8
        );
        bondGeometry.rotateX(Math.PI / 2);

        const latticeVectors = [
            new THREE.Vector3(
                latticeMatrix[0][0],
                latticeMatrix[0][1],
                latticeMatrix[0][2]
            ),
            new THREE.Vector3(
                latticeMatrix[1][0],
                latticeMatrix[1][1],
                latticeMatrix[1][2]
            ),
            new THREE.Vector3(
                latticeMatrix[2][0],
                latticeMatrix[2][1],
                latticeMatrix[2][2]
            ),
        ];

        // Search for bonds
        for (let i = 0; i < sites.length; i++) {
            const siteA = sites[i];
            const r1 = ELEMENT_RADII[siteA.element] || 1.5;
            const posA = new THREE.Vector3(
                siteA.xyz[0] - centerX,
                siteA.xyz[1] - centerY,
                siteA.xyz[2] - centerZ
            );

            // Check against other internal sites and their periodic images
            for (let j = i; j < sites.length; j++) {
                const siteB = sites[j];
                const r2 = ELEMENT_RADII[siteB.element] || 1.5;
                const maxBondDist = (r1 + r2) * 1.3;

                // Search in 3x3x3 unit cells if drawOutside is enabled, otherwise only 1
                const range = drawOutside ? [-1, 0, 1] : [0];

                range.forEach((da) => {
                    range.forEach((db) => {
                        range.forEach((dc) => {
                            if (i === j && da === 0 && db === 0 && dc === 0)
                                return;

                            const offset = latticeVectors[0]
                                .clone()
                                .multiplyScalar(da)
                                .add(
                                    latticeVectors[1].clone().multiplyScalar(db)
                                )
                                .add(
                                    latticeVectors[2].clone().multiplyScalar(dc)
                                );

                            const posB = new THREE.Vector3(
                                siteB.xyz[0] - centerX,
                                siteB.xyz[1] - centerY,
                                siteB.xyz[2] - centerZ
                            ).add(offset);
                            const dist = posA.distanceTo(posB);

                            if (dist < maxBondDist && dist > 0.1) {
                                // Add bond
                                const bond = new THREE.Mesh(
                                    bondGeometry.clone(),
                                    bondMaterial
                                );
                                bond.position.copy(
                                    posA.clone().add(posB).multiplyScalar(0.5)
                                );
                                bond.scale.set(1, 1, dist);
                                bond.lookAt(posB);
                                structureGroup.add(bond);

                                // If drawOutside is enabled and B is an image, render the image atom too
                                if (
                                    drawOutside &&
                                    (da !== 0 || db !== 0 || dc !== 0)
                                ) {
                                    const atomMat =
                                        new THREE.MeshStandardMaterial({
                                            color:
                                                ELEMENT_COLORS[siteB.element] ||
                                                0x888888,
                                            roughness: 0.3,
                                            metalness: 0.6,
                                        });
                                    const atomMesh = new THREE.Mesh(
                                        sphereGeometry,
                                        atomMat
                                    );
                                    atomMesh.position.copy(posB);

                                    let styledRadiusB =
                                        (ELEMENT_RADII[siteB.element] || 1.0) *
                                        0.35;
                                    if (visualStyle === 'space')
                                        styledRadiusB =
                                            (ELEMENT_RADII[siteB.element] ||
                                                1.0) * 0.8;
                                    else if (visualStyle === 'bone')
                                        styledRadiusB = styledRadiusB * 0.5;

                                    atomMesh.scale.setScalar(styledRadiusB);
                                    structureGroup.add(atomMesh);
                                }
                            }
                        });
                    });
                });
            }
        }

        // Camera & Interaction
        const maxDim = Math.max(
            structureData.lattice!.a,
            structureData.lattice!.b,
            structureData.lattice!.c
        );
        camera.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
        camera.lookAt(0, 0, 0);

        let isDragging = false,
            prevX = 0,
            prevY = 0,
            rotX = 0,
            rotY = 0,
            autoRotate = true;
        const onDown = (e: any) => {
            isDragging = true;
            prevX = e.clientX || e.touches?.[0].clientX;
            prevY = e.clientY || e.touches?.[0].clientY;
        };
        const onMove = (e: any) => {
            if (!isDragging) return;
            const x = e.clientX || e.touches?.[0].clientX;
            const y = e.clientY || e.touches?.[0].clientY;
            rotY += (x - prevX) * 0.005;
            rotX += (y - prevY) * 0.005;
            prevX = x;
            prevY = y;
        };
        const onUp = () => (isDragging = false);

        container.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        container.addEventListener('touchstart', onDown);
        window.addEventListener('touchmove', onMove);
        window.addEventListener('touchend', onUp);

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const dir = camera.position.clone().normalize();
            camera.position.addScaledVector(dir, e.deltaY * 0.01);
        };
        container.addEventListener('wheel', onWheel, { passive: false });
        container.addEventListener('dblclick', () => {
            autoRotate = !autoRotate;
        });

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);
            if (autoRotate && !isDragging) rotY += 0.003;
            structureGroup.rotation.x = rotX;
            structureGroup.rotation.y = rotY;
            renderer.render(scene, camera);
        };

        if (isFullScreen) {
            renderer.setAnimationLoop((_time, _frame) => {
                if (autoRotate && !isDragging) rotY += 0.003;
                structureGroup.rotation.x = rotX;
                structureGroup.rotation.y = rotY;
                renderer.render(scene, camera);
            });

            // Add AR Button if on full screen
            onXRSessionEnd = () => {
                camera.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
                camera.lookAt(0, 0, 0);
            };
            renderer.xr.addEventListener('sessionend', onXRSessionEnd);
        } else {
            animate();
        }

        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        const handleResetView = () => {
            camera.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
            camera.lookAt(0, 0, 0);
            rotX = 0;
            rotY = 0;
        };
        window.addEventListener('gear-reset-view', handleResetView);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('gear-reset-view', handleResetView);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
            if (arButton && document.body.contains(arButton))
                document.body.removeChild(arButton);
            if (container.contains(renderer.domElement))
                container.removeChild(renderer.domElement);
            if (onXRSessionEnd)
                renderer.xr.removeEventListener('sessionend', onXRSessionEnd);
            renderer.dispose();
        };
    }, [structureData, isFullScreen, drawRepeats, drawOutside, visualStyle]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
        />
    );
};

// --- Sub-component: AR/VR Premium Controls ---
interface ArVrControlsProps {
    visualStyle: 'bs' | 'space' | 'bone';
    setVisualStyle: (s: 'bs' | 'space' | 'bone') => void;
    interactionMode: 'manipulate' | 'inspect';
    setInteractionMode: (m: 'manipulate' | 'inspect') => void;
    drawRepeats: boolean;
    setDrawRepeats: (b: boolean) => void;
    drawOutside: boolean;
    setDrawOutside: (b: boolean) => void;
}

const ArVrControls: React.FC<ArVrControlsProps> = ({
    visualStyle,
    setVisualStyle,
    interactionMode,
    setInteractionMode,
    drawRepeats,
    setDrawRepeats,
    drawOutside,
    setDrawOutside,
}) => {
    const { t } = useTranslation();

    const handleReset = () => {
        window.dispatchEvent(new CustomEvent('gear-reset-view'));
    };

    return (
        <div className="bg-[#0f111a]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl space-y-5 select-none animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-teal-400 font-bold text-xl tracking-tight leading-none flex items-center gap-2">
                    Controls
                </h3>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                </div>
            </div>

            <div className="w-full h-px bg-white/5"></div>

            {/* Reset View */}
            <button
                onClick={handleReset}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
                <Rotate3d className="w-5 h-5" />
                Reset View
            </button>

            {/* Styles Button Group */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => setVisualStyle('bs')}
                    className={`py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                        visualStyle === 'bs'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-inner'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <Box className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                        B&S
                    </span>
                </button>
                <button
                    onClick={() => setVisualStyle('space')}
                    className={`py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                        visualStyle === 'space'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-inner'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <Radius className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                        Space
                    </span>
                </button>
                <button
                    onClick={() => setVisualStyle('bone')}
                    className={`py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                        visualStyle === 'bone'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white shadow-inner'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                        Bone
                    </span>
                </button>
            </div>

            {/* Toggle Options (Repeats/Outside) */}
            <div className="space-y-2">
                <button
                    onClick={() => setDrawRepeats(!drawRepeats)}
                    className={`w-full py-2.5 px-4 rounded-xl border transition-all flex items-center gap-3 text-xs font-medium ${
                        drawRepeats
                            ? 'bg-teal-500/10 border-teal-500/50 text-teal-300'
                            : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${drawRepeats ? 'bg-teal-400 animate-pulse' : 'bg-gray-600'}`}
                    ></div>
                    {t('materials.draw_repeats')}
                </button>
                <button
                    onClick={() => setDrawOutside(!drawOutside)}
                    className={`w-full py-2.5 px-4 rounded-xl border transition-all flex items-center gap-3 text-xs font-medium ${
                        drawOutside
                            ? 'bg-teal-500/10 border-teal-500/50 text-teal-300'
                            : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${drawOutside ? 'bg-teal-400 animate-pulse' : 'bg-gray-600'}`}
                    ></div>
                    {t('materials.draw_outside')}
                </button>
            </div>

            {/* Mode Button */}
            <button
                onClick={() =>
                    setInteractionMode(
                        interactionMode === 'manipulate'
                            ? 'inspect'
                            : 'manipulate'
                    )
                }
                className="w-full py-4 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-teal-900/20 text-lg"
            >
                Mode:{' '}
                {interactionMode === 'manipulate' ? 'Manipulate' : 'Inspect'}
            </button>

            {/* Footer Text */}
            <div className="text-center space-y-1 py-1">
                <p className="text-gray-500 text-[10px] italic">
                    Grab/Pinch to Move
                </p>
                <p className="text-gray-500 text-[10px] italic">
                    Stick to Zoom
                </p>
            </div>
        </div>
    );
};

const CrystalStructureViewer: React.FC<CrystalStructureViewerProps> = ({
    materialId,
    formula,
    onSpeedChange,
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [structureData, setStructureData] = useState<StructureData | null>(
        null
    );
    const [showAtomicPositions, setShowAtomicPositions] = useState(false);
    const [thickness, setThickness] = useState(3.0);
    const [laserPower, setLaserPower] = useState(80);
    const [calculatedSpeed, setCalculatedSpeed] = useState<number | null>(null);
    const [isExploring, setIsExploring] = useState(false);
    const [drawRepeats, setDrawRepeats] = useState(true);
    const [drawOutside, setDrawOutside] = useState(true);
    const [visualStyle, setVisualStyle] = useState<'bs' | 'space' | 'bone'>(
        'bs'
    );
    const [interactionMode, setInteractionMode] = useState<
        'manipulate' | 'inspect'
    >('manipulate');
    const [showControls, setShowControls] = useState(false);

    // Calculate speed logic
    useEffect(() => {
        if (!structureData || !structureData.density || thickness <= 0) {
            setCalculatedSpeed(null); // eslint-disable-line react-hooks/set-state-in-effect
            if (onSpeedChange) onSpeedChange(null);
            return;
        }
        const bg = structureData.band_gap || 0;
        let k = 5.0; // Default Ceramic/Insulator
        if (bg === 0)
            k = 10.0; // Metal
        else if (bg < 2.0) k = 7.5; // Semiconductor

        const speed = laserPower / (k * thickness * structureData.density);
        setCalculatedSpeed(speed);
        if (onSpeedChange) onSpeedChange(speed);
    }, [structureData, thickness, laserPower, onSpeedChange]);

    // Fetch structure data
    useEffect(() => {
        if (!materialId) return;

        setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
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

    // Render 3D structure - Handled by sub-component

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">
                        Loading Structure...
                    </p>
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
    const uniqueSites = structureData.sites.reduce(
        (acc, site) => {
            const existing = acc.find((s) => s.element === site.element);
            if (!existing) {
                acc.push({ ...site, count: 1 });
            } else {
                existing.count++;
            }
            return acc;
        },
        [] as ((typeof structureData.sites)[0] & { count: number })[]
    );

    return (
        <div className="space-y-3">
            {/* 3D Structure Viewer */}
            <div
                className="rounded-lg border border-gray-700 bg-gray-900"
                style={{ overflow: 'hidden', position: 'relative', zIndex: 0 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800/80 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                        <span className="text-white text-sm font-bold">
                            {formula}
                        </span>
                        <span className="text-gray-500 text-xs">
                            {materialId}
                        </span>
                    </div>
                    {structureData.lattice && (
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>a={structureData.lattice.a.toFixed(2)}Å</span>
                            <span>b={structureData.lattice.b.toFixed(2)}Å</span>
                            <span>c={structureData.lattice.c.toFixed(2)}Å</span>
                        </div>
                    )}
                </div>

                {/* Inline 3D Viewer container */}
                <div className="flex-grow min-h-[300px] relative group overflow-hidden bg-gray-900/40 rounded-xl border border-gray-800 shadow-inner">
                    <CrystalViewer3D
                        structureData={structureData}
                        drawRepeats={drawRepeats}
                        drawOutside={drawOutside}
                    />

                    {/* Settings Toggle Button */}
                    <button
                        onClick={() => setShowControls(!showControls)}
                        className="absolute top-4 right-4 p-2.5 bg-[#0f111a]/80 backdrop-blur-md rounded-xl border border-white/10 text-teal-400 hover:text-white transition-all active:scale-95 shadow-lg group-hover:translate-x-0 translate-x-[120%] duration-300"
                    >
                        <Settings
                            className={`w-5 h-5 ${showControls ? 'rotate-90' : ''} transition-transform duration-500`}
                        />
                    </button>

                    {/* Minimizable Controls Overlay for Inline View */}
                    {showControls && (
                        <div className="absolute top-16 right-4 w-60 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-[#0f111a]/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl space-y-4">
                                <h4 className="text-teal-400 text-[10px] font-bold uppercase tracking-widest">
                                    Rendering
                                </h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() =>
                                            setDrawRepeats(!drawRepeats)
                                        }
                                        className={`w-full py-2 px-3 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-bold ${
                                            drawRepeats
                                                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                                                : 'bg-white/5 border-white/5 text-gray-500'
                                        }`}
                                    >
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${drawRepeats ? 'bg-teal-400' : 'bg-gray-600'}`}
                                        ></div>
                                        Repeats
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDrawOutside(!drawOutside)
                                        }
                                        className={`w-full py-2 px-3 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-bold ${
                                            drawOutside
                                                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                                                : 'bg-white/5 border-white/5 text-gray-500'
                                        }`}
                                    >
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${drawOutside ? 'bg-teal-400' : 'bg-gray-600'}`}
                                        ></div>
                                        External
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Viewer Footer */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 border-t border-gray-700 text-xs text-gray-500">
                    <span>
                        {structureData.nsites} atoms • V=
                        {structureData.volume?.toFixed(1)} ų
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="italic hidden sm:inline text-[10px]">
                            Drag • Scroll • Dbl-click
                        </span>
                        <button
                            onClick={() => setIsExploring(true)}
                            className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded border border-purple-500/30 transition-colors font-medium cursor-pointer shadow-sm shadow-purple-900/20"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            {t('materials.ar_vr')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Explore Mode Modal / Full Screen Overlay */}
            {isExploring && (
                <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex flex-col animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <Maximize2 className="w-5 h-5 text-purple-400" />
                            <div>
                                <h2 className="text-white font-bold leading-none">
                                    {formula} - {t('materials.ar_vr')}
                                </h2>
                                <p className="text-gray-400 text-xs mt-1">
                                    {materialId} •{' '}
                                    {structureData.symmetry?.symbol}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExploring(false)}
                            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Viewer Area */}
                    <div className="flex-1 relative overflow-hidden bg-black">
                        <CrystalViewer3D
                            structureData={structureData}
                            isFullScreen={true}
                            drawRepeats={drawRepeats}
                            drawOutside={drawOutside}
                            visualStyle={visualStyle}
                        />

                        {/* Floating Gear Toggle in Full Screen */}
                        <button
                            onClick={() => setShowControls(!showControls)}
                            className="absolute top-4 right-4 p-2.5 bg-[#0f111a]/80 backdrop-blur-md rounded-xl border border-white/10 text-teal-400 hover:text-white transition-all active:scale-95 shadow-lg z-50"
                        >
                            <Settings
                                className={`w-5 h-5 ${showControls ? 'rotate-90' : ''} transition-transform duration-500`}
                            />
                        </button>

                        {/* Premium Controls Panel (Visible when toggled) */}
                        {showControls && (
                            <div className="absolute top-16 right-4 w-64 z-40">
                                <ArVrControls
                                    visualStyle={visualStyle}
                                    setVisualStyle={setVisualStyle}
                                    interactionMode={interactionMode}
                                    setInteractionMode={setInteractionMode}
                                    drawRepeats={drawRepeats}
                                    setDrawRepeats={setDrawRepeats}
                                    drawOutside={drawOutside}
                                    setDrawOutside={setDrawOutside}
                                />
                            </div>
                        )}

                        {/* Control Legend */}
                        <div className="absolute bottom-6 left-6 text-white/50 text-[10px] space-y-1 bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/10 pointer-events-none">
                            <p className="font-bold text-teal-400 mb-1 uppercase tracking-widest">
                                Controls
                            </p>
                            <p>DRAG - Rotate model</p>
                            <p>SCROLL - Zoom in/out</p>
                            <p>DBL-CLICK - Toggle Auto-rotate</p>
                            <p>AR/VR - Click the button to start XR</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Properties Card */}
            <InfoCard title="Summary">
                <PropRow
                    label="Energy Above Hull"
                    value={structureData.energy_above_hull?.toFixed(3)}
                    unit="eV/atom"
                />
                <PropRow
                    label="Band Gap"
                    value={structureData.band_gap?.toFixed(2)}
                    unit="eV"
                />
                <PropRow
                    label="Formation Energy"
                    value={structureData.formation_energy_per_atom?.toFixed(3)}
                    unit="eV/atom"
                />
                <PropRow
                    label="Density"
                    value={structureData.density?.toFixed(2)}
                    unit="g/cm³"
                />
                <PropRow
                    label="Magnetic Ordering"
                    value={
                        ORDERING_LABELS[structureData.ordering] ||
                        structureData.ordering
                    }
                />
                <PropRow
                    label="Total Magnetization"
                    value={structureData.total_magnetization?.toFixed(2)}
                    unit="µB/f.u."
                />
                <PropRow
                    label="Experimentally Observed"
                    value={structureData.theoretical ? 'No' : 'Yes'}
                />
                <PropRow
                    label="Stable"
                    value={
                        <span
                            className={
                                structureData.is_stable
                                    ? 'text-green-400'
                                    : 'text-red-400'
                            }
                        >
                            {structureData.is_stable ? '✓ Yes' : '✗ No'}
                        </span>
                    }
                />
            </InfoCard>

            {/* Symmetry + Lattice Row */}
            <div className="grid grid-cols-2 gap-3">
                {/* Symmetry */}
                {structureData.symmetry && (
                    <InfoCard title="Symmetry">
                        <PropRow
                            label="Crystal System"
                            value={structureData.symmetry.crystal_system}
                        />
                        <PropRow
                            label="Space Group"
                            value={structureData.symmetry.symbol}
                        />
                        <PropRow
                            label="Number"
                            value={structureData.symmetry.number}
                        />
                        <PropRow
                            label="Point Group"
                            value={structureData.symmetry.point_group}
                        />
                    </InfoCard>
                )}

                {/* Lattice */}
                {structureData.lattice && (
                    <InfoCard title="Lattice">
                        <PropRow
                            label="a"
                            value={structureData.lattice.a.toFixed(2)}
                            unit="Å"
                        />
                        <PropRow
                            label="b"
                            value={structureData.lattice.b.toFixed(2)}
                            unit="Å"
                        />
                        <PropRow
                            label="c"
                            value={structureData.lattice.c.toFixed(2)}
                            unit="Å"
                        />
                        <PropRow
                            label="α"
                            value={structureData.lattice.alpha.toFixed(1)}
                            unit="°"
                        />
                        <PropRow
                            label="β"
                            value={structureData.lattice.beta.toFixed(1)}
                            unit="°"
                        />
                        <PropRow
                            label="γ"
                            value={structureData.lattice.gamma.toFixed(1)}
                            unit="°"
                        />
                        <PropRow
                            label="Volume"
                            value={structureData.lattice.volume.toFixed(2)}
                            unit="ų"
                        />
                    </InfoCard>
                )}
            </div>

            {/* Material Properties & Options */}
            <div className="flex flex-col gap-6 lg:w-96 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 scrollbar-hide">
                {/* Desktop-only static controls, hidden on mobile in favor of gear toggle */}
                <div className="hidden lg:block">
                    <InfoCard title={t('materials.draw_options')}>
                        <div className="space-y-2 py-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={drawRepeats}
                                    onChange={(e) =>
                                        setDrawRepeats(e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-gray-700 bg-gray-900/50 text-teal-500 focus:ring-teal-500/20"
                                />
                                <span className="text-gray-300 text-xs group-hover:text-white transition-colors">
                                    {t('materials.draw_repeats')}
                                </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={drawOutside}
                                    onChange={(e) =>
                                        setDrawOutside(e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-gray-700 bg-gray-900/50 text-teal-500 focus:ring-teal-500/20"
                                />
                                <span className="text-gray-300 text-xs group-hover:text-white transition-colors">
                                    {t('materials.draw_outside')}
                                </span>
                            </label>
                        </div>
                    </InfoCard>
                </div>

                {/* Atomic Positions (collapsible) */}
                {uniqueSites.length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3">
                        <button
                            onClick={() =>
                                setShowAtomicPositions(!showAtomicPositions)
                            }
                            className="w-full flex items-center justify-between cursor-pointer"
                        >
                            <h4 className="text-teal-400 text-xs font-semibold uppercase tracking-wider">
                                {t('materials.atomic_positions')} (
                                {structureData.sites.length})
                            </h4>
                            <span
                                className="text-gray-400 text-xs transition-transform"
                                style={{
                                    transform: showAtomicPositions
                                        ? 'rotate(180deg)'
                                        : 'rotate(0deg)',
                                }}
                            >
                                ▼
                            </span>
                        </button>
                        {showAtomicPositions && (
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-gray-700">
                                            <th className="text-left py-1 pr-2">
                                                {t('materials.element')}
                                            </th>
                                            <th className="text-right py-1 px-2">
                                                x
                                            </th>
                                            <th className="text-right py-1 px-2">
                                                y
                                            </th>
                                            <th className="text-right py-1 pl-2">
                                                z
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {structureData.sites.map((site, i) => (
                                            <tr
                                                key={i}
                                                className="border-b border-gray-700/30 last:border-0"
                                            >
                                                <td className="py-1 pr-2 text-teal-300 font-medium">
                                                    {site.element}
                                                </td>
                                                <td className="text-right py-1 px-2 text-white">
                                                    {site.abc[0].toFixed(4)}
                                                </td>
                                                <td className="text-right py-1 px-2 text-white">
                                                    {site.abc[1].toFixed(4)}
                                                </td>
                                                <td className="text-right py-1 pl-2 text-white">
                                                    {site.abc[2].toFixed(4)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Laser Cutting Speed Calculator */}
                <div className="bg-gray-800/50 rounded-lg border border-teal-500/30 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-teal-400 text-xs font-semibold uppercase tracking-wider">
                            {t('materials.calculator_title')}
                        </h4>
                        <span className="bg-teal-500/10 text-teal-300 text-[10px] px-2 py-0.5 rounded border border-teal-500/20">
                            BETA
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-gray-400 text-[10px] uppercase font-medium">
                                {t('materials.thickness')} (mm)
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                max="20"
                                step="0.1"
                                value={thickness}
                                onChange={(e) =>
                                    setThickness(
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-gray-400 text-[10px] uppercase font-medium">
                                    {t('materials.laser_power')} (W)
                                </label>
                                <span className="text-teal-400 text-[10px] font-mono">
                                    {laserPower} W
                                </span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                step="5"
                                value={laserPower}
                                onChange={(e) =>
                                    setLaserPower(parseInt(e.target.value))
                                }
                                className="w-full accent-teal-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="bg-gray-900/80 rounded-lg border border-gray-700 p-3 flex flex-col items-center justify-center space-y-1 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                                {t('materials.estimated_speed')}
                            </span>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-black text-white">
                                    {calculatedSpeed !== null
                                        ? calculatedSpeed.toFixed(2)
                                        : 'NaN'}
                                </span>
                                <span className="text-teal-400 font-medium">
                                    mm/s
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-800 w-full">
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-gray-500 uppercase">
                                        {t('materials.density')}
                                    </span>
                                    <span className="text-[11px] text-gray-300 font-mono">
                                        {structureData?.density?.toFixed(2)}{' '}
                                        g/cm³
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-gray-800 pl-4">
                                    <span className="text-[9px] text-gray-500 uppercase">
                                        {t('materials.material_type')}
                                    </span>
                                    <span className="text-[11px] text-gray-300">
                                        {structureData?.band_gap === 0
                                            ? t('materials.metal')
                                            : structureData?.band_gap &&
                                                structureData.band_gap < 2
                                              ? t('materials.semiconductor')
                                              : t('materials.insulator')}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-gray-800 pl-4">
                                    <span className="text-[9px] text-gray-500 uppercase">
                                        Formula
                                    </span>
                                    <span className="text-[11px] text-gray-300 font-mono">
                                        {formula}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center border-l border-gray-800 pl-4">
                                    <span className="text-[9px] text-gray-500 uppercase">
                                        Source
                                    </span>
                                    <span className="text-[9px] text-teal-600 font-medium">
                                        Materials Project API (v2)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-[9px] text-gray-500 italic leading-relaxed">
                        {t('materials.calculator_disclaimer')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrystalStructureViewer;

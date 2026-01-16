
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

interface PDBViewerProps {
    pdbUrl?: string; // Optional URL, defaults to caffeine
    onExit: () => void;
}

import { fixAssetUrl } from '../utils/urlUtils';

const PDBViewer: React.FC<PDBViewerProps> = ({ pdbUrl = '/models/molecules/caffeine.pdb', onExit }) => {
    // Apply proxy fix immediately
    const fixedPdbUrl = fixAssetUrl(pdbUrl);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [atomCount, setAtomCount] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Camera
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = 1000;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        // Light
        const light = new THREE.DirectionalLight(0xffffff, 2.5);
        light.position.set(1, 1, 1);
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        // Molecule Group
        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Label Renderer
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(labelRenderer.domElement);

        // Controls
        const controls = new TrackballControls(camera, renderer.domElement);
        controls.minDistance = 500;
        controls.maxDistance = 2000;

        // Load PDB
        const loader = new PDBLoader();
        const offset = new THREE.Vector3();

        // Construct absolute URL ensuring no double slashes (except protocol)
        const baseUrl = window.location.origin;
        // Remove leading slash from pdbUrl if present to avoid //uploads
        const cleanPdbUrl = fixedPdbUrl.startsWith('/') ? fixedPdbUrl.substring(1) : fixedPdbUrl;
        const absolutePdbUrl = `${baseUrl}/${cleanPdbUrl}`;

        console.log('Starting PDB Load:', absolutePdbUrl);
        setLoading(true);
        setError(null);

        loader.load(
            absolutePdbUrl,
            (pdb) => {
                console.log('PDB Loaded successfully', pdb);

                // Check for empty PDB content (e.g. 404 HTML response parsed as PDB)
                if (pdb.geometryAtoms.getAttribute('position').count === 0) {
                    const msg = "Empty PDB file or File Not Found (404).";
                    console.warn(msg);
                    setError(msg);
                    setLoading(false);
                    return;
                }

                setAtomCount(pdb.geometryAtoms.getAttribute('position').count);

                // Clear previous objects
                rootGroup.clear();

                const geometryAtoms = pdb.geometryAtoms;
                const geometryBonds = pdb.geometryBonds;
                const json = pdb.json;

                const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
                const sphereGeometry = new THREE.IcosahedronGeometry(1, 3);

                geometryAtoms.computeBoundingBox();
                if (geometryAtoms.boundingBox) {
                    geometryAtoms.boundingBox.getCenter(offset).negate();
                }

                geometryAtoms.translate(offset.x, offset.y, offset.z);
                geometryBonds.translate(offset.x, offset.y, offset.z);

                let positions = geometryAtoms.getAttribute('position');
                const colors = geometryAtoms.getAttribute('color');

                const position = new THREE.Vector3();
                const color = new THREE.Color();

                // Atoms
                for (let i = 0; i < positions.count; i++) {
                    position.x = positions.getX(i);
                    position.y = positions.getY(i);
                    position.z = positions.getZ(i);

                    color.r = colors.getX(i);
                    color.g = colors.getY(i);
                    color.b = colors.getZ(i);

                    const material = new THREE.MeshPhongMaterial({ color: color });

                    const object = new THREE.Mesh(sphereGeometry, material);
                    object.position.copy(position);
                    object.position.multiplyScalar(75);
                    object.scale.multiplyScalar(25);
                    rootGroup.add(object);

                    const atom = json.atoms[i];

                    const text = document.createElement('div');
                    text.className = 'label';
                    text.style.color = 'rgb(' + atom[3][0] + ',' + atom[3][1] + ',' + atom[3][2] + ')';
                    text.textContent = atom[4]; // element symbol
                    text.style.fontFamily = 'sans-serif';
                    text.style.textShadow = '-1px 1px 1px rgb(0,0,0)';
                    text.style.marginLeft = '25px';
                    text.style.fontSize = '20px';


                    const label = new CSS2DObject(text);
                    label.position.copy(object.position);
                    rootGroup.add(label);
                }

                // Bonds
                positions = geometryBonds.getAttribute('position');
                const start = new THREE.Vector3();
                const end = new THREE.Vector3();

                for (let i = 0; i < positions.count; i += 2) {
                    start.x = positions.getX(i);
                    start.y = positions.getY(i);
                    start.z = positions.getZ(i);

                    end.x = positions.getX(i + 1);
                    end.y = positions.getY(i + 1);
                    end.z = positions.getZ(i + 1);

                    start.multiplyScalar(75);
                    end.multiplyScalar(75);

                    const object = new THREE.Mesh(boxGeometry, new THREE.MeshPhongMaterial({ color: 0xffffff }));
                    object.position.copy(start);
                    object.position.lerp(end, 0.5);
                    object.scale.set(5, 5, start.distanceTo(end));
                    object.lookAt(end);
                    rootGroup.add(object);
                }

                setLoading(false);
            },
            (xhr) => {
                // progress
            },
            (err) => {
                console.error('PDB Loader Error:', err);
                setLoading(false);
                setError('Error loading PDB: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        );

        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);

            controls.handleResize();
        };

        window.addEventListener('resize', onWindowResize);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            if (container.contains(labelRenderer.domElement)) container.removeChild(labelRenderer.domElement);
            // Clean up resources if needed
        };
    }, [fixedPdbUrl]);

    return (
        <div className="relative w-full h-full min-h-screen bg-slate-900">
            <div ref={containerRef} className="absolute inset-0 z-0" />

            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={onExit}
                    className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
                >
                    Back
                </button>
            </div>

            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center text-white bg-black/50">
                    <div className="text-xl font-bold animate-pulse">Loading Molecule...</div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-900/80 text-white px-8 py-6 rounded-xl border border-red-500 shadow-2xl max-w-md text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <h3 className="text-xl font-bold mb-2">Failed to Load Molecule</h3>
                        <p className="opacity-90">{error}</p>
                        <p className="text-xs text-red-300 mt-4">Try re-uploading the file via the Edit menu.</p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-10 text-slate-400 text-sm pointer-events-none bg-slate-900/50 p-2 rounded">
                <p>Model: {pdbUrl.split('/').pop()}</p>
                <p>Atoms: {atomCount}</p>
                <p>Controls: Rotate (Left Click), Zoom (Scroll), Pan (Right Click)</p>
            </div>
        </div>
    );
};

export default PDBViewer;

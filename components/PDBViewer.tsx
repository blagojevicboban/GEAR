
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu'; // Remove WebGPU import
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
// @ts-ignore
import { InteractiveGroup } from 'three/examples/jsm/interactive/InteractiveGroup.js';
// @ts-ignore
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js';

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
    const [visualStyle, setVisualStyle] = useState<'ball-stick' | 'spacefill' | 'backbone'>('ball-stick');
    const [arSessionActive, setArSessionActive] = useState(false);
    const pdbDataRef = useRef<any>(null); // Store parsed PDB data for style switching

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Camera - Meters Scale
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
        camera.position.z = 1.0; // 1 meter away for desktop (closer since object is small)
        camera.position.y = 0;   // Eye height centered

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        // Light
        const light = new THREE.DirectionalLight(0xffffff, 2.5);
        light.position.set(1, 2, 1); // Move light up for better shadows
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.bias = -0.001; // Reduce artifacts
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        // Molecule Group
        const rootGroup = new THREE.Group();
        // Position for MR: 0.5m in front of origin (eye level)
        rootGroup.position.set(0, 0, -0.5);
        scene.add(rootGroup);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true; // Enable Shadows
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.xr.enabled = true; // Enable WebXR
        container.appendChild(renderer.domElement);

        // Handle AR Passthrough
        const currentBackground = scene.background;
        renderer.xr.addEventListener('sessionstart', () => {
            scene.background = null; // Transparent in AR
            setArSessionActive(true);
        });
        renderer.xr.addEventListener('sessionend', () => {
            scene.background = currentBackground; // Restore background
            setArSessionActive(false);
        });

        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay', 'hand-tracking'],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(arButton);

        // --- XR Controllers & Interaction ---
        const controller1 = renderer.xr.getController(0);
        const controller2 = renderer.xr.getController(1);
        scene.add(controller1);
        scene.add(controller2);

        // Safety try-catch for factory init (rare limit cases)
        try {
            const controllerModelFactory = new XRControllerModelFactory();
            const handModelFactory = new XRHandModelFactory();

            // Controller Grips
            const controllerGrip1 = renderer.xr.getControllerGrip(0);
            controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
            scene.add(controllerGrip1);

            const controllerGrip2 = renderer.xr.getControllerGrip(1);
            controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
            scene.add(controllerGrip2);

            // Hand Models
            const hand1 = renderer.xr.getHand(0);
            hand1.add(handModelFactory.createHandModel(hand1));
            scene.add(hand1);

            const hand2 = renderer.xr.getHand(1);
            hand2.add(handModelFactory.createHandModel(hand2));
            scene.add(hand2);
        } catch (e) {
            console.warn("Failed to initialize XR Models:", e);
        }

        // Raycaster for interaction
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();

        function onSelectStart(event: any) {
            const controller = event.target;
            const intersections = getIntersections(controller);

            if (intersections.length > 0) {
                const intersection = intersections[0];
                const object = intersection.object;

                // For grabbing, we grab the whole molecule
                controller.attach(rootGroup);
                (controller as any).userData.selected = rootGroup;
                (controller as any).userData.isSelecting = true;
            }
        }

        function onSelectEnd(event: any) {
            const controller = event.target;
            if ((controller as any).userData.selected !== undefined) {
                const object = (controller as any).userData.selected;
                scene.attach(object);
                (controller as any).userData.selected = undefined;
                (controller as any).userData.isSelecting = false;
            }
        }

        controller1.addEventListener('selectstart', onSelectStart);
        controller1.addEventListener('selectend', onSelectEnd);
        controller2.addEventListener('selectstart', onSelectStart);
        controller2.addEventListener('selectend', onSelectEnd);

        // Visual Ray
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
        const line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = 5;

        controller1.add(line.clone());
        controller2.add(line.clone());

        function getIntersections(controller: any) {
            tempMatrix.identity().extractRotation(controller.matrixWorld);
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            // Intersect with rootGroup children (atoms/bonds)
            return raycaster.intersectObjects(rootGroup.children, true);
        }


        // Label Renderer
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(labelRenderer.domElement);

        // Controls
        const controls = new TrackballControls(camera, renderer.domElement);
        // Adjust controls for meter scale
        controls.minDistance = 0.2;
        controls.maxDistance = 5.0;
        controls.target.set(0, 0, -0.5); // Look at molecule center
        controls.update();

        // Build Molecule Function
        const buildMolecule = (pdb: any, style: string) => {
            rootGroup.clear();

            const geometryAtoms = pdb.geometryAtoms;
            const geometryBonds = pdb.geometryBonds;
            const json = pdb.json;

            const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const sphereGeometry = new THREE.IcosahedronGeometry(1, 3);

            // Recalculate offset if needed, but assuming geometryAtoms is already centered from initial load if we don't reload.
            // Actually, PDBLoader modifies geometry in place, so we don't need to re-center.

            // --- SCALING ---
            const offset = new THREE.Vector3();
            geometryAtoms.computeBoundingBox();
            // We only center once ideally, but here we work with what we have.
            // Let's re-measure to be safe for scale.
            const size = new THREE.Vector3();
            geometryAtoms.boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 0.5; // 50cm
            const scaleFactor = targetSize / maxDim;

            const positions = geometryAtoms.getAttribute('position');
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

                const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.5 });
                const object = new THREE.Mesh(sphereGeometry, material);
                object.position.copy(position);
                object.position.multiplyScalar(scaleFactor);

                // Style Logic
                if (style === 'spacefill') {
                    object.scale.setScalar(1.2 * scaleFactor); // Large touching spheres
                } else if (style === 'backbone') {
                    object.scale.setScalar(0.15 * scaleFactor); // Tiny spheres
                } else { // ball-stick
                    object.scale.setScalar(0.4 * scaleFactor); // Standard size
                }

                object.castShadow = true;
                object.receiveShadow = true;
                rootGroup.add(object);

                // Labels (Only for Ball-Stick or Spacefill maybe? Let's keep for all)
                if (style !== 'backbone') {
                    const atom = json.atoms[i];
                    const text = document.createElement('div');
                    text.className = 'label';
                    text.style.color = 'rgb(' + atom[3][0] + ',' + atom[3][1] + ',' + atom[3][2] + ')';
                    text.textContent = atom[4];
                    text.style.fontFamily = 'sans-serif';
                    text.style.textShadow = '-1px 1px 1px rgb(0,0,0)';
                    text.style.marginLeft = '10px';
                    text.style.fontSize = '12px';
                    const label = new CSS2DObject(text);
                    label.position.copy(object.position);
                    rootGroup.add(label);
                }
            }

            // Bonds (Hide in Spacefill)
            if (style !== 'spacefill') {
                const bondPositions = geometryBonds.getAttribute('position');
                const start = new THREE.Vector3();
                const end = new THREE.Vector3();

                for (let i = 0; i < bondPositions.count; i += 2) {
                    start.x = bondPositions.getX(i);
                    start.y = bondPositions.getY(i);
                    start.z = bondPositions.getZ(i);

                    end.x = bondPositions.getX(i + 1);
                    end.y = bondPositions.getY(i + 1);
                    end.z = bondPositions.getZ(i + 1);

                    start.multiplyScalar(scaleFactor);
                    end.multiplyScalar(scaleFactor);

                    const object = new THREE.Mesh(boxGeometry, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 }));
                    object.position.copy(start);
                    object.lookAt(end);

                    // Style Logic for Bonds
                    const distance = start.distanceTo(end);
                    if (style === 'backbone') {
                        object.scale.set(0.05 * scaleFactor, 0.05 * scaleFactor, distance); // Very thin
                    } else {
                        // Ball-Stick
                        object.scale.set(0.1 * scaleFactor, 0.1 * scaleFactor, distance);
                    }

                    // Center bond
                    object.position.lerp(end, 0.5);

                    object.castShadow = true;
                    object.receiveShadow = true;
                    rootGroup.add(object);
                }
            }

            // Shadow Catcher Plane
            const shadowPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(5, 5),
                new THREE.ShadowMaterial({ opacity: 0.3 })
            );
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.position.y = -0.6 * scaleFactor; // Slightly lower
            shadowPlane.receiveShadow = true;
            rootGroup.add(shadowPlane);
        };

        // Load PDB
        if (!pdbDataRef.current) {
            const loader = new PDBLoader();
            const baseUrl = window.location.origin;
            const cleanPdbUrl = fixedPdbUrl.startsWith('/') ? fixedPdbUrl.substring(1) : fixedPdbUrl;
            const absolutePdbUrl = `${baseUrl}/${cleanPdbUrl}`;

            console.log('Starting PDB Load:', absolutePdbUrl);
            setLoading(true);
            setError(null);

            loader.load(
                absolutePdbUrl,
                (pdb) => {
                    console.log('PDB Loaded successfully');

                    // Center Geometry Initially
                    const geometryAtoms = pdb.geometryAtoms;
                    const geometryBonds = pdb.geometryBonds;
                    geometryAtoms.computeBoundingBox();
                    const offset = new THREE.Vector3();
                    if (geometryAtoms.boundingBox) {
                        geometryAtoms.boundingBox.getCenter(offset).negate();
                    }
                    geometryAtoms.translate(offset.x, offset.y, offset.z);
                    geometryBonds.translate(offset.x, offset.y, offset.z);

                    pdbDataRef.current = pdb; // Cache data
                    setAtomCount(geometryAtoms.getAttribute('position').count);

                    buildMolecule(pdb, visualStyle); // Initial Build
                    setLoading(false);
                },
                (xhr) => { },
                (err) => {
                    console.error('PDB Loader Error:', err);
                    setLoading(false);
                    setError('Error loading PDB: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }
            );
        } else {
            // Rebuild if style changed but data exists
            buildMolecule(pdbDataRef.current, visualStyle);
        }

        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
            controls.handleResize();
        };

        window.addEventListener('resize', onWindowResize);

        // Spatial UI (3D Menu)
        const menuElement = document.getElementById('ar-menu');
        if (menuElement) {
            // @ts-ignore
            const interactionGroup = new InteractiveGroup(renderer, camera);
            scene.add(interactionGroup);

            const mesh = new HTMLMesh(menuElement);
            mesh.position.set(0.4, 0, -0.5); // To the right
            mesh.rotation.y = -Math.PI / 6;
            mesh.scale.setScalar(2);
            interactionGroup.add(mesh);

            // Button Listeners
            const btnReset = document.getElementById('btn-reset');
            if (btnReset) {
                btnReset.onclick = () => {
                    rootGroup.position.set(0, 0, -0.5);
                    rootGroup.rotation.set(0, 0, 0);
                    rootGroup.scale.setScalar(1);
                };
            }

            const btnStyleBS = document.getElementById('btn-style-bs');
            if (btnStyleBS) btnStyleBS.onclick = () => setVisualStyle('ball-stick');

            const btnStyleSF = document.getElementById('btn-style-sf');
            if (btnStyleSF) btnStyleSF.onclick = () => setVisualStyle('spacefill');

            const btnStyleBB = document.getElementById('btn-style-bb');
            if (btnStyleBB) btnStyleBB.onclick = () => setVisualStyle('backbone');
        }

        const animate = (time: number, frame?: any) => {
            controls.update();

            // AR Scaling Logic
            if (frame) {
                const session = renderer.xr.getSession();
                if (session) {
                    for (const source of session.inputSources) {
                        if (source.gamepad) {
                            const checkAxis = (axisIndex: number) => {
                                const value = source.gamepad.axes[axisIndex];
                                if (Math.abs(value) > 0.1) {
                                    const scaleSpeed = 0.02;
                                    const newScale = rootGroup.scale.x - (value * scaleSpeed);
                                    const clampedScale = Math.max(0.1, Math.min(newScale, 5.0));
                                    rootGroup.scale.setScalar(clampedScale);
                                }
                            };
                            if (source.gamepad.axes.length > 3) checkAxis(3);
                        }
                    }
                }
            }

            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);
        };

        renderer.setAnimationLoop(animate);

        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            if (container.contains(labelRenderer.domElement)) container.removeChild(labelRenderer.domElement);
            if (document.body.contains(arButton)) document.body.removeChild(arButton); // Remove AR Button
            renderer.dispose();
        };
    }, [fixedPdbUrl, visualStyle]); // Re-run when style changes

    return (
        <div className={`relative w-full h-full min-h-screen ${arSessionActive ? 'bg-transparent' : 'bg-slate-900'}`}>
            <div ref={containerRef} className="absolute inset-0 z-0" />

            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={onExit}
                    className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
                >
                    Back
                </button>
            </div>

            {/* Spatial UI Container (Hidden in 2D, used for texture) */}
            <div id="ar-menu" className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none">
                <div className="w-64 p-4 bg-slate-800/90 text-white rounded-xl border border-blue-500/50 flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-center border-b border-white/10 pb-2 mb-2">Controls</h3>
                    <button id="btn-reset" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-center font-medium transition active:scale-95">
                        Reset View
                    </button>

                    <div className="grid grid-cols-3 gap-1 mt-2">
                        <button id="btn-style-bs" className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition">B&S</button>
                        <button id="btn-style-sf" className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition">Space</button>
                        <button id="btn-style-bb" className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition">Bone</button>
                    </div>

                    <div className="text-xs text-slate-400 text-center mt-1">
                        Grab/Pinch to Move<br />Stick to Zoom
                    </div>
                </div>
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
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-10 text-slate-400 text-sm pointer-events-none bg-slate-900/50 p-2 rounded">
                <p>Model: {pdbUrl.split('/').pop()}</p>
                <p>Atoms: {atomCount}</p>
                <p>Style: {visualStyle === 'ball-stick' ? 'Ball & Stick' : visualStyle === 'spacefill' ? 'Spacefill' : 'Backbone'}</p>
                <p>Controls: Desktop (Mouse) | AR (Grab/Pinch & Move, Stick Up/Down to Scale)</p>
                <p>Renderer: WebGL + WebXR (AR) + Hand Tracking</p>
            </div>
        </div>
    );
};

export default PDBViewer;

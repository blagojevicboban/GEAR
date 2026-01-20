
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu'; // Remove WebGPU import
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

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

        // Camera - Meters Scale
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
        camera.position.z = 1.0; // 1 meter away for desktop (closer since object is small)
        camera.position.y = 0;   // Eye height centered

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
        // Position for MR: 0.5m in front of origin (eye level)
        rootGroup.position.set(0, 0, -0.5);
        scene.add(rootGroup);

        // Renderer
        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true; // Enable WebXR
        container.appendChild(renderer.domElement);

        // Handle AR Passthrough
        const currentBackground = scene.background;
        renderer.xr.addEventListener('sessionstart', () => {
            scene.background = null; // Transparent in AR
        });
        renderer.xr.addEventListener('sessionend', () => {
            scene.background = currentBackground; // Restore background
        });

        const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } });
        document.body.appendChild(arButton);

        // --- XR Controllers & Interaction ---
        const controller1 = renderer.xr.getController(0);
        const controller2 = renderer.xr.getController(1);
        scene.add(controller1);
        scene.add(controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        const controllerGrip1 = renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        scene.add(controllerGrip1);

        const controllerGrip2 = renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        scene.add(controllerGrip2);

        // Raycaster for interaction
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();

        function onSelectStart(event: any) {
            const controller = event.target;
            const intersections = getIntersections(controller);

            if (intersections.length > 0) {
                const intersection = intersections[0];
                const object = intersection.object;

                // Find the root group (parent of the atom mesh, usually rootGroup)
                // We want to move the whole molecule
                (controller as any).userData.selected = rootGroup;

                // Attach rootGroup to controller to move it
                // rootGroup.parent is currently 'scene'
                // We attach it to 'controller'
                // THREE.SceneUtils.attach(rootGroup, scene, controller); // Deprecated
                controller.attach(rootGroup);

                (controller as any).userData.isSelecting = true;
            }
        }

        function onSelectEnd(event: any) {
            const controller = event.target;
            if ((controller as any).userData.selected !== undefined) {
                const object = (controller as any).userData.selected;

                // Detach back to scene
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

                if (pdb.geometryAtoms.getAttribute('position').count === 0) {
                    const msg = "Empty PDB file or File Not Found (404).";
                    console.warn(msg);
                    setError(msg);
                    setLoading(false);
                    return;
                }

                setAtomCount(pdb.geometryAtoms.getAttribute('position').count);

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

                // --- SCALING TO METERS ---
                // Calculate max dimension to fit within 0.5m box
                geometryAtoms.computeBoundingBox();
                const size = new THREE.Vector3();
                geometryAtoms.boundingBox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const targetSize = 0.5; // 50cm
                const scaleFactor = targetSize / maxDim;

                console.log(`Scaling PDB: MaxDim=${maxDim}, ScaleFactor=${scaleFactor}`);

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

                    // Use MeshStandardMaterial
                    const material = new THREE.MeshStandardMaterial({ color: color });
                    material.roughness = 0.5;
                    material.metalness = 0.5;

                    const object = new THREE.Mesh(sphereGeometry, material);
                    object.position.copy(position);
                    object.position.multiplyScalar(scaleFactor); // Apply scale
                    object.scale.setScalar(0.4 * scaleFactor); // Atom size relative to scale
                    rootGroup.add(object);

                    const atom = json.atoms[i];
                    const text = document.createElement('div');
                    text.className = 'label';
                    text.style.color = 'rgb(' + atom[3][0] + ',' + atom[3][1] + ',' + atom[3][2] + ')';
                    text.textContent = atom[4];
                    text.style.fontFamily = 'sans-serif';
                    text.style.textShadow = '-1px 1px 1px rgb(0,0,0)';
                    text.style.marginLeft = '10px'; // Adjust for smaller scale
                    text.style.fontSize = '12px'; // Smaller font

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

                    start.multiplyScalar(scaleFactor);
                    end.multiplyScalar(scaleFactor);

                    const object = new THREE.Mesh(boxGeometry, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 }));
                    object.position.copy(start);
                    object.position.lerp(end, 0.5);
                    object.scale.set(0.1 * scaleFactor, 0.1 * scaleFactor, start.distanceTo(end)); // Thinner bonds
                    object.lookAt(end);
                    rootGroup.add(object);
                }

                setLoading(false);
            },
            (xhr) => { },
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
            controls.update();
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
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-10 text-slate-400 text-sm pointer-events-none bg-slate-900/50 p-2 rounded">
                <p>Model: {pdbUrl.split('/').pop()}</p>
                <p>Atoms: {atomCount}</p>
                <p>Controls: Desktop (Mouse) | AR (Point & Trigger to Grab)</p>
                <p>Renderer: WebGL + WebXR (AR)</p>
            </div>
        </div>
    );
};

export default PDBViewer;

import React, { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPES from 'three';
const THREE = (window as any).THREE as typeof THREE_TYPES;

import { TrackballControls } from '../lib/three-examples/controls/TrackballControls.js';
import { PDBLoader } from '../lib/three-examples/loaders/PDBLoader.js';
import {
    CSS2DRenderer,
    CSS2DObject,
} from '../lib/three-examples/renderers/CSS2DRenderer.js';
import { ARButton } from '../lib/three-examples/webxr/ARButton.js';
import { XRControllerModelFactory } from '../lib/three-examples/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from '../lib/three-examples/webxr/XRHandModelFactory.js';
import { InteractiveGroup } from '../lib/three-examples/interactive/InteractiveGroup.js';
import { HTMLMesh } from '../lib/three-examples/interactive/HTMLMesh.js';
import { io, Socket } from 'socket.io-client';

interface PDBViewerProps {
    pdbUrl?: string; // Optional URL, defaults to caffeine
    onExit: () => void;
}

import { fixAssetUrl } from '../utils/urlUtils';

const PDBViewer: React.FC<PDBViewerProps> = ({
    pdbUrl = '/models/molecules/caffeine.pdb',
    onExit,
}) => {
    // Apply proxy fix immediately
    const fixedPdbUrl = fixAssetUrl(pdbUrl);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [atomCount, setAtomCount] = useState(0);
    const [visualStyle, setVisualStyle] = useState<
        'ball-stick' | 'spacefill' | 'backbone'
    >('ball-stick');
    const visualStyleRef = useRef(visualStyle);
    useEffect(() => {
        visualStyleRef.current = visualStyle;
    }, [visualStyle]);
    const [arSessionActive, setArSessionActive] = useState(false);
    const [interactionMode, setInteractionMode] = useState<
        'manipulate' | 'annotate'
    >('manipulate');
    const [voiceStatus, setVoiceStatus] = useState<string>(''); // Voice feedback text
    const pdbDataRef = useRef<any>(null); // Store parsed PDB data for style switching
    const socketRef = useRef<Socket | null>(null); // Socket Logic
    const isRemoteUpdate = useRef(false); // Flag to prevent echo loops

    // We need a ref for interaction mode to use inside the event listener (which is created inside useEffect)
    const modeRef = useRef('manipulate');
    // Update ref when state changes
    useEffect(() => {
        modeRef.current = interactionMode;
    }, [interactionMode]);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        let lastBroadcast = 0;

        // Camera - Meters Scale
        const camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            50
        );
        camera.position.z = 1.0; // 1 meter away for desktop (closer since object is small)
        camera.position.y = 0; // Eye height centered

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        // Light
        const light = new THREE.DirectionalLight(0xffffff, 2.0); // Reduced instensity slightly, relying more on ambient
        light.position.set(1, 2, 1);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.bias = -0.0001; // Reduce shadow acne
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 3.0); // Boost Ambient Light strongly
        scene.add(ambientLight);

        // Molecule Group
        const rootGroup = new THREE.Group();
        // Position for MR: 0.5m in front of origin (eye level)
        rootGroup.position.set(0, 0, -0.5);
        scene.add(rootGroup);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
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
            optionalFeatures: ['hand-tracking'],
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
            controllerGrip1.add(
                controllerModelFactory.createControllerModel(
                    controllerGrip1
                ) as any
            );
            scene.add(controllerGrip1);

            const controllerGrip2 = renderer.xr.getControllerGrip(1);
            controllerGrip2.add(
                controllerModelFactory.createControllerModel(
                    controllerGrip2
                ) as any
            );
            scene.add(controllerGrip2);

            // Hand Models
            const hand1 = renderer.xr.getHand(0);
            hand1.add(handModelFactory.createHandModel(hand1) as any);
            scene.add(hand1);

            const hand2 = renderer.xr.getHand(1);
            hand2.add(handModelFactory.createHandModel(hand2) as any);
            scene.add(hand2);
        } catch (e) {
            console.warn('Failed to initialize XR Models:', e);
        }

        // Raycaster for interaction
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();

        function onSelectStart(event: any) {
            const controller = event.target;
            const intersections = getIntersections(controller);

            if (intersections.length > 0) {
                const intersection = intersections[0];
                if (modeRef.current === 'annotate') {
                    // ANNOTATION MODE
                    // Find which atom was clicked.
                    // object is the Mesh.
                    // We can spawn a label here.

                    // Create Label
                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'ar-annotation';
                    labelDiv.textContent = 'Atom'; // Default text
                    labelDiv.style.background = 'rgba(0,0,0,0.8)';
                    labelDiv.style.color = 'white';
                    labelDiv.style.padding = '4px 8px';
                    labelDiv.style.borderRadius = '8px';
                    labelDiv.style.fontSize = '24px'; // Large for AR
                    labelDiv.style.border = '1px solid white';

                    const label = new HTMLMesh(labelDiv);
                    label.position.copy(intersection.point);
                    label.lookAt(camera.position); // Look at user
                    rootGroup.add(label as any);
                } else {
                    // MANIPULATION MODE
                    // For grabbing, we grab the whole molecule
                    controller.attach(rootGroup);
                    (controller as any).userData.selected = rootGroup;
                    (controller as any).userData.isSelecting = true;
                }
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

        // Interaction State for Two-Handed Manipulation
        const interactionState = {
            controller1: {
                selected: null as any,
                position: new THREE.Vector3(),
            },
            controller2: {
                selected: null as any,
                position: new THREE.Vector3(),
            },
            initialDistance: 0,
            initialScale: 1,
            initialAngle: 0,
            initialRotationY: 0,
            isTwoHanded: false,
        };

        function updateInteractionState() {
            const c1Selected = (controller1 as any).userData.selected;
            const c2Selected = (controller2 as any).userData.selected;

            if (c1Selected && c2Selected && c1Selected === c2Selected) {
                // Start Two-Handed Interaction
                if (!interactionState.isTwoHanded) {
                    interactionState.isTwoHanded = true;
                    interactionState.initialDistance =
                        controller1.position.distanceTo(controller2.position);
                    interactionState.initialScale = rootGroup.scale.x;

                    const dx = controller2.position.x - controller1.position.x;
                    const dz = controller2.position.z - controller1.position.z;
                    interactionState.initialAngle = Math.atan2(dz, dx);
                    interactionState.initialRotationY = rootGroup.rotation.y;
                }
            } else {
                interactionState.isTwoHanded = false;
            }
        }

        // Visual Ray
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1),
        ]);
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

                // Use MeshStandardMaterial
                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.5,
                    metalness: 0.5,
                });

                const object = new THREE.Mesh(sphereGeometry, material);
                object.position.copy(position);
                object.position.multiplyScalar(scaleFactor);

                // Style Logic
                if (style === 'spacefill') {
                    object.scale.setScalar(1.2 * scaleFactor); // Large touching spheres
                } else if (style === 'backbone') {
                    object.scale.setScalar(0.15 * scaleFactor); // Tiny spheres
                } else {
                    // ball-stick
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
                    text.style.color =
                        'rgb(' +
                        atom[3][0] +
                        ',' +
                        atom[3][1] +
                        ',' +
                        atom[3][2] +
                        ')';
                    text.textContent = atom[4];
                    text.style.fontFamily = 'sans-serif';
                    text.style.textShadow = '-1px 1px 1px rgb(0,0,0)';
                    text.style.marginLeft = '10px';
                    text.style.fontSize = '12px';
                    const label = new CSS2DObject(text);
                    label.position.copy(object.position);
                    rootGroup.add(label as any);
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

                    const object = new THREE.Mesh(
                        boxGeometry,
                        new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            roughness: 0.5,
                            metalness: 0.5,
                        })
                    );
                    object.position.copy(start);
                    object.lookAt(end);

                    // Style Logic for Bonds
                    const distance = start.distanceTo(end);
                    if (style === 'backbone') {
                        object.scale.set(
                            0.05 * scaleFactor,
                            0.05 * scaleFactor,
                            distance
                        ); // Very thin
                    } else {
                        // Ball-Stick
                        object.scale.set(
                            0.1 * scaleFactor,
                            0.1 * scaleFactor,
                            distance
                        );
                    }

                    // Center bond
                    object.position.lerp(end, 0.5);

                    object.castShadow = true;
                    object.receiveShadow = true;
                    rootGroup.add(object);
                }
            }

            // Shadow Catcher Plane
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
            const cleanPdbUrl = fixedPdbUrl.startsWith('/')
                ? fixedPdbUrl.substring(1)
                : fixedPdbUrl;
            const absolutePdbUrl = `${baseUrl}/${cleanPdbUrl}`;

            console.log('Starting PDB Load:', absolutePdbUrl);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(true);
            setError(null);

            loader.load(
                absolutePdbUrl,
                (pdb: any) => {
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
                () => {},
                (err: any) => {
                    console.error('PDB Loader Error:', err);
                    setLoading(false);
                    setError(
                        'Error loading PDB: ' +
                            (err instanceof Error
                                ? err.message
                                : 'Unknown error')
                    );
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
        let menuMesh: any = null; // Reference for animation loop
        const menuElement = document.getElementById('ar-menu');
        if (menuElement) {
            // @ts-ignore
            const interactionGroup = new InteractiveGroup(renderer, camera);
            scene.add(interactionGroup as any);

            const mesh = new HTMLMesh(menuElement);
            // mesh.position.set(0.4, 0, -0.5); // To the right (Old static pos)
            // Initial position (will be overridden by Wrist logic if AR is active)
            mesh.position.set(0.4, 0, -0.5);
            mesh.rotation.y = -Math.PI / 6;
            mesh.scale.setScalar(1.5); // Slightly smaller for wrist
            interactionGroup.add(mesh as any);
            menuMesh = mesh;

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
            if (btnStyleBS)
                btnStyleBS.onclick = () => setVisualStyle('ball-stick');

            const btnStyleSF = document.getElementById('btn-style-sf');
            if (btnStyleSF)
                btnStyleSF.onclick = () => setVisualStyle('spacefill');

            const btnStyleBB = document.getElementById('btn-style-bb');
            if (btnStyleBB)
                btnStyleBB.onclick = () => setVisualStyle('backbone');

            const btnMode = document.getElementById('btn-mode-toggle');
            if (btnMode) {
                // Update text initially
                btnMode.textContent = `Mode: ${modeRef.current === 'manipulate' ? 'Manipulate' : 'Annotate'}`;

                btnMode.onclick = () => {
                    const newMode =
                        modeRef.current === 'manipulate'
                            ? 'annotate'
                            : 'manipulate';
                    setInteractionMode(newMode);
                    btnMode.textContent = `Mode: ${newMode === 'manipulate' ? 'Manipulate' : 'Annotate'}`;
                    // Visual feedback
                    setVoiceStatus(`Mode: ${newMode.toUpperCase()}`);
                    setTimeout(() => setVoiceStatus(''), 1500);
                };
            }
        }

        const animate = (_time: number, frame?: any) => {
            controls.update();

            // AR Scaling/Rotation Logic
            if (frame) {
                updateInteractionState();

                if (interactionState.isTwoHanded) {
                    // Two-Handed Manipulation
                    const dist = controller1.position.distanceTo(
                        controller2.position
                    );
                    const scaleFactor = dist / interactionState.initialDistance;
                    const newScale =
                        interactionState.initialScale * scaleFactor;
                    const clampedScale = Math.max(0.1, Math.min(newScale, 5.0));
                    rootGroup.scale.setScalar(clampedScale);

                    const dx = controller2.position.x - controller1.position.x;
                    const dz = controller2.position.z - controller1.position.z;
                    const currentAngle = Math.atan2(dz, dx);
                    const angleDiff =
                        currentAngle - interactionState.initialAngle;
                    rootGroup.rotation.y =
                        interactionState.initialRotationY - angleDiff;
                } else {
                    // Fallback to Stick Scaling if not two-handed
                    const session = renderer.xr.getSession();
                    if (session) {
                        for (const source of session.inputSources) {
                            if (source.gamepad) {
                                const gamepad = source.gamepad;
                                const checkAxis = (axisIndex: number) => {
                                    const value = gamepad.axes[axisIndex];
                                    if (Math.abs(value) > 0.1) {
                                        const scaleSpeed = 0.02;
                                        const newScale =
                                            rootGroup.scale.x -
                                            value * scaleSpeed;
                                        const clampedScale = Math.max(
                                            0.1,
                                            Math.min(newScale, 5.0)
                                        );
                                        rootGroup.scale.setScalar(clampedScale);
                                    }
                                };
                                if (source.gamepad.axes.length > 3)
                                    checkAxis(3);
                            }
                        }
                    }
                }
            }

            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);

            // Wrist Menu Update
            if (menuMesh && renderer.xr.isPresenting && controller1) {
                // Check if controller is tracking
                // We can simply lerp to controller position + offset
                const targetPos = new THREE.Vector3();
                const targetRot = new THREE.Quaternion();

                // Get controller world transform
                targetPos.setFromMatrixPosition(controller1.matrixWorld);
                targetRot.setFromRotationMatrix(controller1.matrixWorld);

                // Offset: 15cm "above" the controller (Simulating looking at a watch)
                // We need to apply offset in local controller space.
                const offset = new THREE.Vector3(0.05, 0.15, 0.0); // Right 5cm, Up 15cm
                offset.applyQuaternion(targetRot);
                targetPos.add(offset);

                // Update Mesh
                menuMesh.position.lerp(targetPos, 0.1); // Smooth follow
                menuMesh.quaternion.slerp(targetRot, 0.1);
                // Fix Rotation (Make it face the user? Or just fixed to wrist? Fixed to wrist is better for "Watch" feel)
                // But HTMLMesh might need rotation adjustment to be readable.
                // Let's rotate it -90 deg on X to be flat-ish like a watch?
                // Or actually, user rotates wrist. Let's keep it aligned with controller.
                menuMesh.rotateX(-Math.PI / 2);
            }

            // Broadcast Transform
            const now = performance.now();
            if (now - lastBroadcast > 100 && socketRef.current) {
                // Check if WE are manipulating (to avoid echo loops, though we can just blindly emit state)
                // Better: Emit generally.
                const transform = {
                    position: {
                        x: rootGroup.position.x,
                        y: rootGroup.position.y,
                        z: rootGroup.position.z,
                    },
                    rotation: {
                        x: rootGroup.rotation.x,
                        y: rootGroup.rotation.y,
                        z: rootGroup.rotation.z,
                    },
                    scale: rootGroup.scale.x,
                };
                socketRef.current.emit('update-molecule', transform);
                lastBroadcast = now;
            }
        };

        renderer.setAnimationLoop(animate);

        // Voice Command Listener (Integration)
        const handleVoiceCommand = (e: any) => {
            const action = e.detail.action;
            if (action === 'scale-up') {
                const current = rootGroup.scale.x;
                const next = Math.min(current * 1.2, 5.0); // +20%
                rootGroup.scale.setScalar(next);
            } else if (action === 'scale-down') {
                const current = rootGroup.scale.x;
                const next = Math.max(current * 0.8, 0.1); // -20%
                rootGroup.scale.setScalar(next);
            }
        };
        window.addEventListener('gear-voice-command', handleVoiceCommand);

        // Remote Update Listener (Socket -> Effect)
        const handleRemoteUpdate = (e: any) => {
            const data = e.detail;
            if (data.position && data.rotation && data.scale) {
                // Apply transforms
                rootGroup.position.set(
                    data.position.x,
                    data.position.y,
                    data.position.z
                );
                rootGroup.rotation.set(
                    data.rotation.x,
                    data.rotation.y,
                    data.rotation.z
                );
                rootGroup.scale.setScalar(data.scale);
            }
        };
        window.addEventListener('gear-remote-update', handleRemoteUpdate);

        // Add to existing animate loop? Or just run check inside animate.
        // We can add it to the 'animate' function defined above.

        return () => {
            window.removeEventListener(
                'gear-remote-update',
                handleRemoteUpdate
            );
            window.removeEventListener(
                'gear-voice-command',
                handleVoiceCommand
            );
            window.removeEventListener('resize', onWindowResize);
            if (container.contains(renderer.domElement))
                container.removeChild(renderer.domElement);
            if (container.contains(labelRenderer.domElement))
                container.removeChild(labelRenderer.domElement);
            if (document.body.contains(arButton))
                document.body.removeChild(arButton); // Remove AR Button
            renderer.dispose();

            // Disconnect Socket
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [fixedPdbUrl, visualStyle]); // Re-run when style changes

    // --- Socket.io Integration ---
    useEffect(() => {
        // Initialize Socket
        const socket = io(window.location.origin.replace('5173', '3001')); // Handle Vite proxy port
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to PDB Collab Socket');
            // Join a default room for now, or based on URL
            socket.emit('join-room', 'pdb-default-room');
        });

        // Listen: Transform Updates
        socket.on('update-molecule', (data: any) => {
            // data: { position, rotation, scale }
            // We need to access rootGroup.
            // Limitation: rootGroup is inside the main Effect.
            // We can use the custom event trick again to pass data into the effect!
            window.dispatchEvent(
                new CustomEvent('gear-remote-update', { detail: data })
            );
        });

        // Listen: Style Updates
        socket.on('update-style', (style: any) => {
            if (style !== visualStyleRef.current) {
                isRemoteUpdate.current = true;
                setVisualStyle(style);
                setVoiceStatus(`Remote: ${style}`);
                setTimeout(() => setVoiceStatus(''), 2000);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []); // Run once

    // Broadcast Style Changes
    useEffect(() => {
        if (socketRef.current && !isRemoteUpdate.current) {
            socketRef.current.emit('update-style', visualStyle);
        }
        isRemoteUpdate.current = false; // Reset flag
    }, [visualStyle]);

    // --- Voice Control Logic ---
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        let isIntentionalStop = false;

        recognition.onstart = () => {
            console.log('Voice Control Active');
        };

        recognition.onresult = (event: any) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript
                .trim()
                .toLowerCase();
            console.log('Voice Command:', command);

            // Visual Feedback
            setVoiceStatus(`" ${command} "`);
            setTimeout(() => setVoiceStatus(''), 2000);

            // Command Mapping
            if (command.includes('reset')) {
                const btnReset = document.getElementById('btn-reset');
                if (btnReset) btnReset.click();
            } else if (command.includes('ball') || command.includes('stick')) {
                setVisualStyle('ball-stick');
            } else if (
                command.includes('space') ||
                command.includes('sphere') ||
                command.includes('atom')
            ) {
                setVisualStyle('spacefill');
            } else if (
                command.includes('backbone') ||
                command.includes('wire')
            ) {
                setVisualStyle('backbone');
            } else if (
                command.includes('zoom in') ||
                command.includes('bigger') ||
                command.includes('enhance')
            ) {
                window.dispatchEvent(
                    new CustomEvent('gear-voice-command', {
                        detail: { action: 'scale-up' },
                    })
                );
            } else if (
                command.includes('zoom out') ||
                command.includes('smaller')
            ) {
                window.dispatchEvent(
                    new CustomEvent('gear-voice-command', {
                        detail: { action: 'scale-down' },
                    })
                );
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                // Ignore no-speech, it just means silence
                return; 
            }
            if (event.error === 'aborted') {
                console.warn('Speech Recognition Aborted');
                return;
            }
            console.error('Speech Recognition Error:', event.error);
        };

        recognition.onend = () => {
             if (!isIntentionalStop) {
                 // Auto-restart if it stopped unexpectedly
                 try {
                     recognition.start();
                 } catch (e) {
                     // ignore if already started
                 }
             }
        };

        // Start listening
        try {
            recognition.start();
        } catch (e) {
            // Already started
        }

        return () => {
            isIntentionalStop = true;
            recognition.stop();
        };
    }, []); // Run once on mount

    return (
        <div className="relative w-full h-full min-h-screen bg-transparent">
            {/* Voice Feedback Toast */}
            {voiceStatus && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className="bg-black/60 text-white px-6 py-4 rounded-full text-2xl font-bold backdrop-blur-md animate-bounce border border-white/20">
                        🎤 {voiceStatus}
                    </div>
                </div>
            )}

            {/* Background Layer - Hidden in AR */}
            {!arSessionActive && (
                <div className="absolute inset-0 bg-slate-900 -z-20" />
            )}

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
            <div
                id="ar-menu"
                className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none"
            >
                <div className="w-64 p-4 bg-slate-800/90 text-white rounded-xl border border-blue-500/50 flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-center border-b border-white/10 pb-2 mb-2">
                        Controls
                    </h3>
                    <button
                        id="btn-reset"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-center font-medium transition active:scale-95"
                    >
                        Reset View
                    </button>

                    <div className="grid grid-cols-3 gap-1 mt-2">
                        <button
                            id="btn-style-bs"
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition"
                        >
                            B&S
                        </button>
                        <button
                            id="btn-style-sf"
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition"
                        >
                            Space
                        </button>
                        <button
                            id="btn-style-bb"
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded transition"
                        >
                            Bone
                        </button>
                    </div>

                    <div className="mt-2 border-t border-white/10 pt-2">
                        <button
                            id="btn-mode-toggle"
                            className="w-full px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition"
                        >
                            Mode: Manipulate
                        </button>
                    </div>

                    <div className="text-xs text-slate-400 text-center mt-1">
                        Grab/Pinch to Move
                        <br />
                        Stick to Zoom
                    </div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center text-white bg-black/50">
                    <div className="text-xl font-bold animate-pulse">
                        Loading Molecule...
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-900/80 text-white px-8 py-6 rounded-xl border border-red-500 shadow-2xl max-w-md text-center">
                        <svg
                            className="w-12 h-12 mx-auto mb-4 text-red-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <h3 className="text-xl font-bold mb-2">
                            Failed to Load Molecule
                        </h3>
                        <p className="opacity-90">{error}</p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-10 text-slate-400 text-sm pointer-events-none bg-slate-900/50 p-2 rounded">
                <p>Model: {pdbUrl.split('/').pop()}</p>
                <p>Atoms: {atomCount}</p>
                <p>
                    Style:{' '}
                    {visualStyle === 'ball-stick'
                        ? 'Ball & Stick'
                        : visualStyle === 'spacefill'
                          ? 'Spacefill'
                          : 'Backbone'}
                </p>
                <p>
                    Controls: Desktop (Mouse) | AR (Grab/Pinch & Move, Stick
                    Up/Down to Scale)
                </p>
                <p>Renderer: WebGL + WebXR (AR) + Hand Tracking</p>
            </div>
        </div>
    );
};

export default PDBViewer;

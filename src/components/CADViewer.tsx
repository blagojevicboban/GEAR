import React, { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPES from 'three';
const THREE = (window as any).THREE as typeof THREE_TYPES;

// @ts-ignore
import { OrbitControls } from '../lib/three-examples/controls/OrbitControls.js';
// @ts-ignore
import initOpenCascade from 'opencascade.js';

interface CADViewerProps {
    fileUrl: string;
    onExit: () => void;
    fileName?: string;
}

const CADViewer: React.FC<CADViewerProps> = ({ fileUrl, onExit, fileName }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measurePoints, setMeasurePoints] = useState<THREE_TYPES.Vector3[]>(
        []
    );
    const [distance, setDistance] = useState<number | null>(null);

    const sceneRef = useRef<THREE_TYPES.Scene | null>(null);
    const cameraRef = useRef<THREE_TYPES.PerspectiveCamera | null>(null);
    const meshRef = useRef<THREE_TYPES.Mesh | null>(null);
    const measurementLinesRef = useRef<THREE_TYPES.Group | null>(null);

    useEffect(() => {
        let renderer: THREE_TYPES.WebGLRenderer;
        let scene: THREE_TYPES.Scene;
        let camera: THREE_TYPES.PerspectiveCamera;
        let frameId: number;
        let oc: any;

        const init = async () => {
            try {
                // Initialize OpenCascade
                oc = await initOpenCascade();

                // Initialize Three.js Scene
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0x050a14);
                sceneRef.current = scene;

                camera = new THREE.PerspectiveCamera(
                    45,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    2000
                );
                camera.position.set(50, 50, 50);
                cameraRef.current = camera;

                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                if (containerRef.current) {
                    containerRef.current.appendChild(renderer.domElement);
                }

                const controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;

                const measurementGroup = new THREE.Group();
                scene.add(measurementGroup);
                measurementLinesRef.current = measurementGroup;

                // Lights
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                scene.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(
                    0xffffff,
                    0.8
                );
                directionalLight.position.set(1, 1, 2);
                scene.add(directionalLight);

                // Fetch STEP file
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to download model: Server responded with ${response.status} ${response.statusText}`
                    );
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(
                        'Invalid model URL: Server returned HTML instead of a CAD file. This model entry might be corrupted.'
                    );
                }

                const buffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(buffer);

                // Load into OCCT virtual filesystem
                oc.FS.writeFile('/model.step', uint8Array);

                // Read STEP - Attempt 1 (Standard)
                let reader = new oc.STEPControl_Reader_1();
                let status = reader.ReadFile('/model.step');

                // Helper to check status success (handles integer or object case)
                const isSuccess = (s: any) => {
                    if (s === oc.IFSelect_ReturnStatus.IFSelect_RetDone)
                        return true;
                    // Handle potential object wrapper (e.g. Emscripten enum object)
                    if (
                        typeof s === 'object' &&
                        s !== null &&
                        s.value ===
                            oc.IFSelect_ReturnStatus.IFSelect_RetDone.value
                    )
                        return true;
                    return false;
                };

                // Debug log status
                console.log('Initial Reader Status:', status);

                if (!isSuccess(status)) {
                    console.warn(
                        `Initial STEP read failed or returned warning. Status:`,
                        status
                    );

                    try {
                        const decoder = new TextDecoder('iso-8859-1');
                        const fileText = decoder.decode(uint8Array);

                        // Check for AP214 or other critical markers
                        if (
                            fileText.includes('AUTOMOTIVE_DESIGN') ||
                            fileText.includes('AP214')
                        ) {
                            console.log(
                                'AP214 detected. Patching header to AP203...'
                            );

                            const patchedText = fileText
                                .replace(
                                    /['"]?AUTOMOTIVE_DESIGN['"]?/gi,
                                    "'CONFIG_CONTROL_DESIGN'"
                                )
                                .replace(
                                    /['"]?STEP AP214['"]?/gi,
                                    "'STEP AP203'"
                                );

                            const patchedData = new TextEncoder().encode(
                                patchedText
                            );
                            oc.FS.writeFile('/model_patched.step', patchedData);

                            // Retry with patched file
                            reader = new oc.STEPControl_Reader_1();
                            status = reader.ReadFile('/model_patched.step');
                            console.log('Patched Reader Status:', status);

                            if (isSuccess(status)) {
                                console.log('Success: Patched file loaded.');
                            }
                        }
                    } catch (err) {
                        console.error('Patching failed:', err);
                    }
                }

                // Attempt to transfer roots even if status wasn't perfect (sometimes RetWarn works)
                try {
                    reader.TransferRoots();
                } catch (transferErr) {
                    console.error('TransferRoots failed:', transferErr);
                    // Only throw if we truly have nothing
                    if (!isSuccess(status)) {
                        const statusCode =
                            typeof status === 'object' && status !== null
                                ? JSON.stringify(status)
                                : status;
                        throw new Error(
                            `Failed to process STEP file (Status: ${statusCode}). The file might be corrupted or use an unsupported schema.`
                        );
                    }
                }

                const shape = reader.OneShape();
                if (shape.IsNull()) {
                    throw new Error(
                        'STEP file contains no valid geometry (Shape is Null). It might be an empty assembly structure.'
                    );
                }

                // Tessellate
                new oc.BRepMesh_IncrementalMesh_2(
                    shape,
                    0.1,
                    false,
                    0.5,
                    false
                );

                // Convert to Three.js BufferGeometry
                const geometry = new THREE.BufferGeometry();
                const vertices: number[] = [];

                const explorer = new oc.TopExp_Explorer_2(
                    shape,
                    oc.TopAbs_ShapeEnum.TopAbs_FACE,
                    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
                );
                while (explorer.More()) {
                    const face = oc.TopoDS.Face_1(explorer.Current());
                    const location = new oc.TopLoc_Location_1();
                    const poly = oc.BRep_Tool.Triangulation(face, location);

                    if (!poly.IsNull()) {
                        const trsf = location.Transformation();
                        const nodes = poly.get().Nodes();
                        const triangles = poly.get().Triangles();

                        for (let i = 1; i <= triangles.Length(); i++) {
                            const triangle = triangles.Value(i);
                            for (let j = 1; j <= 3; j++) {
                                const index = triangle.Value(j);
                                const p = nodes.Value(index).Transformed(trsf);
                                vertices.push(p.X(), p.Y(), p.Z());
                            }
                        }
                    }
                    explorer.Next();
                }

                geometry.setAttribute(
                    'position',
                    new THREE.Float32BufferAttribute(vertices, 3)
                );
                geometry.computeVertexNormals();

                const material = new THREE.MeshStandardMaterial({
                    color: 0x818cf8,
                    metalness: 0.7,
                    roughness: 0.3,
                    side: THREE.DoubleSide,
                });
                const mesh = new THREE.Mesh(geometry, material);

                // Center model
                geometry.computeBoundingBox();
                const box = geometry.boundingBox!;
                const center = new THREE.Vector3();
                box.getCenter(center);
                mesh.position.sub(center);

                // Auto-Focus Camera: Calculate optimal distance
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraDist *= 1.5; // Add some padding

                // Position camera isometrically
                const direction = new THREE.Vector3(1, 1, 1).normalize();
                const position = direction.multiplyScalar(cameraDist);

                camera.position.copy(position);
                camera.lookAt(0, 0, 0);
                controls.target.set(0, 0, 0);
                controls.update();

                meshRef.current = mesh;
                scene.add(mesh);

                setIsLoading(false);

                const animate = () => {
                    frameId = requestAnimationFrame(animate);
                    controls.update();
                    if (renderer && scene && camera) {
                        renderer.render(scene, camera);
                    }
                };
                animate();
            } catch (err: any) {
                console.error(err);
                setError(
                    err.message || 'An error occurred during CAD rendering.'
                );
                setIsLoading(false);
            }
        };

        init();

        const handleResize = () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            if (renderer) renderer.dispose();
        };
    }, [fileUrl]);

    const handleMouseClick = (event: React.MouseEvent) => {
        if (
            !isMeasuring ||
            !meshRef.current ||
            !cameraRef.current ||
            !sceneRef.current
        )
            return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

        const intersects = raycaster.intersectObject(meshRef.current);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const newPoints = [...measurePoints, point];

            if (newPoints.length > 2) {
                setMeasurePoints([point]);
                setDistance(null);
                if (measurementLinesRef.current)
                    measurementLinesRef.current.clear();

                const dot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 })
                );
                dot.position.copy(point);
                measurementLinesRef.current?.add(dot);
            } else {
                setMeasurePoints(newPoints);

                const dot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 })
                );
                dot.position.copy(point);
                measurementLinesRef.current?.add(dot);

                if (newPoints.length === 2) {
                    const dist = newPoints[0].distanceTo(newPoints[1]);
                    setDistance(dist);

                    const lineGeometry =
                        new THREE.BufferGeometry().setFromPoints([
                            newPoints[0],
                            newPoints[1],
                        ]);
                    const line = new THREE.Line(
                        lineGeometry,
                        new THREE.LineBasicMaterial({ color: 0xff0000 })
                    );
                    measurementLinesRef.current?.add(line);
                }
            }
        }
    };

    const clearMeasurements = () => {
        setMeasurePoints([]);
        setDistance(null);
        if (measurementLinesRef.current) measurementLinesRef.current.clear();
    };

    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900/90 to-transparent">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onExit}
                        className="bg-slate-800/80 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-all border border-slate-600 shadow-lg"
                    >
                        ← Exit
                    </button>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">
                            {fileName}
                        </span>
                        <span className="text-slate-400 text-[10px] uppercase tracking-widest font-mono">
                            Precision CAD Mode
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setIsMeasuring(!isMeasuring);
                            if (!isMeasuring) clearMeasurements();
                        }}
                        className={`px-6 py-2 rounded-full font-bold transition-all border shadow-lg ${isMeasuring ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800/80 text-slate-300 border-slate-600 hover:bg-slate-700'}`}
                    >
                        {isMeasuring
                            ? '📏 Measuring Interface'
                            : '📐 Measure Tool'}
                    </button>
                    <div className="hidden md:flex px-4 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] items-center font-bold uppercase tracking-widest rounded-full border border-indigo-500/30">
                        OpenCascade WASM v7.x
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className={`flex-1 w-full h-full ${isMeasuring ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
                onClick={handleMouseClick}
            />

            {isMeasuring && distance !== null && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.4)] border border-indigo-400 animate-in zoom-in slide-in-from-bottom-5">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                        Calculated Precision Distance
                    </div>
                    <div className="text-3xl font-black font-mono flex items-baseline gap-2">
                        {distance.toFixed(3)}
                        <span className="text-xs opacity-80 decoration-indigo-300 underline underline-offset-4">
                            mm
                        </span>
                    </div>
                </div>
            )}

            {isMeasuring && distance === null && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md text-slate-300 px-6 py-3 rounded-full border border-slate-700 pointer-events-none">
                    {measurePoints.length === 0
                        ? 'Click any surface to start measuring'
                        : 'Select target point for distance calculation'}
                </div>
            )}

            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-20">
                    <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        Analyzing Industrial Geometry
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Tessellating BREP surfaces via OpenCascade WASM...
                    </p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-950 z-30">
                    <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 p-8 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                            <svg
                                className="w-8 h-8"
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
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            CAD Load Failed
                        </h2>
                        <p className="text-slate-400 mb-8">{error}</p>
                        <button
                            onClick={onExit}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                        >
                            Back to Gallery
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CADViewer;

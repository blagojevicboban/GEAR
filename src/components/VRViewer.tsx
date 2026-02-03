import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { VETModel, Hotspot } from '../types';
import { analyzeModelDescription } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// @ts-ignore
import { STLLoader } from '../lib/three-examples/loaders/STLLoader.js';
import { io, Socket } from 'socket.io-client';
import './AssemblyManager'; // Register Assembly Mode components
import Avatar from './Avatar';

// A-Frame types
declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                'a-scene': any;
                'a-assets': any;
                'a-asset-item': any;
                'a-entity': any;
                'a-camera': any;
                'a-sky': any;
                'a-gltf-model': any;
                'a-text': any;
                'a-grid-helper': any;
                'a-sphere': any;
                'a-cursor': any;
                [elemName: string]: any;
            }
        }
    }
}

// --- A-Frame Component Registrations (Outside component to ensure single registration) ---
if (typeof window !== 'undefined' && (window as any).AFRAME) {
    const AFRAME = (window as any).AFRAME;

    if (!AFRAME.components['hotspot-trigger']) {
        AFRAME.registerComponent('hotspot-trigger', {
            init: function () {
                this.el.addEventListener('click', (_evt: any) => {
                    this.el.emit(
                        'hotspot-activated',
                        { id: this.el.getAttribute('data-id') },
                        true
                    );
                });
            },
        });
    }

    if (!AFRAME.components['mouse-wheel-zoom']) {
        AFRAME.registerComponent('mouse-wheel-zoom', {
            schema: {
                min: { default: 0.5 },
                max: { default: 15 },
                step: { default: 0.2 },
            },
            init: function () {
                this.onWheel = (e: WheelEvent) => {
                    if (this.el.sceneEl.is('vr-mode')) return;
                    const pos = this.el.getAttribute('position');
                    let newZ =
                        pos.z +
                        (e.deltaY > 0 ? this.data.step : -this.data.step);
                    newZ = Math.min(
                        Math.max(newZ, this.data.min),
                        this.data.max
                    );
                    this.el.setAttribute('position', {
                        x: pos.x,
                        y: pos.y,
                        z: newZ,
                    });
                };
                window.addEventListener('wheel', this.onWheel, {
                    passive: true,
                });
            },
            remove: function () {
                window.removeEventListener('wheel', this.onWheel);
            },
        });
    }

    if (!AFRAME.components['drag-rotate']) {
        AFRAME.registerComponent('drag-rotate', {
            schema: { speed: { default: 1 } },
            init: function () {
                this.ifMouseDown = false;
                this.onMouseDown = (e: any) => {
                    if (this.el.sceneEl.is('vr-mode')) return;
                    const isTouch = !!(e.touches || e.changedTouches);
                    if (!isTouch && !e.ctrlKey) return;
                    this.ifMouseDown = true;
                    this.x_cord = e.clientX || e.touches?.[0].clientX;
                };
                this.onMouseUp = () => {
                    this.ifMouseDown = false;
                };
                this.onMouseMove = (e: any) => {
                    if (this.ifMouseDown) {
                        const x = e.clientX || e.touches?.[0].clientX;
                        const rot = this.el.getAttribute('rotation');
                        this.el.setAttribute('rotation', {
                            x: rot.x,
                            y:
                                rot.y +
                                (x - this.x_cord) * this.data.speed * 0.5,
                            z: rot.z,
                        });
                        this.x_cord = x;
                    }
                };
                window.addEventListener('mousedown', this.onMouseDown);
                window.addEventListener('touchstart', this.onMouseDown);
                window.addEventListener('mouseup', this.onMouseUp);
                window.addEventListener('touchend', this.onMouseUp);
                window.addEventListener('mousemove', this.onMouseMove);
                window.addEventListener('touchmove', this.onMouseMove);
            },
            remove: function () {
                window.removeEventListener('mousedown', this.onMouseDown);
                window.removeEventListener('touchstart', this.onMouseDown);
                window.removeEventListener('mouseup', this.onMouseUp);
                window.removeEventListener('touchend', this.onMouseUp);
                window.removeEventListener('mousemove', this.onMouseMove);
                window.removeEventListener('touchmove', this.onMouseMove);
            },
        });
    }

    if (!AFRAME.components['stl-model']) {
        AFRAME.registerComponent('stl-model', {
            schema: { src: { type: 'string' } },
            init: function () {
                const loader = new STLLoader();
                const el = this.el;
                loader.load(this.data.src, (geometry: any) => {
                    const material = new (
                        window as any
                    ).THREE.MeshStandardMaterial({
                        color: 0xcccccc,
                        metalness: 0.5,
                        roughness: 0.5,
                    });
                    const mesh = new (window as any).THREE.Mesh(
                        geometry,
                        material
                    );
                    el.setObject3D('mesh', mesh);
                });
            },
        });
    }

    if (!AFRAME.components['wireframe-toggle']) {
        AFRAME.registerComponent('wireframe-toggle', {
            schema: { enabled: { default: false } },
            update: function () {
                const mesh = this.el.getObject3D('mesh');
                if (!mesh) return;
                mesh.traverse((node: any) => {
                    if (node.isMesh && node.material) {
                        if (Array.isArray(node.material)) {
                            node.material.forEach((m: any) => {
                                m.wireframe = this.data.enabled;
                            });
                        } else {
                            node.material.wireframe = this.data.enabled;
                        }
                    }
                });
            }
        });
    }

    if (!AFRAME.components['renderer-settings']) {
        AFRAME.registerComponent('renderer-settings', {
            schema: {
                exposure: { type: 'number', default: 1.0 },
                toneMapping: { type: 'string', default: 'ACESFilmicToneMapping' }
            },
            init: function() {
                this.applySettings = this.applySettings.bind(this);
                this.el.sceneEl.addEventListener('render-target-loaded', this.applySettings);
            },
            update: function () {
                this.applySettings();
            },
            applySettings: function() {
                const renderer = this.el.sceneEl.renderer;
                if (!renderer) return;

                renderer.toneMappingExposure = this.data.exposure;
                
                const THREE = (window as any).THREE;
                const mapping: any = {
                    'NoToneMapping': THREE.NoToneMapping,
                    'LinearToneMapping': THREE.LinearToneMapping,
                    'ReinhardToneMapping': THREE.ReinhardToneMapping,
                    'CineonToneMapping': THREE.CineonToneMapping,
                    'ACESFilmicToneMapping': THREE.ACESFilmicToneMapping
                };
                
                if (mapping[this.data.toneMapping] !== undefined) {
                    renderer.toneMapping = mapping[this.data.toneMapping];
                }
            },
            remove: function() {
                this.el.sceneEl.removeEventListener('render-target-loaded', this.applySettings);
            }
        });
    }
}

interface VRViewerProps {
    model: VETModel;
    onExit: () => void;
    workshopMode?: boolean;
    workshopId?: string;
    user?: any;
    onObjectClick?: (meshName: string) => void;
    isEditMode?: boolean;
    onHotspotPlace?: (
        position: { x: number; y: number; z: number },
        normal: { x: number; y: number; z: number }
    ) => void;
}

// --- Audio Utils ---
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

import { speak, cancelSpeech } from '../utils/tts';
import { fixAssetUrl } from '../utils/urlUtils';

const VRViewer: React.FC<VRViewerProps> = ({
    model,
    onExit,
    workshopMode,
    workshopId,
    user,
    onObjectClick,
    isEditMode,
    onHotspotPlace,
}) => {
    const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
    const [trainingTasks, setTrainingTasks] = useState<any[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
    const [remoteParticipants, setRemoteParticipants] = useState<any[]>([]);
    // Gamification State
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [challengeFeedback, setChallengeFeedback] = useState<{
        msg: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);

    // Assembly Mode State
    const [isAssemblyMode, setIsAssemblyMode] = useState(false);

    // Optimization State
    const [useOptimized, setUseOptimized] = useState(
        model.optimized && !!model.optimizedUrl
    );
    // Compute active URL
    const activeModelUrl =
        useOptimized && model.optimizedUrl
            ? fixAssetUrl(model.optimizedUrl)
            : fixAssetUrl(model.modelUrl);

    // --- Teacher Sync & Pointer State ---
    const [isTeacherSyncActive, setIsTeacherSyncActive] = useState(false);
    const [isTeacherPointerActive, setIsTeacherPointerActive] = useState(false);
    const [teacherPointer, setTeacherPointer] = useState<{ origin: any, target: any, active?: boolean } | null>(null);

    const activePointerRef = useRef<{ origin: any, target: any } | null>(null);

    const socketRef = useRef<Socket | null>(null);

    const sceneRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const mentorPosRef = useRef({ x: 1.5, y: 1.6, z: -1 });

    const sessionRef = useRef<any>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const pannerRef = useRef<PannerNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const micStreamRef = useRef<MediaStream | null>(null);
    const { t, i18n } = useTranslation();
    const modelEntityRef = useRef<any>(null);
    const [isExploded, setIsExploded] = useState(false);
    
    // Contextual Gaze State
    const [activePartName, setActivePartName] = useState<string | null>(null);
    const lastContextSentRef = useRef<string | null>(null);

    // --- Gamification State ---
    const [challengeMode, setChallengeMode] = useState(false);
    const [challengeStartTime, setChallengeStartTime] = useState<number | null>(null);
    const [challengeTime, setChallengeTime] = useState(0); // ms
    const [isChallengeComplete, setIsChallengeComplete] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

    // --- Studio Mode State (glTF Sample Viewer style) ---
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [studioConfig, setStudioConfig] = useState({
        environment: 'contact', // contact, egypt, forest, etc from aframe-environment-component
        exposure: 1.0,
        toneMapping: 'ACESFilmic',
        wireframe: false,
        showBoundingBox: false,
        autoRotate: false
    });
    const [modelStats, setModelStats] = useState({
        vertices: 0,
        triangles: 0,
        meshes: 0,
        materials: 0
    });

    const assemblySystem = (window as any).AFRAME?.systems['assembly-mode-system'];

    // Load leaderboard
    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch(`/api/scores/${model.id}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboardData(data);
            }
        } catch (e) {
            console.error("Failed to fetch leaderboard", e);
        }
    }, [model.id]);

    useEffect(() => {
        if (showLeaderboard) fetchLeaderboard();
    }, [showLeaderboard, fetchLeaderboard]);

    // Challenge Logic
    useEffect(() => {
        let interval: any;
        if (challengeMode && challengeStartTime && !isChallengeComplete) {
            interval = setInterval(() => {
                setChallengeTime(Date.now() - challengeStartTime);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [challengeMode, challengeStartTime, isChallengeComplete]);

    // Start Timer on first task
    useEffect(() => {
        if (challengeMode && !challengeStartTime && activeTaskId) {
            setChallengeStartTime(Date.now());
        }
    }, [challengeMode, challengeStartTime, activeTaskId]);

    // Check Completion
    useEffect(() => {
        if (challengeMode && !isChallengeComplete && challengeStartTime && trainingTasks.length > 0) {
            const allComplete = trainingTasks.every(t => t.status === 'completed');
            if (allComplete) {
                setIsChallengeComplete(true);
                const finalTime = (Date.now() - challengeStartTime) / 1000;
                // Save Score
                fetch('/api/scores', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        userId: user?.id || 1, // Fallback for dev
                        username: user?.username || 'Guest',
                        modelId: model.id,
                        timeSeconds: finalTime
                    })
                }).then(() => {
                     playSound('success');
                     setShowLeaderboard(true);
                });
            }
        }
    }, [challengeMode, isChallengeComplete, challengeStartTime, trainingTasks, user, model.id]);

    const playSound = useCallback(
        (type: 'click' | 'ping' | 'dismiss' | 'success') => {
            try {
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new (
                        window.AudioContext ||
                        (window as any).webkitAudioContext
                    )();
                }
                const ctx = audioCtxRef.current;
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                const now = ctx.currentTime;
                if (type === 'click') {
                    osc.frequency.setValueAtTime(880, now);
                    gain.gain.setValueAtTime(0.08, now);
                    osc.start(now);
                    osc.stop(now + 0.05);
                } else if (type === 'ping') {
                    osc.frequency.setValueAtTime(523, now);
                    gain.gain.setValueAtTime(0.1, now);
                    osc.start(now);
                    osc.stop(now + 0.2);
                }
            } catch (e) {
                console.error('Audio playback error');
            }
        },
        []
    );

    useEffect(() => {
        const el = modelEntityRef.current;
        if (!el) return;

        const clickHandler = (evt: any) => {
            const intersection = evt.detail.intersection;

            if (intersection) {
                // Edit Mode Priority: Hotspot Placement
                if (isEditMode && onHotspotPlace) {
                    onHotspotPlace(
                        intersection.point,
                        intersection.face?.normal || { x: 0, y: 1, z: 0 }
                    );
                    return;
                }

                // Object Click Logic
                if (onObjectClick && intersection.object) {
                    let name = intersection.object.name;
                    if (!name || name.includes('Scene')) {
                        // Try parent
                        name = intersection.object.parent?.name || name;
                    }

                    // Gamification Logic: Check active challenge
                    if (activeTaskId !== null && isAssemblyMode) {
                        const task = trainingTasks.find(
                            (t) => t.id === activeTaskId
                        );
                        if (task && task.status !== 'completed') {
                            // Check match
                            const keywords = task.keywords || [];
                            const isMatch = keywords.some((k: string) =>
                                name.toLowerCase().includes(k.toLowerCase())
                            );

                            if (isMatch) {
                                playSound('success');
                                setChallengeFeedback({
                                    msg: `✅ Found ${name}! Now pull it out using the arrows.`,
                                    type: 'success',
                                });
                                // We don't mark complete yet, we wait for movement?
                                // For V1 "Find" is enough, or we listen to transform change?
                                // Let's mark as "Found" state or just Complete for simplicity in V1

                                const newTasks = trainingTasks.map((t) =>
                                    t.id === activeTaskId
                                        ? { ...t, status: 'completed' }
                                        : t
                                );
                                setTrainingTasks(newTasks);
                                setActiveTaskId(null);
                                setTimeout(
                                    () => setChallengeFeedback(null),
                                    3000
                                );
                            } else {
                                playSound('dismiss');
                                setChallengeFeedback({
                                    msg: `❌ That&apos;s ${name}. Look for: ${keywords.join(' or ')}`,
                                    type: 'error',
                                });
                            }
                        }
                    }

                    onObjectClick(name);
                }
            }
        };

        el.addEventListener('click', clickHandler);

        // Assembly Mode: Register parts on load
        const loadHandler = (evt: any) => {
            const model = evt.detail.model; // THREE.Group
            if (!model) return;

            // Get system if not yet available (it should be valid by now)
            const system = bgSceneRef.current?.systems['assembly-mode-system'];
            if (system) {
                console.log('Assembly System Found');
                
                let vertices = 0;
                let triangles = 0;
                let meshes = 0;
                const materials = new Set();

                // --- Auto-centering and Scaling Logic ---
                const THREE = (window as any).THREE;
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);
                
                const maxDim = Math.max(size.x, size.y, size.z);
                console.log('Model dimensions:', size, 'Max dim:', maxDim);
                
                if (maxDim > 0) {
                    // We want the model to be roughly 1.5 - 2 meters in size for comfortable viewing
                    const targetSize = 2.0;
                    const scaleFactor = targetSize / maxDim;
                    
                    // Apply scale to the GLTF model instance
                    evt.target.setAttribute('scale', `${scaleFactor} ${scaleFactor} ${scaleFactor}`);
                    
                    // Center the model relative to its entity origin
                    // We compensate for the offset
                    const offset = center.multiplyScalar(-scaleFactor);
                    model.position.set(offset.x, offset.y, offset.z);
                    console.log(`Auto-scaled by ${scaleFactor.toFixed(4)}, centered at offset:`, offset);
                }

                model.traverse((node: any) => {
                    if (node.isMesh) {
                        system.registerPart(node);
                        meshes++;
                        if (node.geometry) {
                            vertices += node.geometry.attributes.position.count;
                            if (node.geometry.index) {
                                triangles += node.geometry.index.count / 3;
                            } else {
                                triangles += node.geometry.attributes.position.count / 3;
                            }
                        }
                        if (node.material) {
                            if (Array.isArray(node.material)) {
                                node.material.forEach((m: any) => materials.add(m.uuid));
                            } else {
                                materials.add(node.material.uuid);
                            }
                        }
                    }
                });
                
                setModelStats({
                    vertices,
                    triangles: Math.floor(triangles),
                    meshes,
                    materials: materials.size
                });

                console.log('Assembly Mode: Parts Registered');
            }
        };

        el.addEventListener('model-loaded', loadHandler);
        // Also try to register if already loaded?
        // A-Frame might have loaded it already if we are hot-reloading

        return () => {
            el.removeEventListener('click', clickHandler);
            el.removeEventListener('model-loaded', loadHandler);
        };
    }, [
        onObjectClick,
        model.id,
        isEditMode,
        onHotspotPlace,
        activeTaskId,
        isAssemblyMode,
        trainingTasks,
    ]);

    // Ref for the scene to access systems
    const bgSceneRef = useRef<any>(null);

    const updateAudioListener = useCallback(() => {
        if (!outputAudioContextRef.current || !sceneRef.current) return;
        const camera = sceneRef.current.camera;
        if (!camera) return;

        const listener = outputAudioContextRef.current.listener;
        const position = camera.getWorldPosition(
            new (window as any).THREE.Vector3()
        );
        const quaternion = camera.getWorldQuaternion(
            new (window as any).THREE.Quaternion()
        );

        const forward = new (window as any).THREE.Vector3(
            0,
            0,
            -1
        ).applyQuaternion(quaternion);
        const up = new (window as any).THREE.Vector3(0, 1, 0).applyQuaternion(
            quaternion
        );

        if (listener.positionX) {
            listener.positionX.setTargetAtTime(position.x, 0, 0.1);
            listener.positionY.setTargetAtTime(position.y, 0, 0.1);
            listener.positionZ.setTargetAtTime(position.z, 0, 0.1);
            listener.forwardX.setTargetAtTime(forward.x, 0, 0.1);
            listener.forwardY.setTargetAtTime(forward.y, 0, 0.1);
            listener.forwardZ.setTargetAtTime(forward.z, 0, 0.1);
            listener.upX.setTargetAtTime(up.x, 0, 0.1);
            listener.upY.setTargetAtTime(up.y, 0, 0.1);
            listener.upZ.setTargetAtTime(up.z, 0, 0.1);
        } else {
            (listener as any).setPosition(position.x, position.y, position.z);
            (listener as any).setOrientation(
                forward.x,
                forward.y,
                forward.z,
                up.x,
                up.y,
                up.z
            );
        }
    }, []);

    useEffect(() => {
        let animFrame: number;
        const loop = () => {
            updateAudioListener();
            animFrame = requestAnimationFrame(loop);
        };
        if (isVoiceActive) loop();
        return () => cancelAnimationFrame(animFrame);
    }, [isVoiceActive, updateAudioListener]);

    const stopVoiceSession = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((t) => t.stop());
            micStreamRef.current = null;
        }
        setIsVoiceActive(false);
        setIsAssistantSpeaking(false);
    }, []);

    const startVoiceSession = useCallback(async () => {
        try {
            setIsVoiceActive(true);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            inputAudioContextRef.current = new (
                window.AudioContext || (window as any).webkitAudioContext
            )({ sampleRate: 16000 });
            outputAudioContextRef.current = new (
                window.AudioContext || (window as any).webkitAudioContext
            )({ sampleRate: 24000 });
            const outCtx = outputAudioContextRef.current;
            const panner = outCtx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 10000;
            panner.rolloffFactor = 1;
            panner.positionX.setValueAtTime(
                mentorPosRef.current.x,
                outCtx.currentTime
            );
            panner.positionY.setValueAtTime(
                mentorPosRef.current.y,
                outCtx.currentTime
            );
            panner.positionZ.setValueAtTime(
                mentorPosRef.current.z,
                outCtx.currentTime
            );
            panner.connect(outCtx.destination);
            pannerRef.current = panner;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            micStreamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        const source =
                            inputAudioContextRef.current!.createMediaStreamSource(
                                stream
                            );
                        const scriptProcessor =
                            inputAudioContextRef.current!.createScriptProcessor(
                                4096,
                                1,
                                1
                            );
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++)
                                int16[i] = inputData[i] * 32768;
                            sessionPromise.then((s) =>
                                s.sendRealtimeInput({
                                    media: {
                                        data: encode(
                                            new Uint8Array(int16.buffer)
                                        ),
                                        mimeType: 'audio/pcm;rate=16000',
                                    },
                                })
                            );
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(
                            inputAudioContextRef.current!.destination
                        );
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const parts = message.serverContent?.modelTurn?.parts;
                        const audioData =
                            parts && parts.length > 0
                                ? parts[0].inlineData?.data
                                : null;
                        if (audioData) {
                            setIsAssistantSpeaking(true);
                            nextStartTimeRef.current = Math.max(
                                nextStartTimeRef.current,
                                outCtx.currentTime
                            );
                            const buffer = await decodeAudioData(
                                decode(audioData),
                                outCtx,
                                24000,
                                1
                            );
                            const source = outCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(pannerRef.current!);
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                                if (audioSourcesRef.current.size === 0)
                                    setIsAssistantSpeaking(false);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onclose: () => stopVoiceSession(),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                    systemInstruction: `You are a Technical VET Mentor at THE GEAR platform. Context: ${model.description}.`,
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (err) {
            stopVoiceSession();
        }
    }, [model.description, stopVoiceSession]);

    const handleToggleVoice = () => {
        playSound('click');
        if (isVoiceActive) stopVoiceSession();
        else startVoiceSession();
    };

    const handleHotspotEvent = useCallback(
        (evt: any) => {
            const id = evt.detail?.id;
            if (!id) return;
            const hs = model.hotspots.find((h) => h.id === id);
            if (hs) {
                playSound('ping');
                setActiveHotspot(hs);
            }
        },
        [model.hotspots, playSound]
    );

    useEffect(() => {
        const getTasks = async () => {
            setIsLoadingTasks(true);
            const tasks = await analyzeModelDescription(
                model.name,
                model.description
            );
            setTrainingTasks(tasks);
            setIsLoadingTasks(false);
        };
        getTasks();

        const scene = sceneRef.current;
        if (scene) {
            scene.addEventListener('hotspot-activated', handleHotspotEvent);
        }

        return () => {
            if (scene) {
                scene.removeEventListener(
                    'hotspot-activated',
                    handleHotspotEvent
                );
            }
            stopVoiceSession();
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [model.name, model.description, handleHotspotEvent, stopVoiceSession]);

    // Keyword Extractor Helper
    const extractKeywords = (text: string) => {
        // Simple noun extraction heuristic
        const words = text
            .split(' ')
            .filter((w) => w.length > 3)
            .map((w) => w.replace(/[^a-zA-Z]/g, ''));
        return words;
    };

    useEffect(() => {
        if (trainingTasks.length > 0 && !trainingTasks[0].status) {
            // Initialize tasks with status and keywords
            setTrainingTasks((prev) =>
                prev.map((t, i) => ({
                    ...t,
                    id: i,
                    status: 'pending', // 'pending' | 'completed'
                    keywords: extractKeywords(
                        t.taskName || t.description || ''
                    ),
                }))
            );
        }
    }, [trainingTasks]);

    // Workshop Socket Setup
    useEffect(() => {
        if (!workshopMode || !workshopId || !user) return;

        const socket = io(window.location.origin.replace('5173', '3001')); // Handle Vite proxy
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-workshop', { workshopId, user });
        });

        socket.on('current-participants', (participants) => {
            setRemoteParticipants(
                participants.filter((p: any) => p.socketId !== socket.id)
            );
        });

        socket.on('user-joined', ({ socketId, user }) => {
            setRemoteParticipants((prev) => [
                ...prev,
                {
                    socketId,
                    ...user,
                    transforms: {
                        head: {
                            pos: { x: 0, y: 1.6, z: 0 },
                            rot: { x: 0, y: 0, z: 0 },
                        },
                    },
                },
            ]);
        });

        socket.on('participant-moved', ({ socketId, transforms }) => {
            setRemoteParticipants((prev) =>
                prev.map((p) =>
                    p.socketId === socketId ? { ...p, transforms } : p
                )
            );
        });

        socket.on('user-left', (socketId) => {
            setRemoteParticipants((prev) =>
                prev.filter((p) => p.socketId !== socketId)
            );
        });

        socket.on('workshop-event', ({ type, data }) => {
            if (type === 'hotspot-activated') {
                const hs = model.hotspots.find((h) => h.id === data.id);
                if (hs) setActiveHotspot(hs);
            }
        });

        // --- Teacher Sync Listeners ---
        socket.on('teacher-sync-update', ({ socketId, camera }) => {
            // Apply camera transform to local camera rig if NOT the teacher
            // We only sync if we are a student? Or generally if not the sender?
            if (user?.role !== 'teacher' || socketId !== socket.id) {
                // Determine if we should follow (maybe a toggle for students "Follow Teacher"?)
                // For now, FORCE sync if feature is active
                const rig = document.querySelector('#rig');
                const cam = document.querySelector('[camera]');
                
                if (rig && camera) {
                    // Update Rig Position
                    rig.setAttribute('position', camera.position);
                    
                    // Update Camera Rotation (LookControls might fight this)
                    // We might need to disable look-controls momentarily or use look-controls API
                    if (cam) {
                         const lookControls = (cam as any).components['look-controls'];
                         if (lookControls) {
                             lookControls.yawObject.rotation.y = camera.rotation.y * (Math.PI / 180);
                             lookControls.pitchObject.rotation.x = camera.rotation.x * (Math.PI / 180);
                         }
                    }
                }
            }
        });

        socket.on('teacher-pointer-move', ({ pointer }) => {
            if (pointer && pointer.active) {
                setTeacherPointer(pointer);
            } else {
                setTeacherPointer(null);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [workshopMode, workshopId, user, model.hotspots]);

    // Update position to server
    useEffect(() => {
        if (!workshopMode || !workshopId || !socketRef.current) return;

        const interval = setInterval(() => {
            if (!socketRef.current) return;
            const camera = sceneRef.current?.camera;

            const transforms: any = {
                head: { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 } },
            };

            if (camera) {
                const pos = camera.getWorldPosition(
                    new (window as any).THREE.Vector3()
                );
                const rot = camera.getWorldQuaternion(
                    new (window as any).THREE.Quaternion()
                );
                const euler = new (
                    window as any
                ).THREE.Euler().setFromQuaternion(rot, 'YXZ');

                transforms.head = {
                    pos: { x: pos.x, y: pos.y, z: pos.z },
                    rot: {
                        x: (euler.x * 180) / Math.PI,
                        y: (euler.y * 180) / Math.PI,
                        z: (euler.z * 180) / Math.PI,
                    },
                };
                
                // Teacher Sync Emission
                if (isTeacherSyncActive) {
                     socketRef.current.emit('teacher-sync-update', {
                        workshopId,
                        camera: {
                            position: { x: pos.x, y: pos.y - 1.6, z: pos.z }, // Offset for rig?
                            rotation: transforms.head.rot
                        }
                    });
                }

                // Teacher Pointer Logic
                if (isTeacherPointerActive) {
                     // Raycast from camera center
                     // We can reuse the cursor raycaster or create a math one
                     const raycaster = new (window as any).THREE.Raycaster();
                     raycaster.setFromCamera({ x: 0, y: 0 }, camera); // Center of screen
                     
                     // Ray length 10m
                     const farPoint = new (window as any).THREE.Vector3();
                     raycaster.ray.at(10, farPoint);
                     
                     // Check intersection with model
                     const modelEl = document.querySelector('.interactable-model');
                     let target = farPoint;
                     
                     if (modelEl) {
                         const intersects = raycaster.intersectObject((modelEl as any).object3D, true);
                         if (intersects.length > 0) {
                             target = intersects[0].point;
                         }
                     }
                     
                     // Emit
                     const pointerData = {
                         active: true,
                         origin: pos,
                         target: target
                     };
                     
                     // Update local visual instantly
                     setTeacherPointer(pointerData as any); 

                     socketRef.current.emit('teacher-pointer-move', {
                        workshopId,
                        pointer: pointerData
                    });
                } else if (!isTeacherPointerActive && activePointerRef.current) {
                     // Send clear signal once
                     socketRef.current.emit('teacher-pointer-move', {
                        workshopId,
                        pointer: { active: false }
                    });
                    activePointerRef.current = null;
                    setTeacherPointer(null);
                }
                
                if (isTeacherPointerActive) activePointerRef.current = {} as any; // Mark as active
            }

            const leftHand = document.querySelector(
                '[oculus-touch-controls="hand: left"]'
            );
            const rightHand = document.querySelector(
                '[oculus-touch-controls="hand: right"]'
            );

            if (leftHand) {
                const obj = (leftHand as any).object3D;
                if (obj) {
                    const pos = obj.position;
                    const rot = obj.rotation; // Euler
                    transforms.leftHand = {
                        pos: { x: pos.x, y: pos.y, z: pos.z },
                        rot: {
                            x: (rot.x * 180) / Math.PI,
                            y: (rot.y * 180) / Math.PI,
                            z: (rot.z * 180) / Math.PI,
                        },
                    };
                }
            }

            if (rightHand) {
                const obj = (rightHand as any).object3D;
                if (obj) {
                    const pos = obj.position;
                    const rot = obj.rotation;
                    transforms.rightHand = {
                        pos: { x: pos.x, y: pos.y, z: pos.z },
                        rot: {
                            x: (rot.x * 180) / Math.PI,
                            y: (rot.y * 180) / Math.PI,
                            z: (rot.z * 180) / Math.PI,
                        },
                    };
                }
            }

            socketRef.current.emit('update-transform', {
                workshopId,
                transforms,
            });
        }, 50);

        return () => clearInterval(interval);
    }, [workshopMode, workshopId]);

    const isVideo = (url?: string) => {
        if (!url) return false;
        return (
            url.includes('youtube') ||
            url.includes('vimeo') ||
            url.match(/\.(mp4|webm|ogg)$/i)
        );
    };

    const handleCloseHotspot = () => {
        setActiveHotspot(null);
    };

    // --- Telemetry / Analytics Tracker ---
    const telemetryBuffer = useRef<any[]>([]);
    const lastFlushTime = useRef<number>(0);

    const flushTelemetry = useCallback(async () => {
        if (telemetryBuffer.current.length === 0) return;

        const batch = [...telemetryBuffer.current];
        telemetryBuffer.current = []; // Clear buffer immediately
        lastFlushTime.current = Date.now();

        try {
            await fetch('/api/analytics/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs: batch }),
            });
        } catch (e) {
            console.error('Telemetry Flush Error', e);
        }
    }, []);

    useEffect(() => {
        if (isEditMode) return;
        
        let lastLookedObject: any = null;
        let lookDuration = 0;

        const interval = setInterval(() => {
            const scene = sceneRef.current;
            const cursor = document.querySelector('a-cursor');
            const modelEl = modelEntityRef.current;

            if (!scene || !cursor || !modelEl) return;

            // @ts-ignore
            const raycaster = (cursor as any).components.raycaster;
            if (!raycaster) return;

            const intersections = raycaster.getIntersection(modelEl.object3D);
            
            if (intersections) {
                const object = intersections.object;
                
                // Track sustained gaze (debounce)
                if (object === lastLookedObject) {
                    lookDuration += 1000;
                } else {
                    lastLookedObject = object;
                    lookDuration = 0;
                }

                // If looked at for > 1s, update context
                if (lookDuration >= 1000) {
                     // Try to get meaningful name
                     const name = object.userData?.name || object.name || 'Unknown Part';
                     // Filter out generic names if possible or mapping
                     if (name !== activePartName && name !== 'Scene') {
                         setActivePartName(name);
                     }
                }

                // Telemetry Logic (Existing)
                const worldPoint = intersections.point;
                const localPoint = modelEl.object3D.worldToLocal(worldPoint.clone());
                 telemetryBuffer.current.push({
                    userId: user?.id,
                    lessonId: (window as any).currentLessonId || 'free-view',
                    modelId: model.id,
                    position: { x: 0, y: 0, z: 0 },
                    target: { x: localPoint.x, y: localPoint.y, z: localPoint.z },
                    duration: 1000,
                });
            } else {
                lastLookedObject = null;
                lookDuration = 0;
                if (activePartName) setActivePartName(null);
            }

             // Flush Telemetry
            if (telemetryBuffer.current.length > 10 || Date.now() - lastFlushTime.current > 10000) {
                flushTelemetry();
            }

        }, 1000);

        return () => {
             clearInterval(interval);
             flushTelemetry();
        };
    }, [model.id, user, isEditMode, flushTelemetry]);

    // Send Context to Gemini
    useEffect(() => {
        if (activePartName && isVoiceActive && sessionRef.current && activePartName !== lastContextSentRef.current) {
            console.log('Sending Context to AI:', activePartName);
            // Send text context frame
            // Using "User" role to simulate user context, or "System" if supported.
            // For live API, mostly we send "Content".
            sessionRef.current.send({
                parts: [{ text: `[System Context Update] User is now looking at: ${activePartName}. If they ask "What is this?", refer to this part.` }]
            });
            lastContextSentRef.current = activePartName;
        }
    }, [activePartName, isVoiceActive]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black text-slate-100">
            {/* UI Overlay */}
            <div className="absolute top-6 left-6 z-10 space-y-4 max-w-sm pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 pointer-events-auto shadow-2xl">
                    {/* Challenge Feedback Overlay */}
                    {challengeFeedback && (
                        <div
                            className={`absolute top-0 left-0 right-0 p-4 rounded-xl mb-4 font-bold text-center animate-bounce shadow-xl border ${challengeFeedback.type === 'success'
                                    ? 'bg-green-600 border-green-400 text-white'
                                    : challengeFeedback.type === 'error'
                                        ? 'bg-rose-600 border-rose-400 text-white'
                                        : 'bg-blue-600 text-white'
                                }`}
                        >
                            {challengeFeedback.msg}
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold truncate pr-4">
                            {model.name}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleToggleVoice}
                                title="AI Voice Assistant"
                                className={`p-2 rounded-lg transition-all relative ${isVoiceActive ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                {isVoiceActive && (
                                    <span className="absolute -inset-1 rounded-lg border-2 border-indigo-500 animate-ping opacity-50"></span>
                                )}
                                <svg
                                    className="w-5 h-5 relative z-10"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsStudioOpen(!isStudioOpen)}
                                title="Studio Settings (glTF Sample Viewer style)"
                                className={`p-2 rounded-lg transition-all ${isStudioOpen ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => window.open(`https://gltf-viewer.donmccurdy.com/?model=${window.location.origin}${activeModelUrl}`, '_blank')}
                                title="Open in External glTF Viewer"
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all text-xs"
                            >
                                ↗️
                            </button>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? "Maximize" : "Minimize"}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                            >
                                {isMinimized ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={() => onExit()}
                                className="p-2 bg-slate-800 hover:bg-rose-600 rounded-lg text-slate-400 hover:text-white transition-all"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="animate-in fade-in duration-300">

                    {/* Assembly Mode Controls */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setIsAssemblyMode(!isAssemblyMode)}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${isAssemblyMode
                                    ? 'bg-amber-600 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                                }`}
                        >
                            {isAssemblyMode
                                ? t('assembly.mode_active')
                                : t('assembly.mode_inactive')}
                        </button>

                        {model.optimized && (
                            <button
                                onClick={() => setUseOptimized(!useOptimized)}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${useOptimized
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                                    }`}
                            >
                                {useOptimized
                                    ? `✨ ${t('assets.optimized')}`
                                    : `📦 ${t('assets.original')}`}
                            </button>
                        )}
                    </div>

                    {/* Teacher Controls */}
                     {user?.role === 'teacher' && workshopMode && (
                        <div className="flex gap-2 mb-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase writing-mode-vertical rotate-180 flex items-center justify-center">
                                {t('workshop.teacher_controls')}
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <button
                                    onClick={() => setIsTeacherSyncActive(!isTeacherSyncActive)}
                                    className={`w-full py-1.5 px-2 rounded text-xs font-bold transition-all border ${isTeacherSyncActive
                                            ? 'bg-red-600 border-red-500 text-white animate-pulse'
                                            : 'bg-slate-800 border-slate-700 text-slate-300'
                                        }`}
                                >
                                    {isTeacherSyncActive ? `👁 ${t('workshop.sync_active')}` : `👁 ${t('workshop.sync_inactive')}`}
                                </button>
                                <button
                                    onClick={() => setIsTeacherPointerActive(!isTeacherPointerActive)}
                                    className={`w-full py-1.5 px-2 rounded text-xs font-bold transition-all border ${isTeacherPointerActive
                                            ? 'bg-red-600 border-red-500 text-white'
                                            : 'bg-slate-800 border-slate-700 text-slate-300'
                                        }`}
                                >
                                    {isTeacherPointerActive ? `🔦 ${t('workshop.pointer_active')}` : `🔦 ${t('workshop.pointer_inactive')}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {isAssemblyMode && (
                        <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                             <button
                                onClick={() => {
                                    if (isExploded) {
                                         assemblySystem?.collapse();
                                         setIsExploded(false);
                                    } else {
                                         // Ensure parts are registered before exploding
                                         assemblySystem?.registerAllParts();
                                         assemblySystem?.explode();
                                         setIsExploded(true);
                                    }
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                                    isExploded 
                                    ? 'bg-rose-600 border-rose-500 text-white' 
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                }`}
                            >
                                {isExploded ? t('assembly.collapse') : t('assembly.explode')}
                            </button>
                            <button
                                onClick={() => assemblySystem?.resetAll()}
                                className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                            >
                                {t('assembly.reset')}
                            </button>
                        </div>
                    )}

                    {/* Challenge Mode Toggle */}
                    <button
                        onClick={() => {
                            setChallengeMode(!challengeMode);
                            setChallengeTime(0);
                            setChallengeStartTime(null);
                            setIsChallengeComplete(false);
                            setActiveTaskId(null);
                        }}
                        className={`w-full py-2 mb-4 rounded-lg backdrop-blur-md transition-all font-bold flex items-center justify-center gap-2 border ${challengeMode
                                ? 'bg-amber-500/80 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                : 'bg-slate-900/80 border-slate-600 text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <span>🏆</span>
                        {t('nav.gamification.challenge_mode')}
                    </button>

                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {model.sector}
                            </span>
                            <span className="text-[10px] text-slate-400 italic">
                                Author: {model.uploadedBy}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-6">
                        {model.description}
                    </p>

                    <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Training Tasks
                        </h4>
                        {isLoadingTasks ? (
                            <div className="text-xs animate-pulse">
                                Generating tasks...
                            </div>
                        ) : (
                            trainingTasks.map((t, i) => (
                                <div
                                    key={`task-${i}`}
                                    className={`p-3 rounded-xl border transition-all ${t.status === 'completed'
                                            ? 'bg-green-900/40 border-green-500/50'
                                            : activeTaskId === t.id
                                                ? 'bg-indigo-900/60 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                                : 'bg-slate-950 border-slate-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p
                                                className={`text-xs font-bold mb-1 ${t.status === 'completed' ? 'text-green-400 line-through' : 'text-white'}`}
                                            >
                                                {t.taskName || 'Instruction'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {t.description ||
                                                    'No description provided.'}
                                            </p>
                                        </div>

                                        {t.status === 'completed' ? (
                                            <span className="text-green-400">
                                                ✓
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    playSound('click');
                                                    setActiveTaskId(
                                                        activeTaskId === t.id
                                                            ? null
                                                            : t.id
                                                    );
                                                    if (!isAssemblyMode)
                                                        setIsAssemblyMode(true); // Auto-enable assembly
                                                }}
                                                className={`text-[10px] px-2 py-1 rounded border ${activeTaskId === t.id
                                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                                        : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                                                    }`}
                                            >
                                                {activeTaskId === t.id
                                                    ? 'STOP'
                                                    : 'START'}
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speak(t.taskName + '. ' + (t.description || ''), i18n.language);
                                            }}
                                            className="ml-2 text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                                            title="Read Aloud"
                                        >
                                            🔊
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hotspot Media Viewer Modal */}
            {activeHotspot && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                cancelSpeech();
                                handleCloseHotspot();
                            }}
                            className="absolute top-4 right-4 z-30 p-2 bg-black/50 hover:bg-rose-600 text-white rounded-full transition-all backdrop-blur-md"
                            title="Close and return to XR"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Media Content Section */}
                        {activeHotspot.mediaUrl && (
                            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
                                {isVideo(activeHotspot.mediaUrl) ? (
                                    <div className="w-full h-full aspect-video">
                                        {activeHotspot.mediaUrl.includes(
                                            'youtube'
                                        ) ||
                                            activeHotspot.mediaUrl.includes(
                                                'vimeo'
                                            ) ? (
                                            <iframe
                                                src={activeHotspot.mediaUrl}
                                                className="w-full h-full"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <video
                                                src={activeHotspot.mediaUrl}
                                                controls
                                                autoPlay
                                                className="w-full h-full object-contain"
                                            ></video>
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={activeHotspot.mediaUrl}
                                        alt={activeHotspot.title}
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                        )}

                        {/* Info Section */}
                        <div
                            className={`p-8 ${activeHotspot.mediaUrl ? 'md:w-80 w-full' : 'w-full'} flex flex-col justify-center bg-slate-900`}
                        >
                            <div className="mb-6">
                                <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 border border-indigo-500/20">
                                    {activeHotspot.type} marker
                                </span>
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    {activeHotspot.title}
                                    <button
                                        onClick={() => speak(activeHotspot.title + '. ' + activeHotspot.description, i18n.language)}
                                        className="p-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500 text-white transition-colors text-sm"
                                        title="Read Aloud"
                                    >
                                        🔊
                                    </button>
                                </h3>
                                <div className="h-1 w-12 bg-indigo-500 rounded-full mb-6"></div>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {activeHotspot.description}
                                </p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    In-App Educational Guide
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Studio Mode Sidebar (Khronos Style) */}
            {isStudioOpen && (
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-40 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </span> {t('studio.title')}
                        </h2>
                        <button onClick={() => setIsStudioOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* Environment Section */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('studio.lighting_env')}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {['none', 'contact', 'egypt', 'forest', 'goaland', 'yosemite', 'tron'].map((env) => (
                                    <button
                                        key={env}
                                        onClick={() => setStudioConfig({...studioConfig, environment: env})}
                                        className={`px-3 py-2 text-xs rounded-lg border transition-all ${studioConfig.environment === env ? 'bg-indigo-600 border-indigo-500 text-white font-bold' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                    >
                                        {env.charAt(0).toUpperCase() + env.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Rendering Controls */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('studio.rendering')}</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-slate-300">{t('studio.exposure')}</label>
                                    <span className="text-[10px] font-mono text-indigo-400">{studioConfig.exposure.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="5.0" step="0.1"
                                    value={studioConfig.exposure}
                                    onChange={(e) => setStudioConfig({...studioConfig, exposure: parseFloat(e.target.value)})}
                                    className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                                />

                                <div className="flex flex-col gap-1.5 pt-2">
                                    <label className="text-xs text-slate-300">{t('studio.tone_mapping')}</label>
                                    <select
                                        value={studioConfig.toneMapping}
                                        onChange={(e) => setStudioConfig({...studioConfig, toneMapping: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] rounded-lg p-2 outline-none focus:border-indigo-500"
                                    >
                                        <option value="NoToneMapping">None</option>
                                        <option value="LinearToneMapping">Linear</option>
                                        <option value="ReinhardToneMapping">Reinhard</option>
                                        <option value="CineonToneMapping">Cineon</option>
                                        <option value="ACESFilmicToneMapping">ACES Filmic</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <label className="text-xs text-slate-300">{t('studio.wireframe')}</label>
                                    <button
                                        onClick={() => setStudioConfig({...studioConfig, wireframe: !studioConfig.wireframe})}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${studioConfig.wireframe ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${studioConfig.wireframe ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-300">{t('studio.auto_rotate')}</label>
                                    <button
                                        onClick={() => setStudioConfig({...studioConfig, autoRotate: !studioConfig.autoRotate})}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${studioConfig.autoRotate ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${studioConfig.autoRotate ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Model Statistics */}
                        <section className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 space-y-3">
                            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t('studio.stats')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">{t('studio.vertices')}</span>
                                    <span className="text-sm font-mono text-slate-200">{(modelStats.vertices / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">{t('studio.triangles')}</span>
                                    <span className="text-sm font-mono text-slate-200">{(modelStats.triangles / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">{t('studio.meshes')}</span>
                                    <span className="text-sm font-mono text-slate-200">{modelStats.meshes}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">{t('studio.materials')}</span>
                                    <span className="text-sm font-mono text-slate-200">{modelStats.materials}</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="p-6 border-t border-slate-800 text-[10px] text-slate-500 italic">
                        Khronos glTF compatibility validated.
                    </div>
                </div>
            )}

            {/* A-Frame Scene */}
            <a-scene
                ref={bgSceneRef}
                embedded
                renderer-settings={`exposure: ${studioConfig.exposure}; toneMapping: ${studioConfig.toneMapping};`}
                xr-mode-ui="enabled: true"
                className="w-full h-full"
            >
                <a-assets>
                    {/* We don't use a-asset-item for dynamic URLs as easily, let's just pass src to model */}
                </a-assets>

                {/* User Presence (Self - though locally invisible) */}
                {!workshopMode && (
                    <a-entity id="rig">
                        <a-camera
                            position="0 1.6 0"
                            look-controls
                            mouse-wheel-zoom="min: 0.5; max: 20"
                        >
                            <a-cursor
                                color="indigo"
                                fuse="false"
                                raycaster="objects: .interactable"
                            ></a-cursor>
                        </a-camera>
                    </a-entity>
                )}

                {/* Mentor / Assistant Avatar (Virtual position) */}
                {isVoiceActive && (
                    <a-entity
                        position={`${mentorPosRef.current.x} ${mentorPosRef.current.y} ${mentorPosRef.current.z}`}
                        rotation="0 -30 0"
                    >
                        <a-sphere
                            radius="0.4"
                            color="#6366f1"
                            opacity="0.6"
                            transparent="true"
                        >
                            <a-text
                                value="Mentor Assistant"
                                align="center"
                                position="0 0.6 0"
                                scale="0.5"
                            ></a-text>
                        </a-sphere>
                        {isAssistantSpeaking && (
                            <a-sphere
                                radius="0.1"
                                position="0 0 0.5"
                                color="white"
                            >
                                <a-animation
                                    attribute="scale"
                                    from="1 1 1"
                                    to="1.5 1.5 1.5"
                                    dur="300"
                                    repeat="indefinite"
                                    direction="alternate"
                                ></a-animation>
                            </a-sphere>
                        )}
                    </a-entity>
                )}

                {/* Workshop Participants */}
                {remoteParticipants.map((participant) => (
                    <Avatar
                        key={participant.socketId}
                        username={participant.username}
                        role={participant.role}
                        transforms={participant.transforms}
                    />
                ))}

                {/* Model and Environment */}
                {studioConfig.environment !== 'none' ? (
                    <a-entity environment={`preset: ${studioConfig.environment}; lighting: true; shadow: true; fog: 0; intensity: 0.8`}></a-entity>
                ) : (
                    <a-sky color="#050505"></a-sky>
                )}
                
                <a-grid-helper
                    size="20"
                    divisions="20"
                    color="#1e293b"
                    opacity="0.2"
                ></a-grid-helper>

                <a-entity
                    position="0 0 -3"
                    drag-rotate
                    animation={studioConfig.autoRotate ? "property: rotation; to: 0 360 0; loop: true; dur: 20000; easing: linear" : ""}
                    className="interactable-model"
                    assembly-mode-system={`enabled: ${isAssemblyMode}`}
                >
                    <a-entity
                        ref={modelEntityRef}
                        class="interactable"
                        stl-model={
                            activeModelUrl.toLowerCase().endsWith('.stl')
                                ? `src: ${activeModelUrl}`
                                : undefined
                        }
                        gltf-model={
                            !activeModelUrl.toLowerCase().endsWith('.stl')
                                ? activeModelUrl
                                : undefined
                        }
                        scale="1 1 1"
                        rotation="0 0 0"
                        interactive-part
                        wireframe-toggle={`enabled: ${studioConfig.wireframe}`}
                    ></a-entity>

                    {/* Hotspots rendered in 3D space */}
                    {model.hotspots.map((hs) => (
                        <a-entity
                            key={hs.id}
                            position={`${hs.position.x} ${hs.position.y} ${hs.position.z}`}
                            hotspot-trigger
                            data-id={hs.id}
                            class="interactable"
                        >
                            <a-sphere
                                radius="0.05"
                                color={
                                    hs.type === 'video' ? '#f43f5e' : '#6366f1'
                                }
                                opacity="0.8"
                            >
                                <a-text
                                    value={hs.title}
                                    align="center"
                                    position="0 0.15 0"
                                    scale="0.3"
                                    color="white"
                                ></a-text>
                            </a-sphere>
                        </a-entity>
                    ))}
                </a-entity>

                <a-entity light="type: ambient; intensity: 0.5; color: #ffffff"></a-entity>
                <a-entity light="type: directional; intensity: 0.8; castShadow: true; position: -1 4 2"></a-entity>
                
                 {/* Teacher Visual Pointer */}
                {teacherPointer && (
                    <a-entity>
                         <a-entity
                            line={`start: ${teacherPointer.origin.x} ${teacherPointer.origin.y} ${teacherPointer.origin.z}; end: ${teacherPointer.target.x} ${teacherPointer.target.y} ${teacherPointer.target.z}; color: red; opacity: 0.8`}
                        ></a-entity>
                        <a-sphere position={`${teacherPointer.target.x} ${teacherPointer.target.y} ${teacherPointer.target.z}`} radius="0.05" color="red" opacity="0.8"></a-sphere>
                    </a-entity>
                )}
            </a-scene>
            {/* Challenge Timer Overlay */}
            {challengeMode && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/60 px-8 py-3 rounded-full border border-amber-500/50 backdrop-blur-md z-10 flex flex-col items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-amber-400 text-2xl animate-pulse">⏱️</span>
                        <span className="font-mono text-3xl font-bold text-white tracking-wider">
                            {new Date(challengeTime).toISOString().slice(14, 19)}
                            <span className="text-sm text-slate-400">.{Math.floor((challengeTime % 1000) / 100)}</span>
                        </span>
                    </div>
                    {isChallengeComplete && (
                        <div className="text-green-400 text-xs font-bold uppercase tracking-widest mt-1 animate-bounce">
                            {t('gamification.complete')}
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
                    <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6">
                        <button
                            onClick={() => setShowLeaderboard(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                        >
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-2">
                            🏆 {t('gamification.leaderboard')}
                        </h2>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            <div className="grid grid-cols-4 text-xs font-bold text-slate-500 border-b border-slate-800 pb-2 mb-2">
                                <span>{t('gamification.rank')}</span>
                                <span className="col-span-2">{t('gamification.user')}</span>
                                <span className="text-right">{t('gamification.score')}</span>
                            </div>
                            {leaderboardData.length > 0 ? (
                                leaderboardData.map((entry, i) => (
                                    <div key={i} className={`grid grid-cols-4 py-2 border-b border-slate-800/50 items-center ${i < 3 ? 'text-white' : 'text-slate-400'}`}>
                                        <span className="flex items-center gap-2">
                                            {i === 0 && '🥇'}
                                            {i === 1 && '🥈'}
                                            {i === 2 && '🥉'}
                                            <span className="font-mono text-xs opacity-50">#{i + 1}</span>
                                        </span>
                                        <span className="col-span-2 font-medium truncate">{entry.username}</span>
                                        <span className="text-right font-mono text-amber-400">{entry.time_seconds.toFixed(2)}s</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500 italic">
                                    No scores yet. Be the first!
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setShowLeaderboard(false);
                                setChallengeMode(false);
                                setIsChallengeComplete(false);
                            }}
                            className="mt-6 w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VRViewer;

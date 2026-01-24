
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VETModel, Hotspot } from '../types';
import { analyzeModelDescription } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
// @ts-ignore
import { STLLoader } from '../src/lib/three-examples/loaders/STLLoader.js';
import { io, Socket } from 'socket.io-client';
import './AssemblyManager'; // Register Assembly Mode components

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
        this.el.addEventListener('click', (evt: any) => {
          this.el.emit('hotspot-activated', { id: this.el.getAttribute('data-id') }, true);
        });
      }
    });
  }

  if (!AFRAME.components['mouse-wheel-zoom']) {
    AFRAME.registerComponent('mouse-wheel-zoom', {
      schema: {
        min: { default: 0.5 },
        max: { default: 15 },
        step: { default: 0.2 }
      },
      init: function () {
        this.onWheel = (e: WheelEvent) => {
          if (this.el.sceneEl.is('vr-mode')) return;
          const pos = this.el.getAttribute('position');
          let newZ = pos.z + (e.deltaY > 0 ? this.data.step : -this.data.step);
          newZ = Math.min(Math.max(newZ, this.data.min), this.data.max);
          this.el.setAttribute('position', { x: pos.x, y: pos.y, z: newZ });
        };
        window.addEventListener('wheel', this.onWheel, { passive: true });
      },
      remove: function () {
        window.removeEventListener('wheel', this.onWheel);
      }
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
        this.onMouseUp = () => { this.ifMouseDown = false; };
        this.onMouseMove = (e: any) => {
          if (this.ifMouseDown) {
            const x = e.clientX || e.touches?.[0].clientX;
            const rot = this.el.getAttribute('rotation');
            this.el.setAttribute('rotation', { x: rot.x, y: rot.y + ((x - this.x_cord) * this.data.speed * 0.5), z: rot.z });
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
      }
    });
  }

  if (!AFRAME.components['stl-model']) {
    AFRAME.registerComponent('stl-model', {
      schema: { src: { type: 'string' } },
      init: function () {
        const loader = new STLLoader();
        const el = this.el;
        loader.load(this.data.src, (geometry) => {
          const material = new (window as any).THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.5 });
          const mesh = new (window as any).THREE.Mesh(geometry, material);
          el.setObject3D('mesh', mesh);
        });
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
  numChannels: number,
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

import { fixAssetUrl } from '../utils/urlUtils';

const VRViewer: React.FC<VRViewerProps> = ({ model, onExit, workshopMode, workshopId, user, onObjectClick }) => {
  // Fix model URL for proxy
  const fixedModel = { ...model, modelUrl: fixAssetUrl(model.modelUrl) };
  // From here on use fixedModel instead of model for URL

  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [trainingTasks, setTrainingTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<any[]>([]);

  // Assembly Mode State
  const [isAssemblyMode, setIsAssemblyMode] = useState(false);
  const [assemblySystem, setAssemblySystem] = useState<any>(null);

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
  const modelEntityRef = useRef<any>(null);

  useEffect(() => {
    const el = modelEntityRef.current;
    if (!el || !onObjectClick) return;

    const clickHandler = (evt: any) => {
      const intersection = evt.detail.intersection;
      if (intersection && intersection.object) {
        let name = intersection.object.name;
        if (!name || name.includes('Scene')) {
          // Try parent
          name = intersection.object.parent?.name || name;
        }
        onObjectClick(name);
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
        setAssemblySystem(system);

        model.traverse((node: any) => {
          if (node.isMesh) {
            system.registerPart(node);
          }
        });
        console.log("Assembly Mode: Parts Registered");
      }
    };

    el.addEventListener('model-loaded', loadHandler);
    // Also try to register if already loaded?
    // A-Frame might have loaded it already if we are hot-reloading

    return () => {
      el.removeEventListener('click', clickHandler);
      el.removeEventListener('model-loaded', loadHandler);
    };
  }, [onObjectClick, model.id]);

  // Ref for the scene to access systems
  const bgSceneRef = useRef<any>(null);

  const playSound = useCallback((type: 'click' | 'ping' | 'dismiss' | 'success') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        osc.start(now); osc.stop(now + 0.05);
      } else if (type === 'ping') {
        osc.frequency.setValueAtTime(523, now);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(now); osc.stop(now + 0.2);
      }
    } catch (e) {
      console.error("Audio playback error");
    }
  }, []);

  const updateAudioListener = useCallback(() => {
    if (!outputAudioContextRef.current || !sceneRef.current) return;
    const camera = sceneRef.current.camera;
    if (!camera) return;

    const listener = outputAudioContextRef.current.listener;
    const position = camera.getWorldPosition(new (window as any).THREE.Vector3());
    const quaternion = camera.getWorldQuaternion(new (window as any).THREE.Quaternion());

    const forward = new (window as any).THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const up = new (window as any).THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

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
      (listener as any).setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
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
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    setIsVoiceActive(false);
    setIsAssistantSpeaking(false);
  }, []);

  const startVoiceSession = useCallback(async () => {
    try {
      setIsVoiceActive(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outCtx = outputAudioContextRef.current;
      const panner = outCtx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.positionX.setValueAtTime(mentorPosRef.current.x, outCtx.currentTime);
      panner.positionY.setValueAtTime(mentorPosRef.current.y, outCtx.currentTime);
      panner.positionZ.setValueAtTime(mentorPosRef.current.z, outCtx.currentTime);
      panner.connect(outCtx.destination);
      pannerRef.current = panner;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsAssistantSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(pannerRef.current!);
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsAssistantSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onclose: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are a Technical VET Mentor at THE GEAR platform. Context: ${model.description}.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { stopVoiceSession(); }
  }, [model.description, stopVoiceSession]);

  const handleToggleVoice = () => {
    playSound('click');
    if (isVoiceActive) stopVoiceSession();
    else startVoiceSession();
  };

  const handleHotspotEvent = useCallback((evt: any) => {
    const id = evt.detail?.id;
    if (!id) return;
    const hs = model.hotspots.find(h => h.id === id);
    if (hs) {
      playSound('ping');
      setActiveHotspot(hs);
    }
  }, [model.hotspots, playSound]);

  useEffect(() => {
    const getTasks = async () => {
      setIsLoadingTasks(true);
      const tasks = await analyzeModelDescription(model.name, model.description);
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
        scene.removeEventListener('hotspot-activated', handleHotspotEvent);
      }
      stopVoiceSession();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [model.name, model.description, handleHotspotEvent, stopVoiceSession]);

  // Workshop Socket Setup
  useEffect(() => {
    if (workshopMode && workshopId && user) {
      const socket = io(window.location.origin.replace('5173', '3001')); // Handle Vite proxy
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-workshop', { workshopId, user });
      });

      socket.on('current-participants', (participants) => {
        setRemoteParticipants(participants.filter((p: any) => p.socketId !== socket.id));
      });

      socket.on('user-joined', ({ socketId, user }) => {
        setRemoteParticipants(prev => [...prev, { socketId, ...user, pos: { x: 0, y: 1.6, z: 0 } }]);
      });

      socket.on('participant-moved', ({ socketId, pos, rot }) => {
        setRemoteParticipants(prev => prev.map(p =>
          p.socketId === socketId ? { ...p, pos, rot } : p
        ));
      });

      socket.on('user-left', (socketId) => {
        setRemoteParticipants(prev => prev.filter(p => p.socketId !== socketId));
      });

      socket.on('workshop-event', ({ type, data }) => {
        if (type === 'hotspot-activated') {
          const hs = model.hotspots.find(h => h.id === data.id);
          if (hs) setActiveHotspot(hs);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [workshopMode, workshopId, user, model.hotspots]);

  // Update position to server
  useEffect(() => {
    if (!workshopMode || !workshopId || !socketRef.current) return;

    const interval = setInterval(() => {
      const camera = sceneRef.current?.camera;
      if (camera) {
        const pos = camera.getWorldPosition(new (window as any).THREE.Vector3());
        const rot = camera.getWorldQuaternion(new (window as any).THREE.Quaternion());
        socketRef.current?.emit('update-transform', {
          workshopId,
          pos: { x: pos.x, y: pos.y, z: pos.z },
          rot: { x: rot.x, y: rot.y, z: rot.z }
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [workshopMode, workshopId]);

  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.includes('youtube') || url.includes('vimeo') || url.match(/\.(mp4|webm|ogg)$/i);
  };

  const handleCloseHotspot = () => {
    setActiveHotspot(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-slate-100">
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-10 space-y-4 max-w-sm pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold truncate pr-4">{model.name}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleToggleVoice}
                className={`p-2 rounded-lg transition-all relative ${isVoiceActive ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                {isVoiceActive && <span className="absolute -inset-1 rounded-lg border-2 border-indigo-500 animate-ping opacity-50"></span>}
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button onClick={() => onExit()} className="p-2 bg-slate-800 hover:bg-rose-600 rounded-lg text-slate-400 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Assembly Mode Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setIsAssemblyMode(!isAssemblyMode)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${isAssemblyMode
                ? 'bg-amber-600 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
            >
              {isAssemblyMode ? '🔧 Assembly Mode ON' : '🔧 Enable Assembly'}
            </button>
          </div>

          {isAssemblyMode && (
            <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => assemblySystem?.resetAll()}
                className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
              >
                ↺ Reset All Parts
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{model.sector}</span>
              <span className="text-[10px] text-slate-400 italic">Author: {model.uploadedBy}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6">{model.description}</p>

          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Training Tasks</h4>
            {isLoadingTasks ? (
              <div className="text-xs animate-pulse">Generating tasks...</div>
            ) : (
              trainingTasks.map((t, i) => (
                <div key={`task-${i}`} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-xs font-bold text-white mb-1">{t.taskName || 'Instruction'}</p>
                  <p className="text-[10px] text-slate-500">{t.description || 'No description provided.'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hotspot Media Viewer Modal */}
      {activeHotspot && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={handleCloseHotspot}
              className="absolute top-4 right-4 z-30 p-2 bg-black/50 hover:bg-rose-600 text-white rounded-full transition-all backdrop-blur-md"
              title="Close and return to XR"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Media Content Section */}
            {activeHotspot.mediaUrl && (
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
                {isVideo(activeHotspot.mediaUrl) ? (
                  <div className="w-full h-full aspect-video">
                    {activeHotspot.mediaUrl.includes('youtube') || activeHotspot.mediaUrl.includes('vimeo') ? (
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
            <div className={`p-8 ${activeHotspot.mediaUrl ? 'md:w-80 w-full' : 'w-full'} flex flex-col justify-center bg-slate-900`}>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 border border-indigo-500/20">
                  {activeHotspot.type} marker
                </span>
                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{activeHotspot.title}</h3>
                <div className="h-1 w-12 bg-indigo-600 mb-6"></div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">{activeHotspot.description}</p>
              </div>

              <button
                onClick={handleCloseHotspot}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Return to Workshop</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A-Frame Scene */}
      <a-scene
        ref={(ref: any) => { sceneRef.current = ref; bgSceneRef.current = ref; }}
        embedded
        class="absolute inset-0 z-0"
        renderer="colorManagement: true; antialias: true;"
        cursor="rayOrigin: mouse"
        raycaster="objects: .collidable, .interactable-model"
        assembly-mode-system={`enabled: ${isAssemblyMode}`}
      >
        <a-assets><a-asset-item id="model-asset" src={fixedModel.modelUrl}></a-asset-item></a-assets>
        <a-sky color="#050a14"></a-sky>
        <a-grid-helper size="20" divisions="20" color="#1e293b"></a-grid-helper>

        {isVoiceActive && (
          <a-entity position={`${mentorPosRef.current.x} ${mentorPosRef.current.y} ${mentorPosRef.current.z}`}>
            <a-sphere
              radius="0.15"
              color="#6366f1"
              material={`emissive: #6366f1; emissiveIntensity: ${isAssistantSpeaking ? 5 : 1}; transparent: true; opacity: 0.8`}
              animation={isAssistantSpeaking ? "property: scale; to: 1.2 1.2 1.2; dir: alternate; loop: true; dur: 200" : ""}
            ></a-sphere>
            <a-text value="AI MENTOR" align="center" position="0 0.3 0" scale="0.4 0.4 0.4" color="#818cf8"></a-text>
            <a-entity light="type: point; intensity: 0.5; color: #6366f1; distance: 2"></a-entity>
          </a-entity>
        )}

        {workshopMode && remoteParticipants.map(p => (
          <a-entity key={p.socketId} position={`${p.pos.x} ${p.pos.y} ${p.pos.z}`}>
            <a-sphere radius="0.1" color={p.role === 'teacher' ? '#f43f5e' : '#10b981'} material="opacity: 0.9"></a-sphere>
            <a-text value={p.username} align="center" position="0 0.2 0" scale="0.3 0.3 0.3"></a-text>
          </a-entity>
        ))}

        <a-entity
          drag-rotate="speed: 1"
          ref={modelEntityRef}
          class={onObjectClick ? "interactable-model" : ""}
        >
          {fixedModel.modelUrl.toLowerCase().includes('stl') ? (
            <a-entity stl-model={`src: ${fixedModel.modelUrl.replace('#stl', '')}`} position="0 0.5 0" interactive-part=""></a-entity>
          ) : (
            <a-gltf-model src="#model-asset" position="0 0.5 0" interactive-part=""></a-gltf-model>
          )}
          {model.hotspots.map(hs => (
            <a-entity
              key={`hotspot-ent-${hs.id}`}
              data-id={hs.id}
              class="collidable"
              geometry="primitive: sphere; radius: 0.08"
              material="color: #6366f1; emissive: #6366f1; emissiveIntensity: 2"
              position={`${hs.position.x} ${hs.position.y} ${hs.position.z}`}
              hotspot-trigger=""
            >
              <a-text value={hs.title} align="center" position="0 0.15 0" scale="0.3 0.3 0.3"></a-text>
            </a-entity>
          ))}
        </a-entity>

        <a-entity light="type: ambient; intensity: 0.6"></a-entity>
        <a-entity light="type: directional; intensity: 0.8" position="-1 1 2"></a-entity>

        <a-entity id="rig" position="0 1.6 3" mouse-wheel-zoom="min: 0.5; max: 12; step: 0.3">
          <a-camera look-controls wasd-controls></a-camera>
        </a-entity>
      </a-scene>
    </div>
  );
};

export default VRViewer;

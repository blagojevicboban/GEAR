import React, { useEffect, useState, useRef } from 'react';
import { VETModel } from '../types';
import { fixAssetUrl } from '../utils/urlUtils';
// @ts-ignore
import { STLLoader } from '../lib/three-examples/loaders/STLLoader.js';

interface HeatmapViewerProps {
    model: VETModel;
}

const HeatmapViewer: React.FC<HeatmapViewerProps> = ({ model }) => {
    const [points, setPoints] = useState<{ x: number, y: number, z: number, weight: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const sceneRef = useRef<any>(null);

    // Fetch Analytics Data
    useEffect(() => {
        fetch(`/api/analytics/heatmap/${model.id}`)
            .then(res => res.json())
            .then(data => {
                setPoints(data);
                setLoading(false);
            })
            .catch(e => console.error("Failed to load heatmap", e));
    }, [model.id]);

    // Setup Points Visualization
    useEffect(() => {
        if (loading || !sceneRef.current) return;

        const sceneEl = sceneRef.current;
        const heatGroup = document.createElement('a-entity');

        // Simple visualization: Small red spheres for now. 
        // Optimization: For 2000+ points, we should use a ParticleSystem (BufferGeometry), 
        // but for a prototype <a-sphere> might crash browser if too many.
        // Let's use Three.js direct object creation for performance.

        if (sceneEl.object3D) {
            const geometry = new (window as any).THREE.BufferGeometry();
            const positions = [];
            const colors = [];
            const color = new (window as any).THREE.Color();

            for (const p of points) {
                positions.push(p.x, p.y, p.z);
                // Heatmap logic: Red = high duration? For now just Red.
                color.setRGB(1, 0, 0); // Red
                colors.push(color.r, color.g, color.b);
            }

            geometry.setAttribute('position', new (window as any).THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new (window as any).THREE.Float32BufferAttribute(colors, 3));

            const material = new (window as any).THREE.PointsMaterial({
                size: 0.05,
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
            });

            const pointCloud = new (window as any).THREE.Points(geometry, material);
            const wrapper = new (window as any).THREE.Group();
            wrapper.add(pointCloud);

            // Attach to the MODEL entity so it rotates WITH the model
            // But we need to wait for the model entity?
            // Actually, we can just append this as a child of the interactable-model entity.

            const modelEntity = document.getElementById('heatmap-model-root');
            if (modelEntity) {
                modelEntity.object3D.add(wrapper);
            }
        }

    }, [points, loading]);

    const activeModelUrl = (model.optimized && model.optimizedUrl) ? fixAssetUrl(model.optimizedUrl) : fixAssetUrl(model.modelUrl);

    return (
        <div className="w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
            {loading && <div className="absolute inset-0 flex items-center justify-center text-slate-400 z-10 bg-black/50">Loading Heatmap...</div>}

            <a-scene embedded renderer="antialias: true; alpha: true">
                <a-sky color="#0f172a"></a-sky>
                <a-entity light="type: ambient; intensity: 0.7;"></a-entity>
                <a-entity light="type: directional; intensity: 0.8; position: 2 4 3"></a-entity>

                <a-camera position="0 0 3" look-controls="enabled: false"></a-camera>

                {/* Model Root: Rotatable */}
                <a-entity
                    id="heatmap-model-root"
                    position="0 0 0"
                    drag-rotate="speed: 2"
                >
                    <a-entity
                        stl-model={activeModelUrl.toLowerCase().endsWith('.stl') ? `src: ${activeModelUrl}` : undefined}
                        gltf-model={!activeModelUrl.toLowerCase().endsWith('.stl') ? activeModelUrl : undefined}
                        scale="1 1 1"
                    ></a-entity>
                </a-entity>
            </a-scene>

            <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-black/80 p-2 rounded">
                Drag to rotate • {points.length} interaction points
            </div>
        </div>
    );
};

export default HeatmapViewer;

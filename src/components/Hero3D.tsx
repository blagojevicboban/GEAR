import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';


interface Hero3DProps {
    targetPosition?: { x: number; y: number } | null;
}

function RotatingQuestModel({ targetPosition }: Hero3DProps) {
    const { scene } = useGLTF('/models/meta_quest_3.glb');
    const ref = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            // Get viewport dimensions to map mouse coordinates to 3D space
            const { width, height } = state.viewport;

            let targetX = 0;
            let targetY = 0;

            if (targetPosition) {
                // Map normalized coordinates (-1 to 1) to viewport dimensions
                targetX = (targetPosition.x * width) / 2;
                targetY = (targetPosition.y * height) / 2;
            }

            // Smoothly interpolate current position to target
            const smoothFactor = 4.0;

            ref.current.position.x = THREE.MathUtils.lerp(
                ref.current.position.x,
                targetX,
                delta * smoothFactor
            );
            ref.current.position.y = THREE.MathUtils.lerp(
                ref.current.position.y,
                targetY,
                delta * smoothFactor
            );

            // Continuous gentle rotation
            ref.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <Center>
            <primitive object={scene} ref={ref} />
        </Center>
    );
}

export default function Hero3D({ targetPosition }: Hero3DProps) {
    return (
        <div className="w-full h-full absolute inset-0 pointer-events-none">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 5], fov: 45 }}
                style={{ pointerEvents: 'none' }}
                eventSource={typeof document !== 'undefined' ? document.body : undefined}
            >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <RotatingQuestModel targetPosition={targetPosition} />
                </Float>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}

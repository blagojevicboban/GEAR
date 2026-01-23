import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';

function RotatingQuestModel() {
    const { scene } = useGLTF('/models/meta_quest_3.glb');
    const ref = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <Center>
            <primitive object={scene} ref={ref} />
        </Center>
    );
}

export default function Hero3D() {
    return (
        <div className="w-full h-full absolute inset-0 pointer-events-none">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 5], fov: 45 }}
                style={{ pointerEvents: 'none' }}
            >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <RotatingQuestModel />
                </Float>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}

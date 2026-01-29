import React from 'react';

interface AvatarProps {
    username: string;
    role: string;
    transforms?: {
        head: {
            pos: { x: number; y: number; z: number };
            rot: { x: number; y: number; z: number };
        };
        leftHand: {
            pos: { x: number; y: number; z: number };
            rot: { x: number; y: number; z: number };
        } | null;
        rightHand: {
            pos: { x: number; y: number; z: number };
            rot: { x: number; y: number; z: number };
        } | null;
    };
}

const Avatar: React.FC<AvatarProps> = ({ username, role, transforms }) => {
    if (!transforms) return null;

    const { head, leftHand, rightHand } = transforms;
    const color = role === 'teacher' ? '#f43f5e' : '#10b981';

    return (
        <a-entity>
            {/* Head */}
            <a-entity
                position={`${head.pos.x} ${head.pos.y} ${head.pos.z}`}
                rotation={`${head.rot.x} ${head.rot.y} ${head.rot.z}`}
            >
                <a-sphere
                    radius="0.12"
                    color={color}
                    material="opacity: 0.9; roughness: 0.8"
                ></a-sphere>
                {/* Eyes/Direction Indicator */}
                <a-entity
                    position="0 0.05 -0.1"
                    geometry="primitive: box; width: 0.15; height: 0.03; depth: 0.05"
                    material="color: #333"
                ></a-entity>

                {/* Name Tag */}
                <a-text
                    value={username}
                    align="center"
                    position="0 0.35 0"
                    scale="0.4 0.4 0.4"
                    side="double"
                ></a-text>
            </a-entity>

            {/* Left Hand */}
            {leftHand && (
                <a-entity
                    position={`${leftHand.pos.x} ${leftHand.pos.y} ${leftHand.pos.z}`}
                    rotation={`${leftHand.rot.x} ${leftHand.rot.y} ${leftHand.rot.z}`}
                >
                    <a-sphere
                        radius="0.06"
                        color={color}
                        material="opacity: 0.8"
                    ></a-sphere>
                </a-entity>
            )}

            {/* Right Hand */}
            {rightHand && (
                <a-entity
                    position={`${rightHand.pos.x} ${rightHand.pos.y} ${rightHand.pos.z}`}
                    rotation={`${rightHand.rot.x} ${rightHand.rot.y} ${rightHand.rot.z}`}
                >
                    <a-sphere
                        radius="0.06"
                        color={color}
                        material="opacity: 0.8"
                    ></a-sphere>
                </a-entity>
            )}
        </a-entity>
    );
};

export default Avatar;

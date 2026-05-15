import React from 'react';
import { RoundedBox } from '@react-three/drei';

const Wheel = ({ position }) => (
    <group position={position}>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.35, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.36, 16]} />
            <meshStandardMaterial color="#888" metalness={0.6} />
        </mesh>
    </group>
);

const Bus = ({ position, rotation, color = "#0ea5e9" }) => { // Default Sky Blue
    return (
        <group position={position} rotation={rotation}>
            {/* Main Body */}
            <group position={[0, 1.5, 0]}>
                <RoundedBox args={[2.8, 2.8, 11]} radius={0.2} smoothness={4} castShadow>
                    <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
                </RoundedBox>
            </group>

            {/* Windows (Side) */}
            <group position={[0, 2.0, 0]}>
                <mesh position={[1.41, 0, 0]}>
                    <boxGeometry args={[0.05, 1.2, 9]} />
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[-1.41, 0, 0]}>
                    <boxGeometry args={[0.05, 1.2, 9]} />
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                </mesh>
            </group>

            {/* Windshield (Front) */}
            <mesh position={[0, 2.0, 5.51]} rotation={[0, 0, 0]}>
                <planeGeometry args={[2.5, 1.5]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Digital Display Board */}
            <mesh position={[0, 2.6, 5.52]}>
                <planeGeometry args={[2.0, 0.3]} />
                <meshStandardMaterial color="#000" emissive="#f59e0b" emissiveIntensity={0.5} />
            </mesh>

            {/* Wheels (6 Wheels) */}
            <Wheel position={[1.2, 0.45, 3.5]} />
            <Wheel position={[-1.2, 0.45, 3.5]} />

            <Wheel position={[1.2, 0.45, -3.5]} />
            <Wheel position={[-1.2, 0.45, -3.5]} />
            {/* Rear Dual Axle */}
            <Wheel position={[1.2, 0.45, -2.0]} />
            <Wheel position={[-1.2, 0.45, -2.0]} />

            {/* Roof AC */}
            <mesh position={[0, 3.0, -1]}>
                <boxGeometry args={[2, 0.4, 3]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>

            {/* Headlights */}
            <mesh position={[1.0, 1.0, 5.5]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
            </mesh>
            <mesh position={[-1.0, 1.0, 5.5]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
            </mesh>
        </group>
    );
};

export default Bus;

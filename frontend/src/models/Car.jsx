import React from 'react';
import { RoundedBox } from '@react-three/drei';

const Wheel = ({ position }) => (
    <group position={position}>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
            {/* Tire */}
            <cylinderGeometry args={[0.35, 0.35, 0.3, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, 0]}>
            {/* Rim */}
            <cylinderGeometry args={[0.2, 0.2, 0.32, 16]} />
            <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
        </mesh>
    </group>
);

const Car = ({ position, rotation, color = "#d1d5db" }) => {
    // High Fidelity PBR Materials
    const paintMaterial = <meshStandardMaterial
        color={color}
        metalness={0.6}
        roughness={0.2}
        envMapIntensity={1}
    />;

    const glassMaterial = <meshStandardMaterial
        color="#aaccff"
        metalness={0.9}
        roughness={0.0}
        transparent
        opacity={0.6}
    />;

    return (
        <group position={position} rotation={rotation}>
            {/* Main Chasis - Rounded Box for smooth look */}
            <group position={[0, 0.5, 0]}>
                <RoundedBox args={[1.8, 0.7, 4.2]} radius={0.15} smoothness={4} castShadow receiveShadow>
                    {paintMaterial}
                </RoundedBox>
            </group>

            {/* Bumpers (Front/Back) - Plastic/Darker */}
            <group position={[0, 0.45, 2.15]}>
                <RoundedBox args={[1.75, 0.4, 0.1]} radius={0.05} smoothness={2}>
                    <meshStandardMaterial color="#333" roughness={0.8} />
                </RoundedBox>
            </group>
            <group position={[0, 0.45, -2.15]}>
                <RoundedBox args={[1.75, 0.4, 0.1]} radius={0.05} smoothness={2}>
                    <meshStandardMaterial color="#333" roughness={0.8} />
                </RoundedBox>
            </group>

            {/* Grill (Front) */}
            <mesh position={[0, 0.6, 2.16]}>
                <planeGeometry args={[1.0, 0.25]} />
                <meshStandardMaterial color="#111" metalness={0.5} roughness={0.2} />
            </mesh>

            {/* License Plates */}
            <mesh position={[0, 0.35, 2.21]} rotation={[0, 0, 0]}>
                <planeGeometry args={[0.6, 0.15]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[0, 0.35, -2.21]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.6, 0.15]} />
                <meshStandardMaterial color="#fff" />
            </mesh>

            {/* Cabin / Roof */}
            <group position={[0, 1.1, -0.2]}>
                <RoundedBox args={[1.4, 0.6, 2.2]} radius={0.1} smoothness={4} castShadow receiveShadow>
                    {glassMaterial}
                </RoundedBox>
            </group>

            {/* Side Mirrors */}
            <group position={[0.75, 1.0, 0.6]} rotation={[0, -0.2, 0]}>
                <RoundedBox args={[0.15, 0.1, 0.05]} radius={0.02}>
                    {paintMaterial}
                </RoundedBox>
            </group>
            <group position={[-0.75, 1.0, 0.6]} rotation={[0, 0.2, 0]}>
                <RoundedBox args={[0.15, 0.1, 0.05]} radius={0.02}>
                    {paintMaterial}
                </RoundedBox>
            </group>

            {/* Door Handles (Subtle) */}
            <mesh position={[0.91, 0.7, 0]}>
                <boxGeometry args={[0.02, 0.05, 0.3]} />
                <meshStandardMaterial color="#888" metalness={1} />
            </mesh>
            <mesh position={[-0.91, 0.7, 0]}>
                <boxGeometry args={[0.02, 0.05, 0.3]} />
                <meshStandardMaterial color="#888" metalness={1} />
            </mesh>

            {/* Roof Top (Solid) */}
            <group position={[0, 1.41, -0.2]}>
                <RoundedBox args={[1.45, 0.05, 2.3]} radius={0.02} smoothness={2}>
                    {paintMaterial}
                </RoundedBox>
            </group>

            {/* Wheels */}
            <Wheel position={[0.8, 0.35, 1.2]} />
            <Wheel position={[-0.8, 0.35, 1.2]} />
            <Wheel position={[0.8, 0.35, -1.2]} />
            <Wheel position={[-0.8, 0.35, -1.2]} />

            {/* Headlights */}
            <mesh position={[0.6, 0.6, 2.11]}>
                <boxGeometry args={[0.4, 0.15, 0.05]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} toneMapped={false} />
            </mesh>
            <mesh position={[-0.6, 0.6, 2.11]}>
                <boxGeometry args={[0.4, 0.15, 0.05]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} toneMapped={false} />
            </mesh>

            {/* Taillights */}
            <mesh position={[0.6, 0.6, -2.11]}>
                <boxGeometry args={[0.4, 0.15, 0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            <mesh position={[-0.6, 0.6, -2.11]}>
                <boxGeometry args={[0.4, 0.15, 0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} toneMapped={false} />
            </mesh>
        </group>
    );
};

export default Car;

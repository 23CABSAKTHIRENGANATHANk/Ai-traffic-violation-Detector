import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// --- Assets & Components ---

const Building = ({ position, size, color }) => {
    return (
        <group position={position}>
            <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
            </mesh>
            {/* Windows Pattern (Simple Texture Simulation using geometry or shader is too complex, using simple varied boxes) */}
            <mesh position={[0, size[1] / 2, size[2] / 2 + 0.1]}>
                <planeGeometry args={[size[0] * 0.6, size[1] * 0.8]} />
                <meshStandardMaterial color="#ddd" roughness={0.2} metalness={0.8} />
            </mesh>
        </group>
    );
};

export const CityEnvironment = () => {
    // Pastel Colors for "Pixar" look
    const colors = ['#FFDDD2', '#E2F0CB', '#B9E4C9', '#C7CEEA', '#FF9AA2', '#FFB7B2'];

    const buildings = useMemo(() => {
        const items = [];
        // Left side
        for (let i = 0; i < 20; i++) {
            const width = 10 + Math.random() * 10;
            const height = 20 + Math.random() * 40;
            const depth = 10 + Math.random() * 10;
            const x = -30 - Math.random() * 10;
            const z = -100 + i * 25;
            const color = colors[Math.floor(Math.random() * colors.length)];
            items.push(<Building key={`L-${i}`} position={[x, 0, z]} size={[width, height, depth]} color={color} />);
        }
        // Right side
        for (let i = 0; i < 20; i++) {
            const width = 10 + Math.random() * 10;
            const height = 20 + Math.random() * 40;
            const depth = 10 + Math.random() * 10;
            const x = 30 + Math.random() * 10;
            const z = -100 + i * 25;
            const color = colors[Math.floor(Math.random() * colors.length)];
            items.push(<Building key={`R-${i}`} position={[x, 0, z]} size={[width, height, depth]} color={color} />);
        }
        return items;
    }, []);

    return (
        <group>
            {buildings}
            {/* Ground / Grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial color="#88c999" roughness={1} />
            </mesh>
        </group>
    );
};

const Road = () => {
    const textureOffset = useRef(0);
    const markingsRef = useRef();

    useFrame((state, delta) => {
        if (markingsRef.current) {
            // Animate road markings to simulate speed if camera is static, 
            // but if camera moves, we static road. 
            // Let's keep road static and move cars for Phase 1.
        }
    });

    return (
        <group>
            {/* Asphalt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 1000]} />
                <meshStandardMaterial color="#333" roughness={0.8} />
            </mesh>
            {/* Center Lines */}
            {[...Array(20)].map((_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -180 + i * 20]}>
                    <planeGeometry args={[1, 8]} />
                    <meshBasicMaterial color="#fff" />
                </mesh>
            ))}
            {/* Lane Lines */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.05, 0]}>
                <planeGeometry args={[0.5, 1000]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.05, 0]}>
                <planeGeometry args={[0.5, 1000]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
        </group>
    );
};

const CityScene = ({ children }) => {
    return (
        <Canvas shadows className="w-full h-full bg-sky-300" dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={50} />
            <OrbitControls
                maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going under ground
                minDistance={20}
                maxDistance={150}
                enablePan={true}
            />

            {/* Lighting for "Sunny Day" */}
            <hemisphereLight intensity={0.5} skyColor="#ffffff" groundColor="#000000" />
            <directionalLight
                position={[50, 100, 50]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            />
            <ambientLight intensity={0.4} />

            {/* Environment (Simplified for Debugging) */}
            {/* <Sky sunPosition={[100, 20, 100]} /> */}
            {/* <Cloud position={[-10, 30, -50]} speed={0.2} opacity={0.5} segments={20} /> */}

            {/* Basic Background */}
            <color attach="background" args={['#87CEEB']} />.

            {/* City World */}
            <CityEnvironment />
            <Road />

            {/* Content passed from parent (Traffic, etc) */}
            {children}

        </Canvas>
    );
};

export default CityScene;

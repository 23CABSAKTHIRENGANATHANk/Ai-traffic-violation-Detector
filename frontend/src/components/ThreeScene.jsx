import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// --- Components ---

const Building = ({ position, size, color }) => {
    return (
        <group position={position}>
            {/* Main Building Structure */}
            <mesh position={[0, size[1] / 2, 0]}>
                <boxGeometry args={size} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Neon Edges */}
            <mesh position={[0, size[1] / 2, 0]}>
                <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
            </mesh>
        </group>
    );
};

const City = () => {
    // Generate random buildings
    const buildings = useMemo(() => {
        const items = [];
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            if (Math.abs(x) < 15) continue; // Road clearance

            const height = 10 + Math.random() * 40;
            const width = 5 + Math.random() * 10;
            const depth = 5 + Math.random() * 10;
            const color = Math.random() > 0.5 ? '#00f3ff' : '#ff0055'; // Neon Blue or Red

            items.push(<Building key={i} position={[x, 0, z]} size={[width, height, depth]} color={color} />);
        }
        return items;
    }, []);

    return <group>{buildings}</group>;
};

const Road = () => {
    const roadRef = useRef();

    useFrame((state, delta) => {
        if (roadRef.current) {
            roadRef.current.position.z += delta * 10; // Simple movement illusion
            if (roadRef.current.position.z > 20) roadRef.current.position.z = 0;
        }
    });

    return (
        <group ref={roadRef}>
            {/* Road Surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <planeGeometry args={[20, 200]} />
                <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            {/* Lane Markings */}
            {[...Array(10)].map((_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, -100 + i * 20]}>
                    <planeGeometry args={[0.5, 5]} />
                    <meshBasicMaterial color="#fff" />
                </mesh>
            ))}
        </group>
    );
};

const MovingCar = ({ offsetZ, speed, laneX, color }) => {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.z += delta * speed;
            if (ref.current.position.z > 50) ref.current.position.z = -150;
        }
    });

    return (
        <group ref={ref} position={[laneX, 1, offsetZ]}>
            <mesh>
                <boxGeometry args={[2, 1.5, 4]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Tail Lights */}
            <mesh position={[0.5, 0, 2.1]}>
                <boxGeometry args={[0.5, 0.2, 0.1]} />
                <meshBasicMaterial color="red" />
            </mesh>
            <mesh position={[-0.5, 0, 2.1]}>
                <boxGeometry args={[0.5, 0.2, 0.1]} />
                <meshBasicMaterial color="red" />
            </mesh>
        </group>
    );
};

const ThreeScene = () => {
    const cameraRef = useRef();

    useEffect(() => {
        // Intro Animation
        if (cameraRef.current) {
            gsap.fromTo(cameraRef.current.position,
                { x: 0, y: 50, z: 50 },
                { x: 0, y: 10, z: 20, duration: 3, ease: "power2.out" }
            );
        }
    }, []);

    return (
        <Canvas shadows className="w-full h-full bg-black">
            <PerspectiveCamera makeDefault position={[0, 10, 20]} ref={cameraRef} />
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} />

            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={5} castShadow color="#00f3ff" />
            <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={5} castShadow color="#ff0055" />
            <fog attach="fog" args={['#000', 10, 80]} />

            {/* Environment */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* World */}
            <City />
            <Road />

            {/* Traffic */}
            <MovingCar offsetZ={-10} speed={15} laneX={4} color="#00f3ff" />
            <MovingCar offsetZ={-40} speed={18} laneX={4} color="#ff0055" />
            <MovingCar offsetZ={-20} speed={12} laneX={-4} color="#ffaa00" />
            <MovingCar offsetZ={-80} speed={25} laneX={-4} color="#00ff00" />

        </Canvas>
    );
};

export default ThreeScene;

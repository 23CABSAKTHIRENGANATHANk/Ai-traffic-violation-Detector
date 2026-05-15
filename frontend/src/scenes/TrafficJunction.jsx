import React, { useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import TrafficSignal from '../models/TrafficSignal';
import SignBoard from '../models/SignBoard';
import gsap from 'gsap';

// --- Animation Component ---
const IntroAnimation = () => {
    const { camera } = useThree();

    useEffect(() => {
        // Start from "Zoomed Out" (High and Far)
        // Animate to [0, 30, 60] (Default)
        gsap.fromTo(camera.position,
            { x: 0, y: 200, z: 300 }, // Start Position
            {
                x: 0,
                y: 30,
                z: 60,
                duration: 3,
                ease: "power3.out",
                onUpdate: () => {
                    // Optional: Update lookAt if needed, but OrbitControls handles target 0,0,0 usually
                    // camera.lookAt(0, 0, 0); 
                }
            }
        );
    }, [camera]);
    return null;
};

// --- Professional Assets ---

const ZebraCrossing = ({ position, rotation }) => (
    <group position={position} rotation={rotation}>
        {[...Array(8)].map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[i * 3 - 10.5, 0.03, 0]} receiveShadow>
                <planeGeometry args={[1.5, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
        ))}
    </group>
);

const Building = ({ position, size }) => {
    // size: [width, height, depth]
    const floorHeight = 3.5;
    const numFloors = Math.floor(size[1] / floorHeight);

    return (
        <group position={position}>
            {/* Main Concrete Core */}
            <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[size[0] - 1, size[1], size[2] - 1]} />
                <meshStandardMaterial color="#556677" roughness={0.6} /> {/* Concrete */}
            </mesh>

            {/* Glass Facade Panels */}
            <mesh position={[0, size[1] / 2, 0]}>
                <boxGeometry args={[size[0], size[1] - 2, size[2]]} />
                <meshStandardMaterial color="#88ccff" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
            </mesh>

            {/* Floor Dividers (Horizontal Stripes) */}
            {[...Array(numFloors)].map((_, i) => (
                <mesh key={i} position={[0, i * floorHeight + 2, 0]}>
                    <boxGeometry args={[size[0] + 0.2, 0.3, size[2] + 0.2]} />
                    <meshStandardMaterial color="#334455" />
                </mesh>
            ))}

            {/* Roof Parapet */}
            <mesh position={[0, size[1] + 1, 0]}>
                <boxGeometry args={[size[0], 2, size[2]]} />
                <meshStandardMaterial color="#444" />
            </mesh>

            {/* Rooftop HVAC Unit */}
            <mesh position={[2, size[1] + 2, -2]}>
                <boxGeometry args={[5, 2, 4]} />
                <meshStandardMaterial color="#aaa" />
            </mesh>
        </group>
    );
};

const CityBlock = () => {
    // Systematic Grid Layout
    const buildings = useMemo(() => {
        const items = [];
        for (let i = 0; i < 6; i++) {
            // Left Block
            items.push(<Building key={`L-${i}`} position={[-35, 0, -100 + i * 40]} size={[20, 30 + Math.random() * 20, 20]} />);
            // Right Block
            items.push(<Building key={`R-${i}`} position={[35, 0, -100 + i * 40]} size={[20, 30 + Math.random() * 20, 20]} />);
        }
        return items;
    }, []);

    return <group>{buildings}</group>;
};

const Road = () => {
    return (
        <group>
            {/* Asphalt Road */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[50, 500]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>

            {/* Sidewalks */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[28, 0.1, 0]} receiveShadow>
                <planeGeometry args={[6, 500]} />
                <meshStandardMaterial color="#555" roughness={0.9} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-28, 0.1, 0]} receiveShadow>
                <planeGeometry args={[6, 500]} />
                <meshStandardMaterial color="#555" roughness={0.9} />
            </mesh>

            {/* Lane Markings (White Dashed) */}
            {[...Array(40)].map((_, i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -200 + i * 15]}>
                    <planeGeometry args={[0.3, 6]} />
                    <meshBasicMaterial color="#e0e0e0" />
                </mesh>
            ))}

            {/* Lane Dividers (Solid Yellow/White) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0.02, 0]}>
                <planeGeometry args={[0.3, 500]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.02, 0]}>
                <planeGeometry args={[0.3, 500]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Feature: Zebra Crossings */}
            <ZebraCrossing position={[0, 0, 40]} />
            <ZebraCrossing position={[0, 0, -40]} />

            {/* Feature: Traffic Signals (At Crossings) */}
            {/* Crossing 1 (z=40) */}
            <TrafficSignal position={[15, 0, 45]} rotation={[0, Math.PI, 0]} state="red" />
            <TrafficSignal position={[-15, 0, 35]} rotation={[0, 0, 0]} state="red" />

            {/* Crossing 2 (z=-40) */}
            <TrafficSignal position={[15, 0, -35]} rotation={[0, Math.PI, 0]} state="green" />
            <TrafficSignal position={[-15, 0, -45]} rotation={[0, 0, 0]} state="green" />

            {/* Feature: Sign Boards */}
            <SignBoard position={[16, 0, 80]} rotation={[0, Math.PI, 0]} type="speed" value="60" />
            <SignBoard position={[-16, 0, -10]} rotation={[0, 0, 0]} type="stop" />
            <SignBoard position={[16, 0, -90]} rotation={[0, Math.PI, 0]} type="no-entry" />

        </group>
    );
};

const TrafficJunction = ({ children }) => {
    return (
        <Canvas shadows className="w-full h-full bg-slate-200" dpr={[1, 1.5]}>
            <PerspectiveCamera makeDefault position={[0, 30, 60]} fov={45} />
            <OrbitControls
                maxPolarAngle={Math.PI / 2 - 0.05}
                maxDistance={300}
                minDistance={20}
                enableDamping
            />

            <IntroAnimation />

            {/* Professional Lighting (Bright Day Time) */}
            <ambientLight intensity={1.2} /> {/* Increased for clarity */}
            <directionalLight
                position={[100, 150, 50]} // High Noon Sun
                intensity={3.0}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0001}
            />

            {/* Fallback Environment Background */}
            <color attach="background" args={['#87CEEB']} /> {/* Vibrant Sky Blue */}
            <fog attach="fog" args={['#87CEEB', 50, 200]} />

            {/* World */}
            <CityBlock />
            <Road />

            {/* Traffic */}
            {children}

            {/* Ground Plane (Far Clip) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry args={[2000, 2000]} />
                <meshBasicMaterial color="#e0e5e9" />
            </mesh>

        </Canvas>
    );
};

export default TrafficJunction;

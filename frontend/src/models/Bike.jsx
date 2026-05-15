import React from 'react';
import { RoundedBox } from '@react-three/drei';

const Wheel = ({ position }) => (
    <group position={position}>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
            {/* Tire */}
            <cylinderGeometry args={[0.32, 0.32, 0.12, 32]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}> {/* Rim */}
            <cylinderGeometry args={[0.2, 0.2, 0.13, 16]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Spokes */}
        <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} rotation={[0, 0, 0]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} rotation={[0, 0, 0]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} />
        </mesh>
    </group>
);

const Rider = ({ color = "#334155", helmetColor = "#FFD700", showHelmet = true }) => {
    return (
        <group position={[0, 0.8, -0.1]}>
            {/* Torso */}
            <mesh position={[0, 0.4, 0.1]} castShadow>
                <cylinderGeometry args={[0.25, 0.28, 0.6, 16]} />
                <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            {/* Legs (Sitting) */}
            <group position={[0.2, 0.1, 0.1]} rotation={[-0.5, 0, 0.2]}>
                <mesh position={[0, -0.3, 0]}>
                    <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
                    <meshStandardMaterial color="#1e293b" /> {/* Jeans/Dark Pants */}
                </mesh>
            </group>
            <group position={[-0.2, 0.1, 0.1]} rotation={[-0.5, 0, -0.2]}>
                <mesh position={[0, -0.3, 0]}>
                    <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            </group>

            {/* Arms */}
            <group position={[0.25, 0.6, 0.1]} rotation={[0.5, 0, -0.2]}>
                <mesh position={[0, -0.25, 0.2]}>
                    <capsuleGeometry args={[0.06, 0.5, 4, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </group>
            <group position={[-0.25, 0.6, 0.1]} rotation={[0.5, 0, 0.2]}>
                <mesh position={[0, -0.25, 0.2]}>
                    <capsuleGeometry args={[0.06, 0.5, 4, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </group>

            {/* Head & Helmet */}
            <group position={[0, 0.85, 0.1]}>
                {/* Skin/Head */}
                <mesh>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color="#d1a87b" roughness={0.5} />
                </mesh>

                {/* Helmet (Toggleable) */}
                {showHelmet && (
                    <group>
                        <mesh position={[0, 0.02, 0]}>
                            <sphereGeometry args={[0.14, 24, 24]} />
                            <meshStandardMaterial color={helmetColor} metalness={0.4} roughness={0.3} />
                        </mesh>
                        {/* Visor */}
                        <mesh position={[0, 0.02, 0.11]}>
                            <sphereGeometry args={[0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} rotation={[0.5, 0, 0]} />
                            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    );
};

const Bike = ({ position, rotation, color = "#ef4444", helmetColor = "#fbbf24", showHelmet = true }) => {
    // Metal Paint Material
    const paintMaterial = <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />;

    return (
        <group position={position} rotation={rotation}>
            {/* Frame/Chassis (Connected) */}
            <group position={[0, 0.45, 0]}>
                <RoundedBox args={[0.25, 0.3, 1.2]} radius={0.05} smoothness={4} castShadow>
                    <meshStandardMaterial color="#333" />
                </RoundedBox>
            </group>

            {/* Fuel Tank */}
            <group position={[0, 0.7, 0.3]}>
                <RoundedBox args={[0.4, 0.3, 0.6]} radius={0.1} smoothness={4} castShadow>
                    {paintMaterial}
                </RoundedBox>
            </group>

            {/* Seat */}
            <group position={[0, 0.68, -0.3]}>
                <RoundedBox args={[0.35, 0.1, 0.6]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color="#111" roughness={0.9} />
                </RoundedBox>
            </group>

            {/* Exhaust Pipe */}
            <mesh position={[0.2, 0.3, -0.4]} rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
                <meshStandardMaterial color="#bdc3c7" metalness={1} roughness={0.2} />
            </mesh>

            {/* Wheels */}
            <Wheel position={[0, 0.32, 0.85]} />
            <Wheel position={[0, 0.32, -0.85]} />

            {/* Handlebar Area */}
            <group position={[0, 0.85, 0.6]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
                    <meshStandardMaterial color="#ccc" />
                </mesh>
                {/* Mirrors */}
                <mesh position={[0.35, 0.15, 0]} rotation={[0.2, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
                    <meshStandardMaterial color="#ccc" metalness={0.9} />
                </mesh>
                <mesh position={[-0.35, 0.15, 0]} rotation={[0.2, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
                    <meshStandardMaterial color="#ccc" metalness={0.9} />
                </mesh>
            </group>

            {/* Rider */}
            <Rider helmetColor={helmetColor} showHelmet={showHelmet} />

            {/* Headlight */}
            <mesh position={[0, 0.7, 0.95]}>
                <boxGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
            </mesh>

            {/* License Plate (Rear) */}
            <mesh position={[0, 0.5, -0.9]} rotation={[0.3, Math.PI, 0]}>
                <planeGeometry args={[0.25, 0.12]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
        </group>
    );
};

export default Bike;

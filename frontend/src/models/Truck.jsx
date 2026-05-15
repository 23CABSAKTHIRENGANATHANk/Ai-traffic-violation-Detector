import React from 'react';
import { RoundedBox } from '@react-three/drei';

const Wheel = ({ position }) => (
    <group position={position}>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.42, 16]} />
            <meshStandardMaterial color="#ccc" metalness={0.7} />
        </mesh>
    </group>
);

const Truck = ({ position, rotation, cabColor = "#dc2626", containerColor = "#fff" }) => {
    return (
        <group position={position} rotation={rotation}>
            {/* Cab Section */}
            <group position={[0, 1.5, 3]}>
                <RoundedBox args={[2.8, 2.5, 2.5]} radius={0.2} smoothness={4} castShadow>
                    <meshStandardMaterial color={cabColor} metalness={0.6} roughness={0.3} />
                </RoundedBox>
                {/* Windshield */}
                <mesh position={[0, 0.5, 1.26]}>
                    <planeGeometry args={[2.4, 1.0]} />
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Grill */}
                <mesh position={[0, -0.5, 1.26]}>
                    <planeGeometry args={[2.0, 0.8]} />
                    <meshStandardMaterial color="#333" metalness={0.5} />
                </mesh>
            </group>

            {/* Cargo Container */}
            <group position={[0, 2.0, -1.5]}>
                <boxGeometry args={[2.9, 3.5, 6.0]} />
                <meshStandardMaterial color={containerColor} roughness={0.5} />
                {/* Rear Doors details */}
                <mesh position={[0, 0, -3.01]}>
                    <planeGeometry args={[2.8, 3.4]} />
                    <meshStandardMaterial color="#e5e5e5" />
                </mesh>
                <mesh position={[0, 0, -3.02]}>
                    <boxGeometry args={[0.1, 3.5, 0.05]} />
                    <meshStandardMaterial color="#999" />
                </mesh>
            </group>

            {/* Chassis Frame */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[2.5, 0.5, 9]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Wheels (Heavy Duty) */}
            <Wheel position={[1.2, 0.5, 3.5]} />
            <Wheel position={[-1.2, 0.5, 3.5]} />

            <Wheel position={[1.2, 0.5, -3.0]} />
            <Wheel position={[-1.2, 0.5, -3.0]} />
            <Wheel position={[1.2, 0.5, -4.2]} />
            <Wheel position={[-1.2, 0.5, -4.2]} />

        </group>
    );
};

export default Truck;

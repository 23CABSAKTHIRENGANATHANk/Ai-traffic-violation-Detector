import React from 'react';

const TrafficSignal = ({ position, rotation, state = 'green' }) => {
    // state: 'red', 'yellow', 'green', 'off'

    const Light = ({ color, isActive, yPos }) => (
        <group position={[0, yPos, 0.6]}>
            {/* Light Bulb */}
            <mesh>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial
                    color={isActive ? color : '#333'}
                    emissive={isActive ? color : '#000'}
                    emissiveIntensity={isActive ? 3 : 0}
                    roughness={0.2}
                />
            </mesh>
            {/* Visor (Hood) */}
            <mesh position={[0, 0.3, 0]} rotation={[0.5, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 0.05, 16, 1, true, 0, Math.PI]} />
                <meshStandardMaterial color="#111" side={2} />
            </mesh>
        </group>
    );

    return (
        <group position={position} rotation={rotation}>
            {/* Vertical Pole */}
            <mesh position={[0, 4, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 8, 16]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Horizontal Arm (Optional, for overhead lights) - Let's stick to side pole for now or overhead? 
               Reusing code: Let's do a standard upright pole with light head on top/side for simplicity/performance 
               similar to typical street corners.
            */}

            {/* Signal Head Box */}
            <mesh position={[0, 6.5, 0]} castShadow>
                <boxGeometry args={[0.8, 2.5, 0.6]} />
                <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>

            {/* Lights */}
            <Light color="#ff0000" isActive={state === 'red'} yPos={7.2} />
            <Light color="#ffff00" isActive={state === 'yellow'} yPos={6.5} />
            <Light color="#00ff00" isActive={state === 'green'} yPos={5.8} />
        </group>
    );
};

export default TrafficSignal;

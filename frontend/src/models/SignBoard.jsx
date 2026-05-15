import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';

const SignBoard = ({ position, rotation, type = 'speed', value = '60' }) => {

    const SignPlate = useMemo(() => {
        switch (type) {
            case 'speed':
                return (
                    <group position={[0, 5, 0]}>
                        {/* Circle Back */}
                        <mesh position={[0, 0, -0.05]}>
                            <cylinderGeometry args={[1, 1, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
                            <meshStandardMaterial color="#fff" />
                        </mesh>
                        {/* Red Border Ring */}
                        <mesh position={[0, 0, 0]}>
                            <ringGeometry args={[0.85, 1, 32]} />
                            <meshStandardMaterial color="#cc0000" side={2} />
                        </mesh>
                        {/* Text */}
                        {/* Text - Commented out for debugging
                        <Text
                             position={[0, 0.2, 0.06]}
                             fontSize={0.4}
                             color="#000"
                             anchorX="center"
                             anchorY="middle"
                        >
                            SPEED LIMIT
                        </Text>
                        <Text
                            position={[0, -0.2, 0.06]}
                            fontSize={0.8}
                            color="#000"
                            fontWeight="bold"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {value}
                        </Text>
                        */}
                    </group>
                );
            case 'stop':
                return (
                    <group position={[0, 5, 0]}>
                        {/* Octagon */}
                        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 8]}>
                            <circleGeometry args={[1, 8]} />
                            <meshStandardMaterial color="#cc0000" />
                        </mesh>
                        {/* 
                        <Text position={[0, 0, 0.06]} fontSize={0.6} color="#fff" fontWeight="bold">
                            STOP
                        </Text>
                        */}
                    </group>
                );
            case 'no-entry':
                return (
                    <group position={[0, 5, 0]}>
                        <mesh position={[0, 0, -0.05]}>
                            <cylinderGeometry args={[1, 1, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
                            <meshStandardMaterial color="#cc0000" />
                        </mesh>
                        <mesh position={[0, 0, 0.06]}>
                            <planeGeometry args={[1.5, 0.3]} />
                            <meshStandardMaterial color="#fff" />
                        </mesh>
                    </group>
                );
            default:
                return null;
        }
    }, [type, value]);

    return (
        <group position={position} rotation={rotation}>
            {/* Pole */}
            <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 5, 16]} />
                <meshStandardMaterial color="#666" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Sign Content */}
            {SignPlate}
        </group>
    );
};

export default SignBoard;

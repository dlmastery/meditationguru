'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { GOAL_CATEGORIES } from '@/lib/gemini';

interface GoalOrbsProps {
  onSelect: (goalId: string) => void;
  selectedGoals: string[];
}

interface OrbProps {
  goal: typeof GOAL_CATEGORIES[number];
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}

function Orb({ goal, position, isSelected, onSelect }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse when hovered or selected
      const scale = isSelected ? 1.3 : hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

      // Glow effect
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isSelected ? 0.8 : hovered ? 0.5 : 0.3;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.2}
      floatIntensity={0.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            color={goal.color}
            emissive={goal.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.9}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>

        {/* Inner glow sphere */}
        <mesh scale={0.85}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshBasicMaterial
            color={goal.color}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Outer glow */}
        <mesh scale={1.2}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial
            color={goal.color}
            transparent
            opacity={isSelected ? 0.2 : 0.1}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Label */}
        <Text
          position={[0, -1, 0]}
          fontSize={0.2}
          color="#f0f0f0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#1a1a2e"
        >
          {goal.label}
        </Text>

        {/* Icon */}
        <Text
          position={[0, 0, 0.65]}
          fontSize={0.35}
          anchorX="center"
          anchorY="middle"
        >
          {goal.icon}
        </Text>

        {/* Selection indicator */}
        {isSelected && (
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#4ecdc4" />
          </mesh>
        )}
      </group>
    </Float>
  );
}

export default function GoalOrbs({ onSelect, selectedGoals }: GoalOrbsProps) {
  // Arrange orbs in a circle
  const orbPositions: [number, number, number][] = GOAL_CATEGORIES.map((_, index) => {
    const angle = (index / GOAL_CATEGORIES.length) * Math.PI * 2;
    const radius = 4;
    return [
      Math.cos(angle) * radius,
      Math.sin(angle) * 0.5, // Slight vertical variation
      Math.sin(angle) * radius - 2,
    ];
  });

  return (
    <group>
      {GOAL_CATEGORIES.map((goal, index) => (
        <Orb
          key={goal.id}
          goal={goal}
          position={orbPositions[index]}
          isSelected={selectedGoals.includes(goal.id)}
          onSelect={() => onSelect(goal.id)}
        />
      ))}
    </group>
  );
}

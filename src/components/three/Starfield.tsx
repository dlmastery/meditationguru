'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarfieldProps {
  count?: number;
  depth?: number;
  breathingIntensity?: number;
}

export default function Starfield({
  count = 5000,
  depth = 50,
  breathingIntensity = 0
}: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const [positions, sizes, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Position stars in a sphere around the camera
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * depth + 10;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Vary star sizes
      sizes[i] = Math.random() * 2 + 0.5;

      // Star colors - mostly white with hints of blue and gold
      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        // White stars
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        // Blue-ish stars
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1;
      } else {
        // Golden stars
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.8;
      }
    }

    return [positions, sizes, colors];
  }, [count, depth]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Slow rotation for subtle movement
      pointsRef.current.rotation.y += 0.0001;
      pointsRef.current.rotation.x += 0.00005;
    }

    if (materialRef.current && breathingIntensity > 0) {
      // Pulse opacity with breathing
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 * breathingIntensity;
      materialRef.current.opacity = 0.8 + pulse;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.1}
        sizeAttenuation
        transparent
        opacity={0.8}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

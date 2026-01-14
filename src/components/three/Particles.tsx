'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  count?: number;
  size?: number;
  color?: string;
  speed?: number;
  spread?: number;
  guruPosition?: [number, number, number];
  flowToGuru?: boolean;
}

export default function Particles({
  count = 200,
  size = 0.05,
  color = '#f5c518',
  speed = 0.2,
  spread = 15,
  guruPosition = [0, 0, 0],
  flowToGuru = false,
}: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const [positions, velocities, originalPositions] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random positions in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * spread;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
    }

    return [positions, velocities, originalPositions];
  }, [count, spread, speed]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      if (flowToGuru) {
        // Flow towards guru position
        const dx = guruPosition[0] - posArray[i3];
        const dy = guruPosition[1] - posArray[i3 + 1];
        const dz = guruPosition[2] - posArray[i3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 2) {
          posArray[i3] += dx * 0.01;
          posArray[i3 + 1] += dy * 0.01;
          posArray[i3 + 2] += dz * 0.01;
        } else {
          // Reset particle to original position when it reaches guru
          posArray[i3] = originalPositions[i3];
          posArray[i3 + 1] = originalPositions[i3 + 1];
          posArray[i3 + 2] = originalPositions[i3 + 2];
        }
      } else {
        // Gentle floating motion
        posArray[i3] += Math.sin(time * 0.5 + i) * 0.002;
        posArray[i3 + 1] += Math.cos(time * 0.3 + i * 0.5) * 0.002;
        posArray[i3 + 2] += Math.sin(time * 0.4 + i * 0.3) * 0.001;
      }
    }

    positionAttr.needsUpdate = true;

    // Gentle size pulsing
    if (materialRef.current) {
      materialRef.current.size = size + Math.sin(time * 2) * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={size}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

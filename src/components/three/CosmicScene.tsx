'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Starfield from './Starfield';
import Nebula from './Nebula';
import Particles from './Particles';
import GoalOrbs from './GoalOrbs';

interface CosmicSceneProps {
  mode?: 'default' | 'onboarding' | 'session' | 'journey';
  breathingIntensity?: number;
  sessionMood?: 'calm' | 'energetic' | 'neutral';
  showOrbs?: boolean;
  onOrbSelect?: (goalId: string) => void;
  selectedGoals?: string[];
  guruPosition?: [number, number, number];
  flowParticlesToGuru?: boolean;
}

function SceneContent({
  mode = 'default',
  breathingIntensity = 0,
  sessionMood = 'neutral',
  showOrbs = false,
  onOrbSelect,
  selectedGoals = [],
  guruPosition = [0, 0, 0],
  flowParticlesToGuru = false,
}: CosmicSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Nebula colors based on mood
  const nebulaColors: { [key: string]: [string, string, string] } = {
    calm: ['#4a69bd', '#6a89cc', '#1a1a2e'],
    energetic: ['#e94560', '#f5c518', '#1a1a2e'],
    neutral: ['#e94560', '#7b68ee', '#1a1a2e'],
  };

  useFrame((state) => {
    if (groupRef.current) {
      // Very slow rotation for the whole scene
      groupRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Starfield background */}
      <Starfield
        count={mode === 'onboarding' ? 8000 : 5000}
        depth={60}
        breathingIntensity={breathingIntensity}
      />

      {/* Multiple nebula layers for depth */}
      <Nebula
        colors={nebulaColors[sessionMood]}
        opacity={0.35}
        position={[-15, 5, -30]}
        scale={50}
      />
      <Nebula
        colors={['#7b68ee', '#45b7d1', '#1a1a2e']}
        opacity={0.25}
        position={[20, -5, -40]}
        scale={45}
      />
      <Nebula
        colors={['#ff8fab', '#ffd93d', '#1a1a2e']}
        opacity={0.2}
        position={[0, 10, -50]}
        scale={60}
      />

      {/* Floating particles */}
      <Particles
        count={150}
        size={0.04}
        color="#f5c518"
        spread={20}
        guruPosition={guruPosition}
        flowToGuru={flowParticlesToGuru}
      />
      <Particles
        count={100}
        size={0.03}
        color="#e94560"
        spread={25}
      />
      <Particles
        count={80}
        size={0.035}
        color="#7b68ee"
        spread={22}
      />

      {/* Goal orbs for onboarding */}
      {showOrbs && onOrbSelect && (
        <GoalOrbs
          onSelect={onOrbSelect}
          selectedGoals={selectedGoals}
        />
      )}

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#f5c518" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#7b68ee" />
    </group>
  );
}

export default function CosmicScene(props: CosmicSceneProps) {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 30, 80]} />

        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />

        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>

        {/* Subtle camera controls - disabled for most views */}
        {props.mode === 'journey' && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.3}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        )}
      </Canvas>
    </div>
  );
}

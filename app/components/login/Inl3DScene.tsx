'use client';

import React, { useRef, Suspense, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Trail, Sparkles, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

/* -------------------------------------------------------------------------- */
/*  Perf tier detection: low-end = 4 or fewer logical cores                   */
/* -------------------------------------------------------------------------- */
function usePerf() {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return { isLow: false };
    const cores = navigator.hardwareConcurrency ?? 4;
    const isLow = cores <= 4;
    return { isLow };
  }, []);
}

/* -------------------------------------------------------------------------- */
/*  Logo Centerpiece                                                           */
/* -------------------------------------------------------------------------- */
function LogoCenterpiece({ isLow, isHoveredActive, setHovered }: { isLow: boolean; isHoveredActive: boolean; setHovered: (h: boolean) => void }) {
  const { scene } = useGLTF('/3d_model/85217c5c7e3fec599985e179a3c87bf2.glb');
  const logoGroupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  const ringMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ring2MatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ring3MatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const hoverFactor = useRef(0);
  const sweepProgress = useRef(0);
  const sweepLightRef = useRef<THREE.PointLight>(null!);

  // Keep track of accumulated rotations to prevent jarring jumps on hover transitions
  const ringRotations = useRef({
    ring1X: 0,
    ring1Y: 0,
    ring2X: 0,
    ring2Z: 0,
    ring3Y: 0,
    ring3Z: 0,
  });

  // Extract and optimize materials once the scene is loaded (run only once to prevent lagging)
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false; // Disable shadows for the heavy 71MB model
        mesh.receiveShadow = false;
        if (mesh.material) {
          const oldMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
          mesh.material = new THREE.MeshStandardMaterial({
            map: oldMat.map,
            color: oldMat.color,
            roughness: 0.45,
            metalness: 0.0, // Prevent logo from turning dark
            transparent: oldMat.transparent,
            opacity: oldMat.opacity,
            side: THREE.DoubleSide,
            emissive: new THREE.Color("#000000"),
            emissiveIntensity: 0
          });
        }
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1); // clamp delta to prevent massive jumps on lag spikes

    // Smooth frame-rate independent hover transition
    const lerpSpeed = isHoveredActive ? 6.0 : 4.0;
    hoverFactor.current = THREE.MathUtils.lerp(hoverFactor.current, isHoveredActive ? 1 : 0, 1 - Math.exp(-lerpSpeed * dt));

    // Animate sweep progress for metallic sheen wipe glow effect on hover (slower, elegant sweep)
    if (isHoveredActive) {
      sweepProgress.current = Math.min(sweepProgress.current + dt * 1.1, 1.0);
    } else {
      sweepProgress.current = Math.max(sweepProgress.current - dt * 0.8, 0.0);
    }

    // Move the point light across the logo from left to right on hover progress
    if (sweepLightRef.current) {
      sweepLightRef.current.position.x = -3.5 + sweepProgress.current * 7.0;
      sweepLightRef.current.intensity = Math.sin(sweepProgress.current * Math.PI) * (isLow ? 5.0 : 15.0);
    }

    // Opsi 2: Sway gently (slow periodic motion) - no Y/X spin to prevent looking flat/gepeng and keep it facing INL
    const swayY = Math.sin(t * 0.5) * 0.15; // gentle horizontal sway
    const swayX = Math.cos(t * 0.35) * 0.08; // gentle vertical sway
    const swayZ = Math.sin(t * 0.25) * 0.03; // gentle roll

    logoGroupRef.current.rotation.y = swayY;
    logoGroupRef.current.rotation.x = swayX;
    logoGroupRef.current.rotation.z = swayZ;

    // Subtle scale response on hover (keeps it responsive but clean)
    const scaleVal = 1 + hoverFactor.current * 0.08;
    logoGroupRef.current.scale.set(scaleVal, scaleVal, scaleVal);

    // Gyroscopic counter-rotating rings (speed up dynamically on hover!)
    const ringSpeed = 1.0 + hoverFactor.current * 2.0;
    const ringScaleVal = 1.0 + hoverFactor.current * 0.12;

    ringRotations.current.ring1X += -dt * 0.22 * ringSpeed;
    ringRotations.current.ring1Y += -dt * 0.16 * ringSpeed;
    ringRef.current.rotation.x = ringRotations.current.ring1X;
    ringRef.current.rotation.y = ringRotations.current.ring1Y;
    ringRef.current.scale.set(ringScaleVal, ringScaleVal, ringScaleVal);

    if (ring2Ref.current) {
      ringRotations.current.ring2X += dt * 0.18 * ringSpeed;
      ringRotations.current.ring2Z += dt * 0.24 * ringSpeed;
      ring2Ref.current.rotation.x = ringRotations.current.ring2X;
      ring2Ref.current.rotation.z = ringRotations.current.ring2Z;
      ring2Ref.current.scale.set(ringScaleVal, ringScaleVal, ringScaleVal);
    }
    if (ring3Ref.current) {
      ringRotations.current.ring3Y += dt * 0.12 * ringSpeed;
      ringRotations.current.ring3Z += -dt * 0.2 * ringSpeed;
      ring3Ref.current.rotation.y = ringRotations.current.ring3Y;
      ring3Ref.current.rotation.z = ringRotations.current.ring3Z;
      ring3Ref.current.scale.set(ringScaleVal, ringScaleVal, ringScaleVal);
    }

    // Keep ring intensities constant to prevent frame stutter on hover
    if (ringMatRef.current) {
      ringMatRef.current.emissiveIntensity = 0.5;
    }
    if (ring2MatRef.current) {
      ring2MatRef.current.emissiveIntensity = 0.6;
    }
    if (ring3MatRef.current) {
      ring3MatRef.current.emissiveIntensity = 1.2;
    }
  });

  return (
    <group>
      {/* Wipe/Sweep light for the metallic sheen effect on hover */}
      <pointLight
        ref={sweepLightRef}
        color="#fffbeb"
        distance={5}
        decay={2.2}
        intensity={0}
        position={[-3, 0, 0.6]}
      />

      {/* Centered INL Logo */}
      <group
        ref={logoGroupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <Center>
          <primitive object={scene} scale={2.8} />
        </Center>
      </group>

      {/* Torus Ring 1: Blue */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.3, 0.04, isLow ? 10 : 18, isLow ? 80 : 140]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#3b82f6"
          roughness={0.08}
          metalness={0.95}
          envMapIntensity={2.2}
          emissive="#1d4ed8"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Torus Ring 2: Orange */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.45, 0.03, isLow ? 10 : 18, isLow ? 80 : 140]} />
        <meshStandardMaterial
          ref={ring2MatRef}
          color="#f97316"
          roughness={0.12}
          metalness={0.95}
          envMapIntensity={2.2}
          emissive="#ea580c"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Torus Ring 3: Green */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.62, 0.015, isLow ? 8 : 16, isLow ? 90 : 160]} />
        <meshStandardMaterial
          ref={ring3MatRef}
          color="#10b981"
          roughness={0.15}
          metalness={0.8}
          emissive="#059669"
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Energy Orbiter (skipped on low-end)                                       */
/* -------------------------------------------------------------------------- */
interface EnergyOrbiterProps {
  radius: number;
  speed: number;
  color: string;
  offset: number;
}

function EnergyOrbiter({ radius, speed, color, offset }: EnergyOrbiterProps) {
  const meshRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t * speed + offset;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.y = Math.sin(angle) * radius * 0.7;
    meshRef.current.position.z = Math.sin(angle) * radius * 0.35 + 0.1;
  });

  return (
    <Trail width={0.10} length={5} color={color} attenuation={(w) => w * w} decay={1.8}>
      <group ref={meshRef}>
        <mesh>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </Trail>
  );
}

/* -------------------------------------------------------------------------- */
/*  Parallax Camera Controller                                                 */
/* -------------------------------------------------------------------------- */
function CameraController({ isLow, isHoveredExternal }: { isLow: boolean; isHoveredExternal?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { pointer } = useThree();

  const [hovered, setHovered] = useState(false);
  const isHoveredActive = hovered || !!isHoveredExternal;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    // Frame-rate independent lerp using damp/exponential decay
    const speed = isLow ? 1.5 : 2.5;
    const lerpFactor = 1 - Math.exp(-speed * dt);
    const targetY = pointer.x * (isLow ? 0.25 : 0.45);
    const targetX = pointer.y * (isLow ? -0.2 : -0.35);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, lerpFactor);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, lerpFactor);
  });

  return (
    <group ref={groupRef}>
      <Float speed={isLow ? 0.8 : 1.3} rotationIntensity={0.1} floatIntensity={isLow ? 0.3 : 0.5}>
        <LogoCenterpiece isLow={isLow} isHoveredActive={isHoveredActive} setHovered={setHovered} />
      </Float>

      {/* Energy orbiters — skipped on low-end */}
      {!isLow && (
        <>
          <EnergyOrbiter radius={2.2} speed={1.4}  color="#fbbf24" offset={0}           />
          <EnergyOrbiter radius={2.5} speed={-1.1} color="#f97316" offset={Math.PI}     />
          <EnergyOrbiter radius={2.0} speed={1.7}  color="#34d399" offset={Math.PI / 2} />
        </>
      )}

      {/* Sparkles — static and clean ambient particle effect */}
      <Sparkles
        count={isLow ? 20 : 45}
        scale={[6, 4, 6]}
        size={isLow ? 1.8 : 2.5}
        speed={isLow ? 0.2 : 0.35}
        color="#fbbf24"
        opacity={isLow ? 0.45 : 0.6}
      />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Scene                                                                 */
/* -------------------------------------------------------------------------- */
export default function Inl3DScene({ isHoveredExternal }: { isHoveredExternal?: boolean }) {
  const { isLow } = usePerf();

  return (
    <Canvas
      shadows={false}                                    // Shadows completely disabled to optimize the 71MB model
      camera={{ position: [0, 0, 8.2], fov: 45 }}
      dpr={isLow ? 0.85 : 1.0}                           // Cap DPR at 1.0 to optimize render fillrate on Retina/High-DPI screens
      gl={{
        antialias: false,                                // Antialiasing disabled for significant GPU boost
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      frameloop={isLow ? 'demand' : 'always'}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={isLow ? 1.1 : 1.3} color="#ffffff" />

      {/* Front directional light to make the logo colors bright and clear */}
      <directionalLight
        position={[0, 0, 6]}
        intensity={1.8}
        color="#ffffff"
        castShadow={false}
      />

      {/* Top-right directional light — shadows disabled */}
      <directionalLight
        position={[5, 8, 4]}
        intensity={isLow ? 1.4 : 2.2}
        color="#ffffff"
        castShadow={false}
      />

      {/* Colored point lights — reduced intensity on low-end */}
      <pointLight position={[-6, -4, 3]} intensity={isLow ? 1.5 : 3.5} color="#3b82f6" distance={15} decay={2} />
      <pointLight position={[6,   4, 3]} intensity={isLow ? 2.0 : 4.5} color="#f59e0b" distance={15} decay={2} />

      <Suspense fallback={null}>
        <CameraController isLow={isLow} isHoveredExternal={isHoveredExternal} />
      </Suspense>
    </Canvas>
  );
}

// Pre-load the GLB model to prevent render lag
useGLTF.preload('/3d_model/85217c5c7e3fec599985e179a3c87bf2.glb');

'use client';

import React, { useRef, Suspense, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Trail, useTexture, Sparkles } from '@react-three/drei';
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
function LogoCenterpiece({ isLow }: { isLow: boolean }) {
  const logoTexture = useTexture('/img/inl3d.png');
  const logoGroupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  const logoMatRef = useRef<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | null>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ring2MatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ring3MatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [hovered, setHovered] = useState(false);
  const hoverFactor = useRef(0);

  // Keep track of accumulated rotations to prevent jarring jumps on hover transitions
  const ringRotations = useRef({
    ring1X: 0,
    ring1Y: 0,
    ring2X: 0,
    ring2Z: 0,
    ring3Y: 0,
    ring3Z: 0,
  });
  const logoRotationY = useRef(0);
  const logoRotationX = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1); // clamp delta to prevent massive jumps on lag spikes

    // Smooth frame-rate independent hover transition
    const lerpSpeed = hovered ? 6.0 : 4.0;
    hoverFactor.current = THREE.MathUtils.lerp(hoverFactor.current, hovered ? 1 : 0, 1 - Math.exp(-lerpSpeed * dt));

    // Rotate centerpiece logo (floats, and tilts/spins on hover)
    const floatY = Math.sin(t * 0.5) * 0.15;
    const floatX = Math.sin(t * 0.35) * 0.08;
    const floatZ = Math.sin(t * 0.25) * 0.03;

    // Smoothly accumulate rotation to prevent sudden angle jumps when speed changes
    const logoSpinSpeedY = 0.05 * hoverFactor.current;
    const logoSpinSpeedX = Math.sin(t * 1.2) * 0.03 * hoverFactor.current;

    logoRotationY.current += dt * logoSpinSpeedY;
    logoRotationX.current += dt * logoSpinSpeedX;

    logoGroupRef.current.rotation.y = floatY + logoRotationY.current;
    logoGroupRef.current.rotation.x = floatX + logoRotationX.current;
    logoGroupRef.current.rotation.z = floatZ;

    // Scale centerpiece logo on hover (increased from 0.12 to 0.35 for a much larger effect)
    const scaleVal = 1 + hoverFactor.current * 0.35;
    logoGroupRef.current.scale.set(scaleVal, scaleVal, scaleVal);

    // Gyroscopic counter-rotating rings (speeds up and scales on hover)
    const ringSpeed = 1 + hoverFactor.current * 1.5;
    const ringScaleVal = 1 + hoverFactor.current * 0.20; // Scale rings to expand outwards as the logo grows

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

    // Intensify emissive glow on hover
    if (ringMatRef.current) {
      ringMatRef.current.emissiveIntensity = 0.35 + hoverFactor.current * 0.55;
    }
    if (ring2MatRef.current) {
      ring2MatRef.current.emissiveIntensity = 0.4 + hoverFactor.current * 0.6;
    }
    if (ring3MatRef.current) {
      ring3MatRef.current.emissiveIntensity = 1.2 + hoverFactor.current * 0.8;
    }
    if (logoMatRef.current) {
      // Prevent washout by keeping emissive low and using a dark base color (#222222)
      logoMatRef.current.emissiveIntensity = hoverFactor.current * 0.25;

      // Animate material properties on hover for premium, dynamic reflections
      const baseRoughness = isLow ? 0.2 : 0.15;
      const targetRoughness = isLow ? 0.18 : 0.05;
      logoMatRef.current.roughness = THREE.MathUtils.lerp(baseRoughness, targetRoughness, hoverFactor.current);

      const baseEnv = isLow ? 0.8 : 1.2;
      const targetEnv = isLow ? 1.0 : 2.2;
      logoMatRef.current.envMapIntensity = THREE.MathUtils.lerp(baseEnv, targetEnv, hoverFactor.current);

      const baseMetal = isLow ? 0.05 : 0.1;
      const targetMetal = isLow ? 0.08 : 0.25;
      logoMatRef.current.metalness = THREE.MathUtils.lerp(baseMetal, targetMetal, hoverFactor.current);

      if ('clearcoat' in logoMatRef.current) {
        (logoMatRef.current as THREE.MeshPhysicalMaterial).clearcoat = THREE.MathUtils.lerp(0.6, 0.95, hoverFactor.current);
      }
    }
  });

  return (
    <group>
      {/* Centered INL Logo */}
      <group ref={logoGroupRef}>
        <mesh
          position={[0, 0, 0]}
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
          <planeGeometry args={[4.2, 4.2]} />
          {isLow ? (
            /* Low-end: plain standard material — no transmission/clearcoat shader */
            <meshStandardMaterial
              ref={logoMatRef}
              map={logoTexture}
              transparent={true}
              roughness={0.2}
              metalness={0.05}
              envMapIntensity={0.8}
              side={THREE.DoubleSide}
              emissive="#222222"
              emissiveIntensity={0}
            />
          ) : (
            <meshPhysicalMaterial
              ref={logoMatRef as React.Ref<THREE.MeshPhysicalMaterial>}
              map={logoTexture}
              transparent={true}
              roughness={0.15}
              metalness={0.1}
              clearcoat={0.6}
              clearcoatRoughness={0.1}
              envMapIntensity={1.2}
              side={THREE.DoubleSide}
              emissive="#222222"
              emissiveIntensity={0}
            />
          )}
        </mesh>
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
function CameraController({ isLow }: { isLow: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { pointer } = useThree();

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
        <LogoCenterpiece isLow={isLow} />
      </Float>

      {/* Energy orbiters — skipped on low-end */}
      {!isLow && (
        <>
          <EnergyOrbiter radius={2.2} speed={1.4}  color="#fbbf24" offset={0}           />
          <EnergyOrbiter radius={2.5} speed={-1.1} color="#f97316" offset={Math.PI}     />
          <EnergyOrbiter radius={2.0} speed={1.7}  color="#34d399" offset={Math.PI / 2} />
        </>
      )}

      {/* Sparkles — halved on low-end */}
      <Sparkles
        count={isLow ? 20 : 45}
        scale={[6, 4, 6]}
        size={isLow ? 1.8 : 2.5}
        speed={isLow ? 0.2 : 0.35}
        color="#f59e0b"
        opacity={isLow ? 0.45 : 0.65}
      />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Scene                                                                 */
/* -------------------------------------------------------------------------- */
export default function Inl3DScene() {
  const { isLow } = usePerf();

  return (
    <Canvas
      shadows={!isLow}                                   // No shadows on low-end
      camera={{ position: [0, 0, 8.2], fov: 45 }}
      dpr={isLow ? 1 : [1, 1.5]}                        // Fixed DPR 1 on low-end, max 1.5 on high
      gl={{
        antialias: !isLow,                               // No antialias on low-end
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      frameloop={isLow ? 'demand' : 'always'}            // Demand mode reduces idle CPU usage
      performance={{ min: 0.5 }}                         // Auto-degrade DPR if FPS drops
    >
      <ambientLight intensity={isLow ? 1.0 : 0.75} color="#ffffff" />

      {/* Directional light — no shadow map on low-end */}
      <directionalLight
        position={[5, 8, 4]}
        intensity={isLow ? 1.2 : 1.8}
        color="#ffffff"
        castShadow={!isLow}
        shadow-mapSize={isLow ? undefined : [1024, 1024]}
        shadow-bias={isLow ? undefined : -0.0001}
      />

      {/* Colored point lights — reduced intensity on low-end */}
      <pointLight position={[-6, -4, 3]} intensity={isLow ? 1.5 : 3.5} color="#3b82f6" distance={15} decay={2} />
      <pointLight position={[6,   4, 3]} intensity={isLow ? 2.0 : 4.5} color="#f59e0b" distance={15} decay={2} />

      <Suspense fallback={null}>
        <CameraController isLow={isLow} />
      </Suspense>

      {/* Environment preset skipped entirely on low-end */}
      {!isLow && (
        <Suspense fallback={null}>
          {/* Inline to avoid top-level conditional dynamic import */}
          <EnvironmentLazy />
        </Suspense>
      )}
    </Canvas>
  );
}

/* Lazy-loaded environment so it doesn't block initial render */
function EnvironmentLazy() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Environment } = require('@react-three/drei');
  return <Environment preset="city" />;
}

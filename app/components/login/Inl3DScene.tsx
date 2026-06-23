'use client';

import React, { useRef, Suspense, useMemo } from 'react';
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
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.08;
    groupRef.current.rotation.z = Math.sin(t * 0.25) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4.2, 4.2]} />
        {isLow ? (
          /* Low-end: plain standard material — no transmission/clearcoat shader */
          <meshStandardMaterial
            map={logoTexture}
            transparent={true}
            roughness={0.2}
            metalness={0.05}
            envMapIntensity={0.8}
            side={THREE.DoubleSide}
          />
        ) : (
          /* High-end: full physical glass material */
          <meshPhysicalMaterial
            map={logoTexture}
            transparent={true}
            roughness={0.08}
            transmission={0.65}
            thickness={0.8}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            ior={1.52}
            envMapIntensity={2.2}
            side={THREE.DoubleSide}
          />
        )}
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
          {/* Reduced segments on the sphere for better perf */}
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </Trail>
  );
}

/* -------------------------------------------------------------------------- */
/*  Orbiting Seed                                                              */
/* -------------------------------------------------------------------------- */
interface OrbitingSeedProps {
  radius: number;
  speed: number;
  offset: number;
  yOffset: number;
  size: number;
  trail?: boolean;
  isLow: boolean;
}

function OrbitingSeed({ radius, speed, offset, yOffset, size, trail, isLow }: OrbitingSeedProps) {
  const meshRef = useRef<THREE.Group>(null!);

  const seedTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;   // Smaller texture on low-end
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0,    '#0a0503');
    grad.addColorStop(0.2,  '#1a0804');
    grad.addColorStop(0.55, '#a31b1b');
    grad.addColorStop(0.85, '#d97706');
    grad.addColorStop(1,    '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t * speed + offset;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.z = Math.sin(angle) * radius;
    meshRef.current.position.y = yOffset + Math.sin(t * 0.95 + offset) * 0.18;
    meshRef.current.rotation.x = t * 0.35 + offset;
    meshRef.current.rotation.y = t * 0.5;
  });

  // Reduced detail on low-end: dodecahedron detail=0 instead of 1
  const body = (
    <group>
      <mesh scale={[0.8, 1.25, 0.8]}>
        <dodecahedronGeometry args={[0.26, isLow ? 0 : 1]} />
        {isLow ? (
          <meshStandardMaterial map={seedTexture} roughness={0.3} metalness={0.02} />
        ) : (
          <meshPhysicalMaterial
            map={seedTexture}
            roughness={0.12}
            metalness={0.02}
            clearcoat={1.0}
            clearcoatRoughness={0.03}
            ior={1.48}
            envMapIntensity={2.5}
          />
        )}
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[Math.PI, 0, 0]}>
        {/* Reduced cone segments on low-end */}
        <coneGeometry args={[0.16, 0.22, isLow ? 5 : 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
  );

  if (trail && !isLow) {
    return (
      <Trail width={0.18} length={3} color="#d97706" attenuation={(w) => w * w} decay={1.5}>
        <group ref={meshRef} scale={size}>{body}</group>
      </Trail>
    );
  }

  return <group ref={meshRef} scale={size}>{body}</group>;
}

/* -------------------------------------------------------------------------- */
/*  Orbiting Leaf                                                              */
/* -------------------------------------------------------------------------- */
interface OrbitingLeafProps {
  radius: number;
  speed: number;
  offset: number;
  yOffset: number;
  size: number;
  isLow: boolean;
}

function OrbitingLeaf({ radius, speed, offset, yOffset, size, isLow }: OrbitingLeafProps) {
  const meshRef = useRef<THREE.Group>(null!);

  // Reduced geometry resolution on low-end
  const leafGeometry = useMemo(() => {
    const [w, h] = isLow ? [6, 12] : [12, 24];
    const geom = new THREE.PlaneGeometry(0.38, 1.6, w, h);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const crease = -Math.abs(x) * 0.75;
      const bendY = -Math.pow(y + 0.8, 2) * 0.08;
      pos.setZ(i, crease + bendY);
      const t = (y + 0.8) / 1.6;
      const factor = Math.sin(t * Math.PI) * 0.85 + (1 - t) * 0.15;
      pos.setX(i, x * factor);
    }
    geom.computeVertexNormals();
    return geom;
  }, [isLow]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t * speed + offset;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.z = Math.sin(angle) * radius;
    meshRef.current.position.y = yOffset + Math.sin(t * 1.1 + offset) * 0.22;
    meshRef.current.rotation.x = t * 0.65 + offset;
    meshRef.current.rotation.y = t * 0.45;
    meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.35;
  });

  return (
    <group ref={meshRef} scale={size}>
      <mesh geometry={leafGeometry}>
        {isLow ? (
          <meshStandardMaterial
            color="#065f46"
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshPhysicalMaterial
            color="#065f46"
            roughness={0.25}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            transmission={0.22}
            thickness={0.1}
            ior={1.42}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Parallax Camera Controller                                                 */
/* -------------------------------------------------------------------------- */
function CameraController({ isLow }: { isLow: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { pointer } = useThree();

  useFrame(() => {
    // Reduce lerp frequency on low-end
    const lerpFactor = isLow ? 0.025 : 0.04;
    const targetY = pointer.x * (isLow ? 0.25 : 0.45);
    const targetX = pointer.y * (isLow ? -0.2 : -0.35);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, lerpFactor);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, lerpFactor);
  });

  // Low-end: 2 seeds, 1 leaf, no energy orbiters, fewer sparkles
  // High-end: 3 seeds, 3 leaves, 3 energy orbiters, more sparkles
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

      {/* Seeds */}
      <OrbitingSeed radius={2.2} speed={0.4}   offset={0.0} yOffset={0.2}  size={1.0} trail isLow={isLow} />
      <OrbitingSeed radius={2.6} speed={-0.35} offset={2.1} yOffset={-0.2} size={0.8} trail isLow={isLow} />
      {!isLow && (
        <OrbitingSeed radius={2.4} speed={0.48} offset={4.2} yOffset={0.35} size={0.7} isLow={false} />
      )}

      {/* Leaves */}
      <OrbitingLeaf radius={2.0} speed={-0.45} offset={1.0} yOffset={-0.1} size={1.1} isLow={isLow} />
      {!isLow && (
        <>
          <OrbitingLeaf radius={2.7} speed={0.3}   offset={3.1} yOffset={0.1}  size={0.9} isLow={false} />
          <OrbitingLeaf radius={2.9} speed={-0.28} offset={5.2} yOffset={-0.4} size={1.0} isLow={false} />
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

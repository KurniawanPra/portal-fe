import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaveFieldProps {
  mobile: boolean;
}

export default function WaveField({ mobile }: WaveFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const cols = mobile ? 42 : 68;
  const rows = mobile ? 42 : 68;
  const sep = 0.34;

  const { positions, count } = useMemo(() => {
    const count = cols * rows;
    const positions = new Float32Array(count * 3);
    let i = 0;
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        positions[i * 3 + 0] = (x - cols / 2) * sep;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (z - rows / 2) * sep;
        i++;
      }
    }
    return { positions, count };
  }, [cols, rows]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (geomRef.current) {
      const pos = geomRef.current.attributes.position as THREE.BufferAttribute;
      let i = 0;
      for (let x = 0; x < cols; x++) {
        const px = (x - cols / 2) * sep;
        for (let z = 0; z < rows; z++) {
          const pz = (z - rows / 2) * sep;
          const y =
            Math.sin(px * 0.55 + t * 0.8) * 0.28 +
            Math.cos(pz * 0.5 + t * 0.6) * 0.28;
          pos.setY(i, y);
          i++;
        }
      }
      pos.needsUpdate = true;
    }
    if (groupRef.current) {
      const tx = state.pointer.x * 0.18;
      const ty = state.pointer.y * 0.18;
      groupRef.current.rotation.z += (tx - groupRef.current.rotation.z) * 0.03;
      groupRef.current.position.x += (tx * 1.2 - groupRef.current.position.x) * 0.03;
      groupRef.current.position.y += ((-1.1 + ty) - groupRef.current.position.y) * 0.03;
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1.1, 0]}>
      <points>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          color="#6366f1"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

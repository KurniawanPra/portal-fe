import React from 'react';
import { Canvas } from '@react-three/fiber';
import WaveField from './WaveField';

interface SceneProps {
  mobile: boolean;
}

export default function Scene({ mobile }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 6], fov: 55 }}
      dpr={mobile ? [1, 1.3] : [1, 2]}
      gl={{ antialias: !mobile, alpha: true }}
    >
      <color attach="background" args={['#f4f6fb']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={1.1} color="#ffffff" />
      <WaveField mobile={mobile} />
    </Canvas>
  );
}

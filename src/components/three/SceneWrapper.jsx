import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 600 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        position: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15 - 5],
        speed: 0.002 + Math.random() * 0.008,
        offset: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.06,
      });
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      const x = p.position[0] + Math.sin(t * p.speed * 10 + p.offset) * 0.3;
      const y = p.position[1] + Math.cos(t * p.speed * 8 + p.offset) * 0.2;
      const z = p.position[2] + Math.sin(t * p.speed * 6) * 0.1;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale * (1 + 0.3 * Math.sin(t * 2 + p.offset)));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
    </instancedMesh>
  );
}

function FloatingShape({ position, color, speed = 1, shape = 'icosahedron' }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    ref.current.rotation.x = t * 0.3;
    ref.current.rotation.y = t * 0.2;
    ref.current.position.y = position[1] + Math.sin(t) * 0.5;
  });

  const Geo = shape === 'torus'
    ? <torusGeometry args={[1, 0.4, 16, 32]} />
    : shape === 'octahedron'
      ? <octahedronGeometry args={[1]} />
      : <icosahedronGeometry args={[1]} />;

  return (
    <mesh ref={ref} position={position}>
      {Geo}
      <meshBasicMaterial color={color} transparent opacity={0.06} wireframe />
    </mesh>
  );
}

export default function SceneWrapper() {
  return (
    <div className="three-canvas-wrapper">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles count={500} />
        <FloatingShape position={[-6, 3, -8]} color="#f59e0b" speed={0.4} shape="icosahedron" />
        <FloatingShape position={[7, -2, -10]} color="#22d3ee" speed={0.3} shape="torus" />
        <FloatingShape position={[0, -4, -6]} color="#a78bfa" speed={0.5} shape="octahedron" />
        <FloatingShape position={[-8, -3, -12]} color="#fb7185" speed={0.35} shape="icosahedron" />
        <FloatingShape position={[5, 4, -9]} color="#34d399" speed={0.45} shape="torus" />
      </Canvas>
    </div>
  );
}

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark } from '@mediapipe/tasks-vision';

// BlazePose topology connections
const CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;

interface SwingCanvasProps {
  landmarks: Landmark[]; // MediaPipe World Landmarks
}

function Skeleton({ landmarks }: { landmarks: Landmark[] }) {
  const points = useMemo(() => {
    if (!landmarks || landmarks.length === 0) return [];
    return landmarks.map(lm => new THREE.Vector3(lm.x, -lm.y, -lm.z)); // Flip Y/Z
  }, [landmarks]);

  if (points.length === 0) return null;

  return (
    <group>
      {/* Joints - Glowing Orbs */}
      {points.map((pt, i) => (
        <mesh key={i} position={pt} scale={0.025}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial 
            color={i > 10 ? "#00ff88" : "#00aaff"} 
            emissive={i > 10 ? "#00ff88" : "#00aaff"}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Bones - Glowing Lines */}
      {CONNECTIONS.map((conn, i) => {
        const start = points[conn.start];
        const end = points[conn.end];
        if (!start || !end) return null;
        
        return (
             <GlowingLine key={i} start={start} end={end} />
        )
      })}
    </group>
  );
}

function GlowingLine({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  return (
    <Line points={[start, end]} color="#ffffff" lineWidth={1} />
  )
}

export default function SwingCanvas({ landmarks }: SwingCanvasProps) {
  return (
    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800 relative group">
        <div className="absolute top-3 left-3 z-10 flex flex-col pointer-events-none">
             <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
                  System: Online
             </span>
             <span className="text-xs font-bold text-white/90">
                  HOLO-VIEW v1.0
             </span>
        </div>
        
      <Canvas camera={{ position: [0, 1, 3], fov: 45 }}>
        <color attach="background" args={['#020617']} /> {/* Slate-950 */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <group position={[0, -1, 0]}>
            <Skeleton landmarks={landmarks} />
            <Grid 
                infiniteGrid 
                fadeDistance={12} 
                sectionColor="#1e293b" 
                cellColor="#0f172a" 
                sectionThickness={1} 
                cellThickness={0.5} 
            />
        </group>
        
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        
        {/* Post Processing for the Glow */}
        <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

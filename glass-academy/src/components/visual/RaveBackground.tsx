'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Color, Vector2, Mesh, ShaderMaterial } from 'three';
import { useTheme } from '@/contexts/ThemeContext';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useUserAnimationPreference } from '@/hooks/useUserAnimationPreference';

const PlasmaShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      float time = uTime * 0.5;

      // Amiga-style plasma effect
      float v = 0.0;
      vec2 c = uv * 2.0 - 1.0;
      
      v += sin((c.x + time));
      v += sin((c.y + time) / 2.0);
      v += sin((c.x + c.y + time) / 2.0);
      c += uv / 2.0 * vec2(sin(time / 3.0), cos(time / 2.0));
      v += sin(sqrt(c.x * c.x + c.y * c.y + 1.0) + time);
      v = v / 2.0;

      vec3 col = mix(uColor1, uColor2, sin(v * 3.14159 + time));
      col = mix(col, uColor3, sin(v * 3.14159 + time * 0.5));

      gl_FragColor = vec4(col, 0.4); // Transparency for layering
    }
  `
};

const PlasmaMesh = ({ theme }: { theme: 'light' | 'dark' }) => {
  const mesh = useRef<Mesh>(null!);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uColor1: { value: new Color(theme === 'dark' ? '#4f46e5' : '#6366f1') }, // Indigo
    uColor2: { value: new Color(theme === 'dark' ? '#7c3aed' : '#8b5cf6') }, // Violet
    uColor3: { value: new Color(theme === 'dark' ? '#db2777' : '#ec4899') }, // Pink
  }), [theme]);

  useFrame((state) => {
    if (mesh.current) {
      (mesh.current.material as ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} scale={[10, 10, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={PlasmaShader.vertexShader}
        fragmentShader={PlasmaShader.fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

export default function RaveBackground() {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [userPreference] = useUserAnimationPreference();

  // Fallback for reduced motion or server-side
  if (prefersReducedMotion || !userPreference) {
    return (
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 bg-background" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: 'low-power' }}>
        <PlasmaMesh theme={resolvedTheme} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
    </div>
  );
}

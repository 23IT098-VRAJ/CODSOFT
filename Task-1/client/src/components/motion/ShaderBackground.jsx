import React from 'react';
import { GodRays, GrainGradient, MeshGradient } from '@paper-design/shaders-react';
import { useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

// motion-ui "ShaderBackground": a GPU-rendered animated backdrop (Paper
// Shaders, WebGL). The original exposes 21 variants; this port keeps the
// three that suit a storefront hero so the rest are not bundled.
//
// This file is only ever loaded with React.lazy — the WebGL code is a
// separate chunk fetched after the page has painted, never part of the
// first load. Under reduced motion the shader is frozen on a single frame.
const VARIANTS = {
  'god-rays': GodRays,
  'mesh-gradient': MeshGradient,
  'grain-gradient': GrainGradient,
};

export default function ShaderBackground({ variant, className, speed = 1, ...props }) {
  const reduceMotion = useReducedMotion();
  const Shader = VARIANTS[variant];

  return (
    <Shader
      {...props}
      speed={reduceMotion ? 0 : speed}
      // Cap the resolution: a soft backdrop gains nothing from 4K pixels,
      // and a smaller canvas keeps weak GPUs at a steady frame rate.
      maxPixelCount={1280 * 720}
      className={cn('h-full w-full', className)}
    />
  );
}

'use client';

import React, { useRef, useEffect } from 'react';

export interface HoleBackgroundProps extends React.ComponentPropsWithoutRef<'div'> {
  strokeColor?: string;
  numberOfLines?: number;
  numberOfDiscs?: number;
  particleRGBColor?: [number, number, number];
}

interface Particle {
  r: number;
  theta: number;
  vr: number;
  vTheta: number;
  size: number;
  alpha: number;
}

export function HoleBackground({
  strokeColor = '#737373',
  numberOfLines = 50,
  numberOfDiscs = 50,
  particleRGBColor = [255, 255, 255],
  className,
  ...props
}: HoleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas || !container) return;
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse coordinates (default to center)
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = width / 2;
      mouse.targetY = height / 2;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Create particles orbiting the black hole
    const maxRadius = Math.sqrt(width * width + height * height);
    const particleCount = 80;
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const r = Math.random() * maxRadius + 20;
      return {
        r,
        theta: Math.random() * Math.PI * 2,
        vr: Math.random() * 0.4 + 0.2, // Radial speed inward
        vTheta: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1), // Angular speed
        size: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.3,
      };
    });

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse movement
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const isDark = document.documentElement.classList.contains('dark');

      // Draw background
      ctx.fillStyle = isDark ? '#0b0f17' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const holeX = mouse.x;
      const holeY = mouse.y;
      const R_max = Math.max(width, height) * 1.2;

      // Define grid stroke style
      ctx.lineWidth = 0.75;
      
      // Compute responsive theme stroke color
      let finalStrokeColor = strokeColor;
      if (strokeColor === '#737373') {
        finalStrokeColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.07)';
      }
      ctx.strokeStyle = finalStrokeColor;

      // Funnel warp and twist functions based on polar radius r
      const getWarpFactor = (r: number) => {
        // Warp coordinates inward near the singularity
        const gravityRadius = 240;
        if (r < gravityRadius) {
          const strength = 0.5;
          return 1 - strength * Math.pow(1 - r / gravityRadius, 2.5);
        }
        return 1;
      };

      const getTwistAngle = (r: number) => {
        // Swirl twist near the singularity
        const twistRadius = 200;
        if (r < twistRadius) {
          return 1.4 * Math.pow(1 - r / twistRadius, 2);
        }
        return 0;
      };

      // 1. Draw Concentric Discs
      const discSpacing = R_max / numberOfDiscs;
      for (let i = 1; i <= numberOfDiscs; i++) {
        const baseR = i * discSpacing;
        ctx.beginPath();
        let isDrawing = false;
        
        // 72 segments (5 degrees each) to draw the circular contour smoothly
        const segments = 72;
        for (let s = 0; s <= segments; s++) {
          const angle = (s * Math.PI * 2) / segments;
          
          // Twist and warp calculations
          const twist = getTwistAngle(baseR);
          const warp = getWarpFactor(baseR);
          
          const finalAngle = angle + twist;
          const finalR = baseR * warp;
          
          const x = holeX + finalR * Math.cos(finalAngle);
          const y = holeY + finalR * Math.sin(finalAngle);

          if (!isDrawing) {
            ctx.moveTo(x, y);
            isDrawing = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 2. Draw Radial Lines
      for (let j = 0; j < numberOfLines; j++) {
        const baseAngle = (j * Math.PI * 2) / numberOfLines;
        ctx.beginPath();
        let isDrawing = false;

        // Draw segmented line from core to outer edge
        const steps = 40;
        for (let k = 0; k <= steps; k++) {
          const baseR = (k * R_max) / steps;
          
          const twist = getTwistAngle(baseR);
          const warp = getWarpFactor(baseR);
          
          const finalAngle = baseAngle + twist;
          const finalR = baseR * warp;
          
          const x = holeX + finalR * Math.cos(finalAngle);
          const y = holeY + finalR * Math.sin(finalAngle);

          if (!isDrawing) {
            ctx.moveTo(x, y);
            isDrawing = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 3. Update & Draw Particles
      particles.forEach((p) => {
        // Move particle inward
        p.r -= p.vr;
        // Conservation of angular momentum: spin faster near center
        const spinSpeed = p.vTheta * (1.8 + 80 / Math.max(p.r, 5));
        p.theta += spinSpeed;

        // Reset particle if it falls into the singularity
        if (p.r < 12) {
          p.r = Math.random() * maxRadius + 30;
          p.theta = Math.random() * Math.PI * 2;
          p.alpha = Math.random() * 0.5 + 0.3;
        }

        const twist = getTwistAngle(p.r);
        const warp = getWarpFactor(p.r);
        
        const finalAngle = p.theta + twist;
        const finalR = p.r * warp;
        
        const px = holeX + finalR * Math.cos(finalAngle);
        const py = holeY + finalR * Math.sin(finalAngle);

        // Render particle if within boundaries
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const fade = Math.min((p.r - 12) / 40, 1); // Fade out as it reaches the center core
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleRGBColor[0]}, ${particleRGBColor[1]}, ${particleRGBColor[2]}, ${p.alpha * fade})`;
          ctx.fill();
        }
      });

      // 4. Draw Core Gravity Well Singularity
      const pulse = 1 + Math.sin(time * 3) * 0.08;
      const gradient = ctx.createRadialGradient(holeX, holeY, 2, holeX, holeY, 65 * pulse);
      
      if (isDark) {
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.18)');
        gradient.addColorStop(1, 'rgba(11, 15, 23, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
        gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(248, 250, 252, 0)');
      }
      
      ctx.beginPath();
      ctx.arc(holeX, holeY, 65 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Singularity core circle
      ctx.beginPath();
      ctx.arc(holeX, holeY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#121620' : '#ffffff';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [strokeColor, numberOfLines, numberOfDiscs, particleRGBColor]);

  return (
    <div ref={containerRef} className={className} {...props}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

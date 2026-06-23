'use client';

import React, { useRef, useEffect } from 'react';

export interface HoleBackgroundProps extends React.ComponentPropsWithoutRef<'div'> {
  strokeColor?: string;
  numberOfLines?: number;
  numberOfDiscs?: number;
  particleRGBColor?: [number, number, number];
  /** Reduce render resolution and frame rate for low-end devices */
  lowEndMode?: boolean;
}

interface Particle {
  r: number;
  theta: number;
  vr: number;
  vTheta: number;
  size: number;
  alpha: number;
  type?: 'tech' | 'brand';
}

export function HoleBackground({
  strokeColor = '#737373',
  numberOfLines = 50,
  numberOfDiscs = 50,
  particleRGBColor = [255, 255, 255],
  lowEndMode = false,
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
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

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
    // Low-end: half the particle count
    const particleCount = lowEndMode ? 60 : 120;
    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const r = Math.random() * maxRadius + 20;
      return {
        r,
        theta: Math.random() * Math.PI * 2,
        vr: Math.random() * 0.4 + 0.2,
        vTheta: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.2 + 1.0,
        alpha: Math.random() * 0.6 + 0.4,
        type: Math.random() > 0.35 ? 'tech' : 'brand',
      };
    });

    let time = 0;
    // Frame skip counter for 30fps throttle on low-end
    let frameSkip = 0;
    // Cache isDark to avoid DOM query every frame
    let isDark = document.documentElement.classList.contains('dark');
    const darkObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Low-end: skip every other frame (target ~30fps)
      if (lowEndMode) {
        frameSkip++;
        if (frameSkip % 2 !== 0) return;
      }

      time += lowEndMode ? 0.02 : 0.01;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse movement
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

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
        finalStrokeColor = isDark ? 'rgba(165, 180, 252, 0.22)' : 'rgba(79, 70, 229, 0.16)';
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
      // Low-end: fewer discs and half segment resolution
      const discsToDraw = lowEndMode ? Math.ceil(numberOfDiscs / 2) : numberOfDiscs;
      const discSpacing = R_max / discsToDraw;
      const segments = lowEndMode ? 36 : 72;
      for (let i = 1; i <= discsToDraw; i++) {
        const baseR = i * discSpacing;
        ctx.beginPath();
        let isDrawing = false;
        for (let s = 0; s <= segments; s++) {
          const angle = (s * Math.PI * 2) / segments;
          const twist = getTwistAngle(baseR);
          const warp = getWarpFactor(baseR);
          const finalAngle = angle + twist;
          const finalR = baseR * warp;
          const x = holeX + finalR * Math.cos(finalAngle);
          const y = holeY + finalR * Math.sin(finalAngle);
          if (!isDrawing) { ctx.moveTo(x, y); isDrawing = true; }
          else { ctx.lineTo(x, y); }
        }
        ctx.stroke();
      }

      // 2. Draw Radial Lines
      // Low-end: fewer lines and fewer steps per line
      const linesToDraw = lowEndMode ? Math.ceil(numberOfLines / 2) : numberOfLines;
      const steps = lowEndMode ? 20 : 40;
      for (let j = 0; j < linesToDraw; j++) {
        const baseAngle = (j * Math.PI * 2) / linesToDraw;
        ctx.beginPath();
        let isDrawing = false;
        for (let k = 0; k <= steps; k++) {
          const baseR = (k * R_max) / steps;
          const twist = getTwistAngle(baseR);
          const warp = getWarpFactor(baseR);
          const finalAngle = baseAngle + twist;
          const finalR = baseR * warp;
          const x = holeX + finalR * Math.cos(finalAngle);
          const y = holeY + finalR * Math.sin(finalAngle);
          if (!isDrawing) { ctx.moveTo(x, y); isDrawing = true; }
          else { ctx.lineTo(x, y); }
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
          
          let r = particleRGBColor[0];
          let g = particleRGBColor[1];
          let b = particleRGBColor[2];
          
          if (p.type === 'brand') {
            // Palm Oil Golden/Amber color matching PT INL portal style
            r = 245;
            g = 158;
            b = 11;
          } else if (!isDark) {
            // Override tech particles to golden amber color in light mode
            r = 217;
            g = 119;
            b = 6;
          }
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * fade * (isDark ? 0.95 : 0.8)})`;
          ctx.fill();
        }
      });

      // 4. Draw Core Gravity Well Singularity
      const pulse = 1 + Math.sin(time * 3) * 0.08;
      const glowRadius = 130 * pulse;
      const gradient = ctx.createRadialGradient(holeX, holeY, 2, holeX, holeY, glowRadius);
      
      if (isDark) {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.7)'); // Center glow is warm golden amber
        gradient.addColorStop(0.2, 'rgba(239, 68, 68, 0.4)'); // Reddish orange transition
        gradient.addColorStop(0.45, 'rgba(245, 158, 11, 0.25)'); // Golden Amber gravity field
        gradient.addColorStop(0.7, 'rgba(217, 119, 6, 0.08)'); // Darker Amber outer fade
        gradient.addColorStop(1, 'rgba(11, 15, 23, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)'); // Golden amber center
        gradient.addColorStop(0.2, 'rgba(249, 115, 22, 0.3)'); // Orange transition
        gradient.addColorStop(0.45, 'rgba(217, 119, 6, 0.18)'); // Golden Amber gravity field
        gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.05)'); // Lighter Amber outer fade
        gradient.addColorStop(1, 'rgba(248, 250, 252, 0)');
      }
      
      ctx.beginPath();
      ctx.arc(holeX, holeY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Singularity core circle
      ctx.beginPath();
      ctx.arc(holeX, holeY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#121620' : '#ffffff';
      ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      darkObserver.disconnect();
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [strokeColor, numberOfLines, numberOfDiscs, particleRGBColor, lowEndMode]);

  return (
    <div ref={containerRef} className={className} {...props}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

'use client';

import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
}

export default function GradientText({
  children,
  className = '',
  colors = ['from-indigo-500', 'via-purple-500', 'to-pink-500']
}: GradientTextProps) {
  const gradientClass = `bg-gradient-to-r ${colors.join(' ')}`;
  
  return (
    <span
      className={`inline-block text-transparent bg-clip-text ${gradientClass} bg-[length:200%_auto] animate-gradient-move ${className}`}
      style={{
        animation: 'gradient-move 4s ease infinite',
      }}
    >
      {children}
    </span>
  );
}

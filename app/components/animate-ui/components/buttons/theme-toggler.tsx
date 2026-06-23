'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export interface ThemeTogglerButtonProps {
  variant?: 'outline' | 'ghost' | 'solid' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  modes?: ('light' | 'dark' | 'system')[];
}

export function ThemeTogglerButton({
  variant = 'outline',
  size = 'md',
  direction = 'horizontal',
  modes = ['light', 'dark'],
}: ThemeTogglerButtonProps) {
  const [activeMode, setActiveMode] = useState<'light' | 'dark' | 'system'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const initialMode = savedTheme || 'system';
    
    // Fallback if system mode is not in the allowed modes list
    const finalMode = modes.includes(initialMode) ? initialMode : modes[0];
    
    setActiveMode(finalMode);
    applyTheme(finalMode);
  }, []);

  useEffect(() => {
    if (!mounted || activeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [mounted, activeMode]);

  const applyTheme = (mode: 'light' | 'dark' | 'system') => {
    localStorage.setItem('theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System mode
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
    setActiveMode(mode);
    applyTheme(mode);

    // Dispatch a custom event so other components can react instantly to theme change
    window.dispatchEvent(new Event('theme-change'));
  };

  if (!mounted) {
    return <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl h-10 w-24" />;
  }

  const activeIndex = modes.indexOf(activeMode);

  // Size styling classes
  const sizeClasses = {
    sm: {
      container: direction === 'horizontal' ? 'h-8 px-1 py-1' : 'w-8 px-1 py-1',
      button: 'p-1 text-xs',
      icon: 'h-3.5 w-3.5',
      label: 'text-[10px]',
    },
    md: {
      container: direction === 'horizontal' ? 'h-10 px-1 py-1' : 'w-10 px-1 py-1',
      button: 'p-1.5 text-sm',
      icon: 'h-4.5 w-4.5',
      label: 'text-xs',
    },
    lg: {
      container: direction === 'horizontal' ? 'h-12 px-1.5 py-1.5' : 'w-12 px-1.5 py-1.5',
      button: 'p-2 text-base',
      icon: 'h-5.5 w-5.5',
      label: 'text-sm',
    },
  }[size];

  // Variant styling classes
  const variantClasses = {
    outline: 'border border-slate-200/80 dark:border-slate-800/35 bg-white/40 dark:bg-[#121620]/45 backdrop-blur-md',
    ghost: 'bg-transparent',
    solid: 'bg-slate-100 dark:bg-slate-900/60',
    pill: 'rounded-full border border-slate-200/80 dark:border-slate-800/35 bg-white/40 dark:bg-[#121620]/45 backdrop-blur-md',
  }[variant];

  // Rounded classes (pill vs normal)
  const containerRounding = variant === 'pill' ? 'rounded-full' : 'rounded-2xl';
  const pillRounding = variant === 'pill' ? 'rounded-full' : 'rounded-xl';

  return (
    <div
      className={`relative flex ${
        direction === 'horizontal' ? 'flex-row' : 'flex-col'
      } ${containerRounding} ${variantClasses} ${sizeClasses.container} transition-all duration-300`}
      style={{
        width: direction === 'horizontal' ? `${modes.length * 36}px` : undefined,
        height: direction === 'vertical' ? `${modes.length * 36}px` : undefined,
      }}
    >
      {/* Sliding Active Background Pill */}
      {activeIndex !== -1 && (
        <div
          className={`absolute bg-white dark:bg-[#161b26] shadow-md border border-slate-100/50 dark:border-slate-800/40 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${pillRounding}`}
          style={
            direction === 'horizontal'
              ? {
                  top: '4px',
                  bottom: '4px',
                  width: `calc(${100 / modes.length}% - 8px)`,
                  transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 8}px))`,
                }
              : {
                  left: '4px',
                  right: '4px',
                  height: `calc(${100 / modes.length}% - 8px)`,
                  transform: `translateY(calc(${activeIndex * 100}% + ${activeIndex * 8}px))`,
                }
          }
        />
      )}

      {/* Buttons */}
      {modes.map((mode) => {
        const isSelected = activeMode === mode;
        return (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`relative z-10 flex flex-1 items-center justify-center cursor-pointer transition-colors duration-300 ${pillRounding} ${
              isSelected
                ? 'text-indigo-650 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            } ${sizeClasses.button} focus:outline-none`}
            title={mode.charAt(0).toUpperCase() + mode.slice(1)}
          >
            {mode === 'light' && <Sun className={sizeClasses.icon} />}
            {mode === 'dark' && <Moon className={sizeClasses.icon} />}
            {mode === 'system' && <Monitor className={sizeClasses.icon} />}
          </button>
        );
      })}
    </div>
  );
}

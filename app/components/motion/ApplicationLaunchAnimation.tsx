'use client';

import React, { useState, useCallback, useRef, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface LaunchState {
  appName: string;
  iconRect: DOMRect | null;
}

interface LaunchContextValue {
  launchApp: (opts: { 
    appName: string; 
    url: string; 
    iconElement?: HTMLElement | null; 
    openedWindow?: Window | null; 
    targetWindow?: Window | null; 
    icon?: string;
    skipRedirect?: boolean;
    onBeforeRedirect?: () => Promise<void>;
  }) => void;
  launchingApp: string | null;
}

const LaunchContext = createContext<LaunchContextValue>({
  launchApp: () => {},
  launchingApp: null,
});

export const useLaunchApp = () => useContext(LaunchContext);

export function ApplicationLaunchProvider({ children }: { children: React.ReactNode }) {
  const [launch, setLaunch] = useState<LaunchState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const launchApp = useCallback(
    async (opts: { 
      appName: string; 
      url: string; 
      iconElement?: HTMLElement | null; 
      openedWindow?: Window | null; 
      targetWindow?: Window | null; 
      icon?: string;
      skipRedirect?: boolean;
      onBeforeRedirect?: () => Promise<void>;
    }) => {
      const rect = opts.iconElement?.getBoundingClientRect() ?? null;
      const iconQuery = opts.icon ? `&icon=${encodeURIComponent(opts.icon)}` : '';
      const pendingUrl = `/launch?app=${encodeURIComponent(opts.appName)}${iconQuery}`;
      const activeWindow = opts.openedWindow ?? opts.targetWindow;
      const targetWindow = activeWindow ?? window.open(pendingUrl, '_blank');
      if (targetWindow) {
        targetWindow.opener = null;
      }

      setLaunch({ appName: opts.appName, iconRect: rect });

      if (opts.onBeforeRedirect) {
        try { await opts.onBeforeRedirect(); } catch {}
      }

      timeoutRef.current = setTimeout(() => {
        if (!opts.skipRedirect) {
          try {
            if (targetWindow && !targetWindow.closed) {
              targetWindow.location.href = opts.url;
            } else {
              window.location.href = opts.url;
            }
          } catch {
            window.location.href = opts.url;
          }
        }
        setTimeout(() => setLaunch(null), 200);
      }, 650);
    },
    []
  );

  return (
    <LaunchContext.Provider value={{ launchApp, launchingApp: launch?.appName ?? null }}>
      {children}
      <AnimatePresence>
        {launch && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              className="relative z-10 flex flex-col items-center gap-4"
              initial={{
                opacity: 0,
                scale: 0.7,
                y: launch.iconRect
                  ? launch.iconRect.top - window.innerHeight / 2 + launch.iconRect.height / 2
                  : 40,
                x: launch.iconRect
                  ? launch.iconRect.left - window.innerWidth / 2 + launch.iconRect.width / 2
                  : 0,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                x: 0,
              }}
              exit={{
                opacity: 0,
                scale: 1.15,
                filter: 'blur(12px)',
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/30 flex items-center justify-center"
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    '0 25px 50px -12px rgba(245, 158, 11, 0.3)',
                    '0 25px 50px -12px rgba(245, 158, 11, 0.5)',
                    '0 25px 50px -12px rgba(245, 158, 11, 0.3)',
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </motion.div>

              <motion.span
                className="text-sm font-bold text-white/90 tracking-wide"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Membuka {launch.appName}...
              </motion.span>

              <motion.div
                className="flex gap-1.5 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white/60"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LaunchContext.Provider>
  );
}

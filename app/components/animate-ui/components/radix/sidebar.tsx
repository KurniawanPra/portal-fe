'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PanelLeft } from 'lucide-react';

interface SidebarContextType {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange, className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [openState, setOpenState] = React.useState(defaultOpen);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (openProp === undefined) {
        setOpenState(value);
      }
      onOpenChange?.(value);
    },
    [openProp, onOpenChange]
  );

  const [openMobile, setOpenMobile] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen(!open);
    }
  }, [isMobile, open, setOpen]);

  const state: 'expanded' | 'collapsed' = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        ref={ref}
        style={{
          '--sidebar-width': '18rem',
          '--sidebar-width-icon': '5rem',
        } as React.CSSProperties}
        className={cn(
          'group/sidebar-wrapper flex min-h-screen w-full text-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = 'SidebarProvider';

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(({ collapsible = 'icon', className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-[var(--sidebar-width)] flex-col bg-white/70 dark:bg-[#121620]/80 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/35',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setOpenMobile(false)}
          />
        )}
        <div
          ref={ref}
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full w-[var(--sidebar-width)] flex-col bg-white dark:bg-[#121620] border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out',
            openMobile ? 'translate-x-0 animate-fade-in' : '-translate-x-full',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'hidden lg:flex h-full flex-col bg-white/75 dark:bg-[#121620]/85 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/35 transition-all duration-300 ease-in-out shrink-0 relative z-20',
        state === 'collapsed' ? 'w-[var(--sidebar-width-icon)]' : 'w-[var(--sidebar-width)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Sidebar.displayName = 'Sidebar';

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        toggleSidebar();
        onClick?.(e);
      }}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800/35 bg-white/95 dark:bg-[#161b26]/95 text-slate-500 hover:text-slate-850 dark:hover:text-white shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/25',
        className
      )}
      {...props}
    >
      <PanelLeft className="h-4.5 w-4.5" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative flex flex-1 flex-col overflow-hidden w-full', className)}
    {...props}
  >
    {children}
  </div>
));
SidebarInset.displayName = 'SidebarInset';

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800/30 transition-all duration-300',
        state === 'collapsed' ? 'p-2' : 'p-4',
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-1 flex-col gap-1 overflow-y-auto transition-all duration-300',
        state === 'collapsed' ? 'p-2' : 'p-4',
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800/30 bg-slate-50/10 dark:bg-[#0e1118]/10 transition-all duration-300',
        state === 'collapsed' ? 'p-2' : 'p-4',
        className
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors', className)} {...props} />
));
SidebarRail.displayName = 'SidebarRail';

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 py-2', className)} {...props} />
));
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  if (state === 'collapsed') return null;
  return (
    <div
      ref={ref}
      className={cn(
        'px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none mb-1',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('flex flex-col gap-1 list-none p-0 m-0', className)} {...props} />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('relative', className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    size?: 'sm' | 'md' | 'lg';
    tooltip?: string;
  }
>(({ asChild, size = 'md', tooltip, className, children, ...props }, ref) => {
  const { state } = useSidebar();

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-sm font-semibold',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
  };

  const buttonClass = cn(
    'flex items-center gap-3 rounded-xl border border-transparent transition-all duration-200 cursor-pointer w-full text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/25',
    sizeClasses[size],
    state === 'collapsed' && 'justify-center p-3.5',
    className
  );

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      ref,
      className: buttonClass,
      ...props,
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={buttonClass}
      onClick={handleClick}
      title={state === 'collapsed' ? tooltip : undefined}
      {...props}
    >
      {children}
    </button>
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  if (state === 'collapsed') return null;
  return (
    <ul
      ref={ref}
      className={cn(
        'pl-6 pr-2 py-1 flex flex-col gap-1 border-l border-slate-200 dark:border-slate-800/60 ml-4 list-none m-0',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuSub.displayName = 'SidebarMenuSub';

export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('relative', className)} {...props} />
));
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

export const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }
>(({ asChild, className, children, ...props }, ref) => {
  const subButtonClass = cn(
    'flex items-center rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer w-full text-left',
    className
  );

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      ref,
      className: subButtonClass,
      ...props,
    });
  }

  return (
    <a
      ref={ref}
      className={subButtonClass}
      {...props}
    >
      {children}
    </a>
  );
});
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { showOnHover?: boolean }
>(({ className, showOnHover, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-800/35 bg-white text-slate-400 hover:text-slate-800 transition-all opacity-0 group-hover/sidebar-menu-item:opacity-100 cursor-pointer focus:outline-none',
      !showOnHover && 'opacity-100',
      className
    )}
    {...props}
  />
));
SidebarMenuAction.displayName = 'SidebarMenuAction';

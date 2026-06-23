'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null);

export function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
}

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  asChild?: boolean;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ defaultOpen = false, open: openProp, onOpenChange, asChild, children, className, ...props }, ref) => {
    const [openState, setOpenState] = React.useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp! : openState;

    const setOpen = React.useCallback(
      (newOpen: boolean) => {
        if (!isControlled) {
          setOpenState(newOpen);
        }
        onOpenChange?.(newOpen);
      },
      [isControlled, onOpenChange]
    );

    const contextValue = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);

    const childProps = asChild ? (children as React.ReactElement).props : {};

    return (
      <CollapsibleContext.Provider value={contextValue}>
        {asChild ? (
          React.cloneElement(children as React.ReactElement, {
            ref,
            className: cn(className, childProps.className),
            'data-state': open ? 'open' : 'closed',
            ...props,
          })
        ) : (
          <div
            ref={ref}
            className={className}
            data-state={open ? 'open' : 'closed'}
            {...props}
          >
            {children}
          </div>
        )}
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = 'Collapsible';

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild, children, onClick, className, ...props }, ref) => {
    const { open, setOpen } = useCollapsible();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(!open);
      onClick?.(e);
    };

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        ref,
        onClick: handleClick,
        'data-state': open ? 'open' : 'closed',
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={className}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ asChild, children, className, ...props }, ref) => {
    const { open } = useCollapsible();

    if (!open) return null;

    const childProps = asChild ? (children as React.ReactElement).props : {};

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        ref,
        className: cn(className, childProps.className),
        'data-state': open ? 'open' : 'closed',
        ...props,
      });
    }

    return (
      <div
        ref={ref}
        className={cn('transition-all duration-300 overflow-hidden', className)}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CollapsibleContent.displayName = 'CollapsibleContent';

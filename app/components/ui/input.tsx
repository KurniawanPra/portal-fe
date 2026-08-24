import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-slate-200/80 bg-slate-100/80 px-3.5 py-2 text-sm font-semibold text-slate-800 transition-all duration-200 outline-none",
        "shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]",
        "dark:border-white/[0.06] dark:bg-[#111622] dark:text-slate-100",
        "dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "focus-visible:border-amber-500/60 focus-visible:bg-white dark:focus-visible:bg-[#141a28]",
        "focus-visible:shadow-[inset_2px_2px_4px_rgba(245,158,11,0.12),2px_2px_6px_rgba(15,23,42,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)]",
        "dark:focus-visible:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_4px_rgba(245,158,11,0.25)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }

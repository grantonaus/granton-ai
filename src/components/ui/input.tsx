import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:font-medium placeholder:text-muted-foreground bg-[#0E0E0E] selection:text-primary-foreground dark:bg-input/30 border-[1px] border-input flex h-11 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-[15px]",
        "hover:border-[#2a2a2a] focus-visible:border-[#2a2a2a] focus-visible:outline-none",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

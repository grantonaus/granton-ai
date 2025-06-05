import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[1px] border-input placeholder:text-muted-foreground focus-visible:border-[#68FCF2] focus-visible:ring-[#68FCF2]/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-18 w-full rounded-md bg-[#0E0E0E] px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

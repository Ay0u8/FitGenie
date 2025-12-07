import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground",
        "flex field-sizing-content min-h-16 w-full rounded-md border bg-slate-900/70 px-3 py-2 text-sm shadow-xs transition-[color,box-shadow]",
        "border-slate-700 text-slate-100",
        "outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

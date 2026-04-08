import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "font-[inherit] py-3 px-4 text-base leading-snug border-2 border-border rounded block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-purple focus:border-purple focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-30",
        className
      )}
      {...props}
    />
  )
}

export { Input }

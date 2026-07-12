"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-primary border-border border-2 border-b-4 active:border-b-2 hover:bg-[#f7f7f7]",

        // custom
        locked: "bg-neutral-200 text-primary-foreground hover:bg-neutral-200/90 border-neutral-400 border-b-4 active:border-b-0",

        primary: "bg-sky-400 text-primary-foreground hover:bg-sky-400/90 border-sky-500 border-b-4 active:border-b-0",
        primaryOutline: "bg-white text-[#1cb0f6] hover:bg-[#f7f7f7]",

        secondary: "bg-[#58cc02] text-primary-foreground hover:bg-[#58cc02]/90 border-[#0003] border-b-4 active:border-b-0",
        secondaryOutline: "bg-white text-[#58cc02] hover:bg-[#f7f7f7]",

        danger: "bg-rose-500 text-primary-foreground hover:bg-rose-500/90 border-rose-600 border-b-4 active:border-b-0",
        dangerOutline: "bg-white text-rose-500 hover:bg-[#f7f7f7]",

        super: "bg-indigo-500 text-primary-foreground hover:bg-indigo-500/90 border-indigo-600 border-b-4 active:border-b-0",
        superOutline: "bg-white text-indigo-500 hover:bg-[#f7f7f7]",

        ghost:"bg-transparent text-[#777] border-transparent border-0 hover:bg-[#f7f7f7]",

        sidebar: "bg-transparent text-[#777] border-2 border-transparent hover:bg-[#f7f7f7] transition-none",
        sidebarOutline: "bg-sky-500/15 text-sky-500 border-sky-300 border-2 hover:bg-sky-500/20 transition-none",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3 text-base",
        sm: "h-10 gap-1.5 px-3 has-[>svg]:px-2.5",
        xs: "h-8 gap-1 px-2 has-[>svg]:px-1.5 text-sm",
        lg: "h-13 px-3 has-[>svg]:px-4 text-lg gap-3",
        icon: "size-8",
        iconLg: "size-13",
        smRounded: "h-10 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

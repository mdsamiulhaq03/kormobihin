import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Playful Geometric buttons: pills with an ink outline. "default" is the candy button
// (hard shadow that lifts on hover and presses on click, with a little overshoot).
const lift =
  "shadow-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-pop-press aria-expanded:shadow-pop-press"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border-2 border-transparent text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-300 ease-bounce outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-invalid:border-destructive motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `border-ink bg-primary text-primary-foreground ${lift}`,
        outline: `border-ink bg-card text-foreground hover:bg-sun aria-expanded:bg-sun`,
        secondary: "bg-muted text-secondary-foreground hover:bg-sun/60",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "border-destructive bg-card text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/40",
        link: "rounded-md border-0 text-primary underline decoration-2 underline-offset-4 hover:decoration-sun",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        // Small sizes grow to a 40px touch target on touch screens; mouse users keep them compact.
        xs: "h-7 gap-1 px-2.5 text-xs pointer-coarse:h-10 pointer-coarse:px-3.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs pointer-coarse:h-10 pointer-coarse:px-4 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7 pointer-coarse:size-10 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 pointer-coarse:size-10",
        "icon-lg": "size-11",
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
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

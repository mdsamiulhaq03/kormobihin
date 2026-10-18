import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg border-2 border-ink/10 bg-sun/15", className)}
      {...props}
    />
  )
}

export { Skeleton }

import { cn } from "cn"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-sibs-pulse rounded-md bg-sibs-tertiary-9 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }

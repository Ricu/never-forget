import { cn } from "@/shared/lib/utils"

export type ButtonVariant = "default" | "ghost"
export type ButtonSize = "default" | "sm" | "icon"

type ButtonVariantOptions = {
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  ghost: "hover:bg-accent hover:text-accent-foreground",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3",
  icon: "size-9",
}

export function buttonVariants({
  className,
  size = "default",
  variant = "default",
}: ButtonVariantOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

import type { ButtonHTMLAttributes } from "react"

import {
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "@/shared/ui/button-variants"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

export function Button({
  className,
  size,
  variant,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      className={buttonVariants({ className, size, variant })}
      {...props}
    />
  )
}

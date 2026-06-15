"use client"

import type { CSSProperties, ElementType } from "react"
import { createElement, memo } from "react"

import { cn } from "@/shared/lib/utils"

export interface TextShimmerProps {
  children: string
  as?: ElementType
  className?: string
  duration?: number
  spread?: number
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const dynamicSpread = (children?.length ?? 0) * spread

  return createElement(
    Component,
    {
      className: cn(
        "relative inline-block animate-pulse bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className,
      ),
      style: {
        "--spread": `${dynamicSpread}px`,
        animationDuration: `${duration}s`,
        backgroundImage:
          "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
      } as CSSProperties,
    },
    children,
  )
}

export const Shimmer = memo(ShimmerComponent)

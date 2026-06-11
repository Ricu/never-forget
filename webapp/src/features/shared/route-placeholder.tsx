type RoutePlaceholderProps = {
  eyebrow: string
  title: string
  summary: string
}

export function RoutePlaceholder({
  eyebrow,
  title,
  summary,
}: RoutePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <p className="mb-2 text-xs text-[var(--app-ink-muted)]">{eyebrow}</p>
        <h1 className="text-[clamp(26px,4vw,38px)] font-semibold leading-[1.08] text-[var(--app-ink)]">
          {title}
        </h1>
      </div>

      <article className="rounded-[10px] border border-[var(--app-hairline)] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),transparent),var(--app-surface-1)] p-5 sm:p-6">
        <p className="max-w-2xl text-sm leading-7 text-[var(--app-ink-muted)]">
          {summary}
        </p>
      </article>
    </section>
  )
}

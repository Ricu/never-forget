import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card"

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

      <Card>
        <CardHeader>
          <CardTitle>Planned Surface</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="max-w-2xl">{summary}</CardDescription>
        </CardContent>
      </Card>
    </section>
  )
}

type RoutePlaceholderProps = {
  title: string
  summary: string
  boundary: string
  nextSlice: string
}

export function RoutePlaceholder({
  title,
  summary,
  boundary,
  nextSlice,
}: RoutePlaceholderProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.9fr)]">
      <article className="rounded-[1.8rem] border border-stone-900/10 bg-white p-6 shadow-[0_20px_50px_rgba(84,56,28,0.08)] sm:p-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-amber-700">
          Placeholder
        </p>
        <h3 className="mt-3 font-['Fraunces',_Georgia,_serif] text-4xl text-stone-950">
          {title}
        </h3>
        <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
          {summary}
        </p>
      </article>

      <aside className="rounded-[1.8rem] border border-stone-900/10 bg-stone-950 p-6 text-stone-100 shadow-[0_20px_50px_rgba(34,21,7,0.18)]">
        <div className="space-y-5">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-400">
              Scope boundary
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300">{boundary}</p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-400">
              Next slice
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300">{nextSlice}</p>
          </div>
        </div>
      </aside>
    </section>
  )
}

import { Sparkles } from 'lucide-react'

type LockedPaywallProps = {
  title: string
  description: string
  bullets: string[]

  authorLine?: string
  badgeLabel?: string
}

export function LockedPaywall({ title, description, bullets, authorLine, badgeLabel }: LockedPaywallProps) {
  const pillLabel = badgeLabel ?? authorLine ?? title

  return (
    <section className="text-foreground relative isolate overflow-hidden px-2 py-12 text-center sm:-mt-16 sm:px-4 sm:py-16">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 sm:gap-6">
        <div className="bg-primary/10 text-primary dark:bg-primary/15 rounded-full px-4 py-1 text-[11px] font-semibold tracking-[0.34em] uppercase shadow-none">
          {pillLabel}
        </div>
        <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h2>
        <p className="text-muted-foreground text-base sm:text-lg">{description}</p>
        <div className="mt-2 grid w-full gap-4 text-left sm:mt-4 sm:grid-cols-2">
          {bullets.map((bullet, index) => (
            <div
              key={`${bullet}-${index}`}
              className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60"
            >
              <div className="bg-primary/10 text-primary dark:bg-primary/15 mt-0.5 flex h-9 w-9 items-center justify-center rounded-full">
                <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <p className="text-base text-slate-700 dark:text-slate-100">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

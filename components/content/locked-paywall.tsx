type LockedPaywallProps = {
  title: string
  description: string
  authorLine?: string
  badgeLabel?: string
}

export function LockedPaywall({ title, description, authorLine, badgeLabel }: LockedPaywallProps) {
  const pillLabel = badgeLabel ?? authorLine ?? title

  return (
    <section className="text-foreground relative isolate overflow-hidden px-2 text-center sm:px-4">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 sm:gap-6">
        <div className="bg-primary/10 text-primary dark:bg-primary/15 rounded-full px-4 py-1 text-[11px] font-semibold tracking-[0.34em] uppercase shadow-none">
          {pillLabel}
        </div>
        <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h2>
        <p className="text-muted-foreground text-base sm:text-lg">{description}</p>
      </div>
    </section>
  )
}

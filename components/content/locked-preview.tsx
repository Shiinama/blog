import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { Badge } from '@/components/ui/badge'

type LockedPreviewProps = {
  content: string
  label: string
  description?: string
}

export function LockedPreview({ content, label, description }: LockedPreviewProps) {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="relative z-0 space-y-3 sm:space-y-4">
        <Badge className="bg-primary/10 text-primary dark:bg-primary/15 border-transparent px-4 py-1 text-[11px] font-semibold tracking-[0.28em] uppercase shadow-none">
          {label}
        </Badge>
        {description && <p className="text-muted-foreground text-sm sm:text-base">{description}</p>}
        <div
          className="prose prose-lg dark:prose-invert max-w-none text-slate-800/90 dark:text-slate-100/85"
          style={{
            WebkitMaskImage:
              'linear-gradient(180deg, #fff 0%, #fff 52%, rgba(255,255,255,0.85) 72%, rgba(255,255,255,0) 100%)',
            maskImage:
              'linear-gradient(180deg, #fff 0%, #fff 52%, rgba(255,255,255,0.85) 72%, rgba(255,255,255,0) 100%)'
          }}
        >
          <MarkdownRenderer content={content} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-white/50 via-white/0 to-white/95 dark:from-slate-950/40 dark:via-slate-950/10 dark:to-slate-950/95" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-linear-to-b from-transparent via-white/92 to-white backdrop-blur-[2px] dark:via-slate-950/85 dark:to-slate-950" />
    </div>
  )
}

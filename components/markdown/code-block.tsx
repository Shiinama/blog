'use client'

import { Check, Copy } from 'lucide-react'
import { useRef, useState } from 'react'

/** Server-highlighted `<pre>` with a copy button — the only client code in an article. */
export function CodeBlock({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Copy code"
        onClick={async () => {
          await navigator.clipboard.writeText(ref.current?.textContent ?? '')
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="text-muted-foreground hover:text-foreground bg-background/80 absolute top-2 right-2 rounded-md border p-1.5 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  )
}

import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

function isBlockCode(className?: string | null) {
  if (!className) return false
  return /language-|lang-/.test(className)
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  if (isBlockCode(className)) {
    return (
      <pre className="mb-6 overflow-x-auto rounded-lg bg-muted/50 p-4 text-sm">
        <code className={cn('block font-mono text-sm', className)}>{children}</code>
      </pre>
    )
  }

  return <code className={cn('rounded bg-muted px-1.5 py-0.5 text-xs font-mono', className)}>{children}</code>
}

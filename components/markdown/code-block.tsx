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
      <pre>
        <code className={cn('block', className)}>{children}</code>
      </pre>
    )
  }

  return <code className={cn(className)}>{children}</code>
}

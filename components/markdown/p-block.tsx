interface ParagraphProps {
  children: React.ReactNode
}

export function Paragraph({ children }: ParagraphProps) {
  if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'object') {
    return <>{children}</>
  }

  return <p>{children}</p>
}

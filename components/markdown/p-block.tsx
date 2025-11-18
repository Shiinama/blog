import { Children, ComponentType, ReactNode, isValidElement } from 'react'

import { ImageBlock } from './image-block'
import { VideoBlock } from './video-block'

interface ParagraphProps {
  children: React.ReactNode
}

const blockComponents = new Set<ComponentType>([ImageBlock, VideoBlock])

function isBlockComponent(node: ReactNode) {
  return isValidElement(node) && blockComponents.has(node.type as ComponentType)
}

export function Paragraph({ children }: ParagraphProps) {
  const childArray = Children.toArray(children)

  if (childArray.length === 0) {
    return null
  }

  const segments: ReactNode[] = []
  let inlineBuffer: ReactNode[] = []

  const flushBuffer = () => {
    if (inlineBuffer.length > 0) {
      const paragraph = <p key={`paragraph-${segments.length}`}>{inlineBuffer}</p>
      segments.push(paragraph)
      inlineBuffer = []
    }
  }

  childArray.forEach((child) => {
    if (isBlockComponent(child)) {
      flushBuffer()
      segments.push(child)
    } else {
      inlineBuffer.push(child)
    }
  })

  flushBuffer()

  if (segments.length === 1) {
    return <>{segments[0]}</>
  }

  return <>{segments}</>
}

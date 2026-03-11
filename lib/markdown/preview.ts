function countWords(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }

  return trimmed.split(/\s+/).length
}

function splitMarkdownBlocks(content: string) {
  const lines = content.trim().split('\n')
  const blocks: string[] = []
  let currentBlock: string[] = []
  let inFence = false
  let fenceMarker = ''

  const pushCurrentBlock = () => {
    if (!currentBlock.length) {
      return
    }

    blocks.push(currentBlock.join('\n').trimEnd())
    currentBlock = []
  }

  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(```|~~~)/)

    if (fenceMatch) {
      const marker = fenceMatch[2]!
      if (!inFence) {
        inFence = true
        fenceMarker = marker
      } else if (marker === fenceMarker) {
        inFence = false
        fenceMarker = ''
      }
    }

    if (!inFence && line.trim() === '') {
      pushCurrentBlock()
      continue
    }

    currentBlock.push(line)
  }

  pushCurrentBlock()

  return blocks
}

export function buildSafePreviewContent(content: string, ratio = 0.3) {
  const trimmed = content.trim()
  if (!trimmed) {
    return ''
  }

  const totalWords = countWords(trimmed)
  if (totalWords <= 1) {
    return trimmed
  }

  const targetWords = Math.max(1, Math.floor(totalWords * ratio))
  const blocks = splitMarkdownBlocks(trimmed)

  const previewBlocks: string[] = []
  let collectedWords = 0

  for (const block of blocks) {
    const blockWords = countWords(block)
    if (!blockWords) {
      continue
    }

    if (previewBlocks.length > 0 && collectedWords >= targetWords) {
      break
    }

    previewBlocks.push(block)
    collectedWords += blockWords
  }

  return previewBlocks.join('\n\n').trim()
}

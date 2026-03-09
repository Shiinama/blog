import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

export function createEditorMarkdownParser() {
  return new MarkdownIt({
    html: true,
    linkify: true,
    // Avoid mutating ASCII quotes/dashes into typographic punctuation on every save.
    typographer: false
  })
}

export function createEditorMarkdownSerializer() {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  })

  service.use(gfm)

  service.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement(content) {
      return `~~${content}~~`
    }
  })

  service.addRule('taskListItems', {
    filter(node) {
      return node.nodeName === 'LI' && /^\s*\[[ xX]\]\s+/.test(node.textContent ?? '')
    },
    replacement(_content, node, options) {
      const text = (node.textContent ?? '').trim()
      const match = text.match(/^\[([ xX])\]\s+(.*)$/)

      if (!match) {
        return ''
      }

      const checked = match[1]!.toLowerCase() === 'x' ? 'x' : ' '
      const body = match[2]!.trim()
      const bullet = options.bulletListMarker || '-'

      return `${bullet} [${checked}] ${body}\n`
    }
  })

  return service
}

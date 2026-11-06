import 'server-only'

// Full-width punctuation that breaks Markdown syntax after machine translation.
const FULLWIDTH: [RegExp, string][] = [
  [/＃/g, '#'],
  [/（/g, '('],
  [/）/g, ')'],
  [/【/g, '['],
  [/】/g, ']'],
  [/｛/g, '{'],
  [/｝/g, '}']
]

/** Machine-translate Markdown/plain text via Google Translate's public endpoint. */
export async function translateText(text: string, from: string, to: string): Promise<string> {
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.search = new URLSearchParams({ client: 'gtx', dt: 't', sl: from, tl: to }).toString()

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ q: text })
  })
  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as [[string, ...unknown[]][]]
  const translated = (data?.[0] ?? [])
    .map((segment) => segment?.[0] ?? '')
    .join('')
    .trim()
  if (!translated) throw new Error('Translation returned no text')

  return FULLWIDTH.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), translated)
}

import 'server-only'

function extractApiKey(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim()
  }
  return request.headers.get('x-api-key')?.trim() ?? ''
}

function constantTimeEqual(a: string, b: string) {
  const encoder = new TextEncoder()
  const left = encoder.encode(a)
  const right = encoder.encode(b)
  if (left.byteLength !== right.byteLength) return false
  let diff = 0
  for (let i = 0; i < left.byteLength; i++) diff |= left[i]! ^ right[i]!
  return diff === 0
}

/** True when the request carries `expectedKey` via `Authorization: Bearer` or `x-api-key`. */
export function hasValidApiKey(request: Request, expectedKey: string | undefined) {
  const expected = expectedKey?.trim()
  if (!expected) return false
  const provided = extractApiKey(request)
  return Boolean(provided) && constantTimeEqual(provided, expected)
}

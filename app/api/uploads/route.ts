import { getBucket } from '@/lib/db'
import { isAdminRequest } from '@/lib/session'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg'
}

/** Admin image upload → R2, content-addressed so re-uploads are free. */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const file = (await request.formData()).get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }
  const extension = EXTENSIONS[file.type]
  if (!extension) {
    return Response.json({ error: 'Unsupported image type' }, { status: 415 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: 'File is too large' }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const hash = Buffer.from(await crypto.subtle.digest('SHA-256', bytes)).toString('hex')
  const key = `uploads/${hash}.${extension}`

  const bucket = await getBucket()
  if (!(await bucket.head(key))) {
    await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } })
  }

  const base = process.env.NEXT_PUBLIC_R2_DOMAIN?.replace(/\/+$/, '')
  return Response.json({ key, url: base ? `${base}/${key}` : key })
}

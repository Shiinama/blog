import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { getR2Bucket } from '@/lib/r2'

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
const HASH_PREFIX_LENGTH = 2

function isAdmin(userId?: string | null) {
  if (!userId) return false
  const ids = process.env.NEXT_PUBLIC_ADMIN_ID?.split(',').map((id) => id.trim())
  return ids?.includes(userId) ?? false
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getExtension(file: File) {
  const byName = file.name.split('.').pop()
  if (byName && byName.length <= 5) {
    return byName.toLowerCase()
  }
  const mimeExt = file.type.split('/').pop()
  return mimeExt || 'bin'
}

function buildObjectKey(file: File, hashHex: string) {
  const ext = getExtension(file)
  const prefix = hashHex.slice(0, HASH_PREFIX_LENGTH)
  return `uploads/${prefix}/${hashHex}.${ext}`
}

function buildPublicUrl(key: string) {
  const base = (process.env.NEXT_PUBLIC_R2_DOMAIN || '').replace(/\/+$/, '')
  if (!base) return key
  return `${base}/${key}`
}

export async function POST(request: Request) {
  const session = await auth()
  if (!isAdmin(session?.user?.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 })
  }

  const fileBuffer = await file.arrayBuffer()
  if (fileBuffer.byteLength > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'File is too large' }, { status: 413 })
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
  const hashHex = toHex(hashBuffer)

  const objectKey = buildObjectKey(file, hashHex)
  const bucket = getR2Bucket()

  const existing = await bucket.head(objectKey)

  if (!existing) {
    await bucket.put(objectKey, fileBuffer, {
      httpMetadata: { contentType: file.type }
    })
  }

  const url = buildPublicUrl(objectKey)

  return NextResponse.json({ key: objectKey, url })
}

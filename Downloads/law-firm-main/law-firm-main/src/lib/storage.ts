import { randomUUID } from 'crypto'
import { unlink, mkdir, writeFile } from 'fs/promises'
import { basename, extname, join, resolve } from 'path'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function clean(value?: string | null) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

function sanitizeFileName(name: string) {
  const safe = basename(name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-')
  return safe || 'upload'
}

function getExtension(name: string, contentType?: string) {
  const ext = extname(name)
  if (ext) return ext
  if (contentType === 'image/jpeg') return '.jpg'
  if (contentType === 'image/png') return '.png'
  if (contentType === 'image/webp') return '.webp'
  if (contentType === 'image/gif') return '.gif'
  if (contentType === 'image/svg+xml') return '.svg'
  if (contentType === 'application/pdf') return '.pdf'
  return ''
}

function joinUrl(base: string, key: string) {
  const root = base.endsWith('/') ? base : `${base}/`
  return new URL(key.replace(/^\/+/, ''), root).toString()
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

export function sanitizeConfigValue(value?: string | null) {
  return clean(value)
}

export function getR2Config(): R2Config | null {
  const accountId = clean(process.env.R2_ACCOUNT_ID)
  const accessKeyId = clean(process.env.R2_ACCESS_KEY_ID)
  const secretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY)
  const bucketName = clean(process.env.R2_BUCKET_NAME)
  const publicUrl = clean(process.env.R2_PUBLIC_URL)

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  }
}

let r2Client: S3Client | null = null

function getR2Client() {
  if (r2Client) return r2Client
  const config = getR2Config()
  if (!config) return null

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return r2Client
}

export function buildR2PublicUrl(key: string) {
  const config = getR2Config()
  if (!config) return null
  return joinUrl(config.publicUrl, key)
}

export function getStorageKey(prefix: string, fileName: string, contentType?: string) {
  const safePrefix = prefix.replace(/^\/+|\/+$/g, '')
  const safeName = sanitizeFileName(fileName)
  const ext = getExtension(safeName, contentType)
  const baseName = ext && !safeName.toLowerCase().endsWith(ext) ? safeName.replace(/(\.[^.]+)?$/, '') : safeName
  return `${safePrefix}/${Date.now()}-${randomUUID().slice(0, 8)}-${baseName}${ext}`
}

export async function uploadFile(input: {
  file: File
  prefix: string
  localDirectory: string
  publicUrlPrefix: string
  allowedTypes?: string[]
}) {
  const { file, prefix, localDirectory, publicUrlPrefix, allowedTypes } = input
  if (allowedTypes?.length) {
    const ext = file.name ? file.name.toLowerCase() : ''
    const allowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1))
      return file.type === type || ext.endsWith(type.replace(/^[^.]+/, '')) || ext.endsWith(type)
    })
    if (!allowed) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const config = getR2Config()
  const storageKey = getStorageKey(prefix, file.name || 'upload', file.type)

  if (config) {
    const client = getR2Client()
    if (!client) throw new Error('R2 client unavailable')

    await client.send(new PutObjectCommand({
      Bucket: config.bucketName,
      Key: storageKey,
      Body: bytes,
      ContentType: file.type || 'application/octet-stream',
    }))

    const publicUrl = buildR2PublicUrl(storageKey)
    if (!publicUrl) throw new Error('R2 public URL is not configured')

    return {
      storage: 'r2' as const,
      key: storageKey,
      url: publicUrl,
      size: bytes.byteLength,
      contentType: file.type || 'application/octet-stream',
    }
  }

  const fileName = storageKey.split('/').pop() || sanitizeFileName(file.name || 'upload')
  const targetDirectory = resolve(process.cwd(), localDirectory)
  await mkdir(targetDirectory, { recursive: true })
  await writeFile(join(targetDirectory, fileName), bytes)

  return {
    storage: 'local' as const,
    key: `${prefix.replace(/^\/+|\/+$/g, '')}/${fileName}`,
    url: `${publicUrlPrefix.replace(/\/+$/, '')}/${fileName}`,
    size: bytes.byteLength,
    contentType: file.type || 'application/octet-stream',
  }
}

export async function deleteStoredFile(fileUrl?: string | null) {
  const value = clean(fileUrl)
  if (!value) return

  const config = getR2Config()
  const publicBase = config?.publicUrl ? new URL(config.publicUrl) : null

  if (config && isAbsoluteUrl(value)) {
    try {
      const parsed = new URL(value)
      if (!publicBase || parsed.host === publicBase.host) {
        const key = parsed.pathname.replace(/^\/+/, '')
        if (key) {
          const client = getR2Client()
          if (client) {
            await client.send(new DeleteObjectCommand({
              Bucket: config.bucketName,
              Key: key,
            }))
          }
          return
        }
      }
    } catch {
      // fall through to local handling
    }
  }

  if (value.startsWith('/')) {
    const localPath = resolve(process.cwd(), 'public', value.replace(/^\/+/, ''))
    await unlink(localPath).catch(() => {})
  }
}

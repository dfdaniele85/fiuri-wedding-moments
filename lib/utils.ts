import { z } from 'zod'

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/mpeg',
  'video/webm',
  'video/3gpp',
  'video/x-msvideo',
]

export const IMAGE_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/heic', 'image/heif',
]

export const VIDEO_MIME_TYPES = [
  'video/mp4', 'video/quicktime', 'video/mpeg',
  'video/webm', 'video/3gpp', 'video/x-msvideo',
]

export function getFileType(mimeType: string): 'photo' | 'video' | 'other' {
  if (IMAGE_MIME_TYPES.includes(mimeType)) return 'photo'
  if (VIDEO_MIME_TYPES.includes(mimeType)) return 'video'
  return 'other'
}

export function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export function sanitizeGuestName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50) || 'anonimo'
}

export function buildStoragePath(
  eventSlug: string,
  guestName: string | null,
  fileId: string,
  filename: string
): string {
  const safeSlug = eventSlug.replace(/[^a-zA-Z0-9-]/g, '-')
  const date = new Date().toISOString().split('T')[0]
  const safeName = guestName ? sanitizeGuestName(guestName) : 'anonimo'
  const safeFilename = sanitizeFilename(filename)
  return `events/${safeSlug}/${date}/${safeName}/${fileId}-${safeFilename}`
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug non valido').min(2).max(60)
export const accessCodeSchema = z.string().min(4).max(20)
export const guestNameSchema = z.string().max(80).optional()

export function getMaxFileSizeBytes(): number {
  const mb = parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10)
  return mb * 1024 * 1024
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

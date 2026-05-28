export interface Event {
  id: string
  slug: string
  title: string
  access_code: string
  is_active: boolean
  created_at: string
}

export interface MediaUpload {
  id: string
  event_id: string
  guest_name: string | null
  original_filename: string
  storage_path: string
  file_type: 'photo' | 'video' | string
  mime_type: string
  size_bytes: number
  upload_status: string
  created_at: string
  user_agent: string | null
}

export interface UploadFile {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

export interface AdminSession {
  authenticated: boolean
}

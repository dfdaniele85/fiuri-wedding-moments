import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import {
  ALLOWED_MIME_TYPES,
  getFileType,
  buildStoragePath,
  getMaxFileSizeBytes,
  slugSchema,
  accessCodeSchema,
  guestNameSchema,
  sanitizeFilename,
} from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const slug = formData.get('slug') as string
    const code = formData.get('code') as string
    const guestName = (formData.get('guestName') as string) || null
    const file = formData.get('file') as File | null

    const slugResult = slugSchema.safeParse(slug)
    const codeResult = accessCodeSchema.safeParse(code)
    const guestNameResult = guestNameSchema.safeParse(guestName ?? undefined)

    if (!slugResult.success || !codeResult.success) {
      return NextResponse.json({ error: 'Parametri non validi.' }, { status: 400 })
    }

    if (!guestNameResult.success) {
      return NextResponse.json({ error: 'Nome non valido.' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'Nessun file ricevuto.' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo di file non supportato: ${file.type}` },
        { status: 400 }
      )
    }

    const maxBytes = getMaxFileSizeBytes()
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File troppo grande. Massimo ${process.env.MAX_FILE_SIZE_MB || 500} MB.` },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, is_active, access_code')
      .eq('slug', slugResult.data)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento non trovato.' }, { status: 404 })
    }

    if (!event.is_active) {
      return NextResponse.json({ error: 'Evento non attivo.' }, { status: 403 })
    }

    if (event.access_code !== codeResult.data) {
      return NextResponse.json({ error: 'Codice non valido.' }, { status: 403 })
    }

    const fileId = crypto.randomUUID()
    const safeFilename = sanitizeFilename(file.name)
    const storagePath = buildStoragePath(slugResult.data, guestName, fileId, safeFilename)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('wedding-media')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Errore durante il caricamento.' }, { status: 500 })
    }

    const fileType = getFileType(file.type)
    const userAgent = req.headers.get('user-agent') || null

    const { error: dbError } = await supabase.from('media_uploads').insert({
      id: fileId,
      event_id: event.id,
      guest_name: guestName || null,
      original_filename: file.name.substring(0, 255),
      storage_path: storagePath,
      file_type: fileType,
      mime_type: file.type,
      size_bytes: file.size,
      upload_status: 'completed',
      user_agent: userAgent,
    })

    if (dbError) {
      console.error('DB insert error:', dbError)
      await supabase.storage.from('wedding-media').remove([storagePath])
      return NextResponse.json({ error: 'Errore nel salvataggio.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: fileId })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }
}


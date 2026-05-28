import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedFromRequest } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { formatBytes, formatDate } from '@/lib/utils'

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'eventId richiesto.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: uploads, error } = await supabase
    .from('media_uploads')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['ID', 'Nome ospite', 'File originale', 'Tipo', 'MIME', 'Dimensione', 'Path storage', 'Data upload']
  const rows = (uploads || []).map((u) => [
    u.id,
    u.guest_name || 'Anonimo',
    u.original_filename,
    u.file_type,
    u.mime_type,
    formatBytes(u.size_bytes),
    u.storage_path,
    formatDate(u.created_at),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="uploads-${eventId}.csv"`,
    },
  })
}

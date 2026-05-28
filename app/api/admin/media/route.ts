import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedFromRequest } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('eventId')
  const fileType = searchParams.get('fileType')
  const guestName = searchParams.get('guestName')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (!eventId) {
    return NextResponse.json({ error: 'eventId richiesto.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  let query = supabase
    .from('media_uploads')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (fileType && fileType !== 'all') {
    query = query.eq('file_type', fileType)
  }
  if (guestName) {
    query = query.ilike('guest_name', `%${guestName}%`)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59Z')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

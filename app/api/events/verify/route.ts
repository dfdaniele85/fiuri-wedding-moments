import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { slugSchema, accessCodeSchema } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slugResult = slugSchema.safeParse(body.slug)
    const codeResult = accessCodeSchema.safeParse(body.code)

    if (!slugResult.success || !codeResult.success) {
      return NextResponse.json({ error: 'Parametri non validi.' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: event, error } = await supabase
      .from('events')
      .select('id, slug, title, is_active, access_code')
      .eq('slug', slugResult.data)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Evento non trovato.' }, { status: 404 })
    }

    if (!event.is_active) {
      return NextResponse.json({ error: 'Questo evento non è più attivo.' }, { status: 403 })
    }

    if (event.access_code !== codeResult.data) {
      return NextResponse.json({ error: 'Codice di accesso non valido.' }, { status: 403 })
    }

    return NextResponse.json({
      id: event.id,
      slug: event.slug,
      title: event.title,
    })
  } catch {
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }
}

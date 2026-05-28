import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedFromRequest } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const { storagePath, expiresIn = 3600 } = await req.json()

  if (!storagePath || typeof storagePath !== 'string') {
    return NextResponse.json({ error: 'storagePath richiesto.' }, { status: 400 })
  }

  if (!storagePath.startsWith('events/')) {
    return NextResponse.json({ error: 'Path non valido.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from('wedding-media')
    .createSignedUrl(storagePath, Math.min(expiresIn, 86400))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ url: data.signedUrl })
}

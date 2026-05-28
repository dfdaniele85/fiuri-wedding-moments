import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedFromRequest } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  access_code: z.string().min(4).max(20).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }
  const { eventSlug } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', eventSlug)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Non trovato.' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }
  const { eventSlug } = await params
  const body = await req.json()
  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('events')
    .update(parsed.data)
    .eq('slug', eventSlug)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

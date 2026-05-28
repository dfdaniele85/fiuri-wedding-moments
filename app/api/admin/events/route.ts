import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedFromRequest } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { z } from 'zod'
import { slugSchema, generateSlug } from '@/lib/utils'

const createEventSchema = z.object({
  title: z.string().min(2).max(120),
  slug: slugSchema.optional(),
  access_code: z.string().min(4).max(20),
  is_active: z.boolean().optional().default(true),
})

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { title, slug, access_code, is_active } = parsed.data
  const finalSlug = slug || generateSlug(title)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('events')
    .insert({ title, slug: finalSlug, access_code, is_active })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug già in uso. Scegline un altro.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

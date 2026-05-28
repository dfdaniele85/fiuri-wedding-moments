import { NextRequest, NextResponse } from 'next/server'
import { getAdminCookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      return NextResponse.json({ error: 'Configurazione mancante.' }, { status: 500 })
    }

    if (!password || password !== adminPassword) {
      await new Promise((r) => setTimeout(r, 500))
      return NextResponse.json({ error: 'Password non corretta.' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    const opts = getAdminCookieOptions()
    res.cookies.set(opts)
    return res
  } catch {
    return NextResponse.json({ error: 'Errore del server.' }, { status: 500 })
  }
}

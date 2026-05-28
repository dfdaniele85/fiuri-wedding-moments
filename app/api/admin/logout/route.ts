import { NextResponse } from 'next/server'
import { getClearCookieOptions } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ success: true })
  const opts = getClearCookieOptions()
  res.cookies.set(opts)
  return res
}

import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import PosterClient from './PosterClient'

export default async function PosterPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>
}) {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/admin/login')

  const { eventSlug } = await params
  const supabase = createServiceClient()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', eventSlug)
    .single()

  if (!event) redirect('/admin')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const guestUrl = `${appUrl}/e/${event.slug}?code=${event.access_code}`

  return <PosterClient event={event} guestUrl={guestUrl} />
}

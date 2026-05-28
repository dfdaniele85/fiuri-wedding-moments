import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import EventGallery from './EventGallery'

export default async function EventPage({
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

  return <EventGallery event={event} />
}

import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect('/admin/login')

  const supabase = createServiceClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminDashboard initialEvents={events || []} />
}

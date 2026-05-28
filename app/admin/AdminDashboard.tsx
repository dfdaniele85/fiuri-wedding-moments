'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, ToggleLeft, ToggleRight, Copy, ExternalLink, Flower2 } from 'lucide-react'
import { Event } from '@/types'
import { generateSlug } from '@/lib/utils'

export default function AdminDashboard({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', slug: '', access_code: '', is_active: true })
  const router = useRouter()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const slug = form.slug || generateSlug(form.title)
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error)
      } else {
        setEvents((prev) => [data, ...prev])
        setShowCreate(false)
        setForm({ title: '', slug: '', access_code: '', is_active: true })
      }
    } catch {
      setCreateError('Errore di connessione.')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (event: Event) => {
    const res = await fetch(`/api/admin/events/${event.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !event.is_active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setEvents((prev) => prev.map((e) => (e.slug === event.slug ? updated : e)))
    }
  }

  const copyLink = (slug: string, code: string) => {
    const url = `${appUrl}/e/${slug}?code=${code}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Navbar */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ background: '#fff9f2', borderBottom: '1.5px solid var(--cream-dark)' }}
      >
        <div className="flex items-center gap-2">
          <Flower2 style={{ color: 'var(--forest)', width: 24, height: 24 }} />
          <span className="font-semibold text-lg" style={{ color: 'var(--forest)', fontFamily: 'Georgia' }}>
            Fiuri Admin
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}
        >
          <LogOut size={16} />
          Esci
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl" style={{ color: 'var(--coffee)' }}>
            I tuoi eventi
          </h1>
          <button
            className="fiuri-btn-primary flex items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Nuovo evento
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="fiuri-card p-6 mb-6">
            <h2 className="text-lg mb-4" style={{ color: 'var(--forest)' }}>
              Crea evento
            </h2>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="fiuri-label block mb-1">Nome evento *</label>
                <input
                  className="fiuri-input"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setForm((f) => ({ ...f, title, slug: generateSlug(title) }))
                  }}
                  placeholder="Matrimonio Marco & Giulia"
                  required
                />
              </div>
              <div>
                <label className="fiuri-label block mb-1">Slug URL</label>
                <input
                  className="fiuri-input"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="marco-giulia-2025"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
                  Lascia vuoto per generarlo dal nome
                </p>
              </div>
              <div>
                <label className="fiuri-label block mb-1">Codice accesso *</label>
                <input
                  className="fiuri-input"
                  value={form.access_code}
                  onChange={(e) => setForm((f) => ({ ...f, access_code: e.target.value }))}
                  placeholder="es. fiori2025"
                  required
                  minLength={4}
                />
              </div>
              {createError && (
                <p className="text-sm" style={{ color: 'var(--coral)', fontFamily: 'system-ui' }}>
                  {createError}
                </p>
              )}
              <div className="flex gap-3">
                <button type="submit" className="fiuri-btn-primary" disabled={creating}>
                  {creating ? 'Creazione…' : 'Crea'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="fiuri-btn-primary"
                  style={{ background: 'transparent', color: 'var(--coffee)', border: '1.5px solid var(--cream-dark)' }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        {events.length === 0 ? (
          <div className="fiuri-card p-12 text-center">
            <p style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
              Nessun evento ancora. Creane uno!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="fiuri-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-lg"
                      style={{ color: 'var(--coffee)', fontFamily: 'Georgia' }}
                    >
                      {event.title}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: event.is_active ? 'var(--forest)' : 'var(--cream-dark)',
                        color: event.is_active ? 'var(--cream)' : 'var(--coffee-light)',
                        fontFamily: 'system-ui',
                      }}
                    >
                      {event.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
                    /{event.slug} · codice: <strong>{event.access_code}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyLink(event.slug, event.access_code)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded"
                    style={{ background: 'var(--cream-dark)', color: 'var(--coffee)', fontFamily: 'system-ui', border: 'none', cursor: 'pointer' }}
                  >
                    <Copy size={14} />
                    Link
                  </button>
                  <Link
                    href={`/admin/events/${event.slug}`}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded"
                    style={{ background: 'var(--cream-dark)', color: 'var(--coffee)', fontFamily: 'system-ui' }}
                  >
                    <ExternalLink size={14} />
                    Galleria
                  </Link>
                  <button
                    onClick={() => toggleActive(event)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded"
                    style={{ background: 'var(--cream-dark)', color: 'var(--coffee)', fontFamily: 'system-ui', border: 'none', cursor: 'pointer' }}
                  >
                    {event.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {event.is_active ? 'Disattiva' : 'Attiva'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

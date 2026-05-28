'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, Image, Video, FileDown, Search,
  ExternalLink, Printer, Flower2,
} from 'lucide-react'
import { Event, MediaUpload } from '@/types'
import { formatBytes, formatDate } from '@/lib/utils'

export default function EventGallery({ event }: { event: Event }) {
  const [uploads, setUploads] = useState<MediaUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    fileType: 'all',
    guestName: '',
    dateFrom: '',
    dateTo: '',
  })
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || '')

  const fetchUploads = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams({ eventId: event.id })
    if (filters.fileType !== 'all') qs.set('fileType', filters.fileType)
    if (filters.guestName) qs.set('guestName', filters.guestName)
    if (filters.dateFrom) qs.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) qs.set('dateTo', filters.dateTo)

    const res = await fetch(`/api/admin/media?${qs}`)
    const data = await res.json()
    setUploads(data || [])
    setLoading(false)
  }, [event.id, filters])

  useEffect(() => { fetchUploads() }, [fetchUploads])

  const download = async (upload: MediaUpload) => {
    setDownloadingId(upload.id)
    try {
      const res = await fetch('/api/admin/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: upload.storage_path }),
      })
      const data = await res.json()
      if (data.url) {
        const a = document.createElement('a')
        a.href = data.url
        a.download = upload.original_filename
        a.click()
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const exportCsv = () => {
    window.open(`/api/admin/export-csv?eventId=${event.id}`, '_blank')
  }

  const guestLink = `${appUrl}/e/${event.slug}?code=${event.access_code}`
  const photos = uploads.filter((u) => u.file_type === 'photo').length
  const videos = uploads.filter((u) => u.file_type === 'video').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ background: '#fff9f2', borderBottom: '1.5px solid var(--cream-dark)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}
          >
            <ArrowLeft size={16} />
            Admin
          </Link>
          <span style={{ color: 'var(--cream-dark)' }}>/</span>
          <span style={{ color: 'var(--coffee)', fontFamily: 'Georgia' }}>{event.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${event.slug}/poster`}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded"
            style={{ background: 'var(--cream-dark)', color: 'var(--coffee)', fontFamily: 'system-ui' }}
          >
            <Printer size={14} />
            Poster
          </Link>
          <a
            href={guestLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded"
            style={{ background: 'var(--cream-dark)', color: 'var(--coffee)', fontFamily: 'system-ui' }}
          >
            <ExternalLink size={14} />
            Apri link ospiti
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Totale', value: uploads.length, icon: <Flower2 size={20} /> },
            { label: 'Foto', value: photos, icon: <Image size={20} /> },
            { label: 'Video', value: videos, icon: <Video size={20} /> },
          ].map((s) => (
            <div key={s.label} className="fiuri-card p-4 text-center">
              <div className="flex justify-center mb-1" style={{ color: 'var(--forest)' }}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--coffee)', fontFamily: 'Georgia' }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="fiuri-card p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="fiuri-label block mb-1">Tipo</label>
              <select
                className="fiuri-input"
                value={filters.fileType}
                onChange={(e) => setFilters((f) => ({ ...f, fileType: e.target.value }))}
              >
                <option value="all">Tutti</option>
                <option value="photo">Foto</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="fiuri-label block mb-1">Ospite</label>
              <input
                className="fiuri-input"
                placeholder="Cerca nome…"
                value={filters.guestName}
                onChange={(e) => setFilters((f) => ({ ...f, guestName: e.target.value }))}
              />
            </div>
            <div>
              <label className="fiuri-label block mb-1">Dal</label>
              <input
                type="date"
                className="fiuri-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="fiuri-label block mb-1">Al</label>
              <input
                type="date"
                className="fiuri-input"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg" style={{ color: 'var(--coffee)' }}>
            {loading ? 'Caricamento…' : `${uploads.length} file`}
          </h2>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded"
            style={{ background: 'var(--forest)', color: 'var(--cream)', fontFamily: 'system-ui', border: 'none', cursor: 'pointer' }}
          >
            <FileDown size={15} />
            Esporta CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <Search className="mx-auto animate-pulse" style={{ color: 'var(--forest)', width: 32, height: 32 }} />
          </div>
        ) : uploads.length === 0 ? (
          <div className="fiuri-card p-12 text-center">
            <p style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
              Nessun file trovato con questi filtri.
            </p>
          </div>
        ) : (
          <div className="fiuri-card overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>File</th>
                  <th>Ospite</th>
                  <th>Dimensione</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: u.file_type === 'photo' ? '#e8f4e8' : '#e8eef4',
                          color: u.file_type === 'photo' ? 'var(--forest)' : '#2a4a6b',
                          fontFamily: 'system-ui',
                        }}
                      >
                        {u.file_type === 'photo' ? '📷' : '🎬'} {u.file_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className="text-sm"
                        style={{ color: 'var(--coffee)', fontFamily: 'system-ui', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {u.original_filename}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
                        {u.guest_name || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
                        {formatBytes(u.size_bytes)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
                        {formatDate(u.created_at)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => download(u)}
                        disabled={downloadingId === u.id}
                        className="flex items-center gap-1 text-sm px-2 py-1 rounded"
                        style={{ background: 'var(--cream-dark)', color: 'var(--coffee)', fontFamily: 'system-ui', border: 'none', cursor: 'pointer' }}
                      >
                        <Download size={13} />
                        {downloadingId === u.id ? '…' : 'Scarica'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

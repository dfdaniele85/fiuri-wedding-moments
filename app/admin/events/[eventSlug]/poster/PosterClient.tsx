'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { Printer, ArrowLeft } from 'lucide-react'
import { Event } from '@/types'

export default function PosterClient({ event, guestUrl }: { event: Event; guestUrl: string }) {
  const posterRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Controls - hidden on print */}
      <div className="no-print flex items-center justify-between px-6 py-4" style={{ background: '#fff9f2', borderBottom: '1.5px solid var(--cream-dark)' }}>
        <Link
          href={`/admin/events/${event.slug}`}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}
        >
          <ArrowLeft size={16} />
          Torna alla galleria
        </Link>
        <button
          onClick={handlePrint}
          className="fiuri-btn-primary flex items-center gap-2"
        >
          <Printer size={16} />
          Stampa poster
        </button>
      </div>

      {/* Preview label */}
      <p
        className="no-print text-center text-sm py-3"
        style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}
      >
        Anteprima poster A5 — usa la funzione stampa del browser per stampare
      </p>

      {/* Poster — A5 format */}
      <div
        ref={posterRef}
        className="poster-container mx-auto"
        style={{
          width: '148mm',
          minHeight: '210mm',
          background: 'var(--cream)',
          border: '1px solid var(--cream-dark)',
          padding: '12mm',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: '0 4px 24px rgba(107,66,38,0.12)',
        }}
      >
        {/* Decorative top */}
        <div style={{ width: '100%', textAlign: 'center', marginBottom: '6mm' }}>
          <div style={{ fontSize: '28px', marginBottom: '2mm' }}>🌸 🌿 🌸</div>
          <div
            style={{
              height: '1.5px',
              background: 'var(--forest)',
              opacity: 0.3,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22pt',
              color: 'var(--forest)',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Mandaci i tuoi momenti
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '10pt',
            color: 'var(--coffee)',
            textAlign: 'center',
            lineHeight: 1.6,
            margin: '0 0 6mm 0',
          }}
        >
          Inquadra il QR e carica foto e video della serata
          <br />
          dal tuo telefono.
          <br />
          <em>Anche quelli spontanei, mossi, veri: saranno i nostri preferiti.</em>
        </p>

        {/* QR Code */}
        <div
          style={{
            background: 'white',
            padding: '6mm',
            borderRadius: '4mm',
            border: '1.5px solid var(--cream-dark)',
            marginBottom: '6mm',
            boxShadow: '0 2px 8px rgba(107,66,38,0.08)',
          }}
        >
          <QRCodeCanvas
            value={guestUrl}
            size={160}
            level="H"
            fgColor="#3d5a3e"
            bgColor="#ffffff"
          />
        </div>

        {/* CTA */}
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11pt',
            color: 'var(--forest)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textAlign: 'center',
            marginBottom: '4mm',
            textTransform: 'uppercase',
          }}
        >
          Scansiona · Carica · Lasciaci un ricordo
        </p>

        {/* Event name */}
        <div
          style={{
            background: 'var(--forest)',
            color: 'var(--cream)',
            padding: '2mm 6mm',
            borderRadius: '20px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '9pt',
            marginBottom: '4mm',
          }}
        >
          {event.title}
        </div>

        {/* URL text */}
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '7pt',
            color: 'var(--coffee-light)',
            textAlign: 'center',
            wordBreak: 'break-all',
            margin: 0,
          }}
        >
          {guestUrl}
        </p>

        {/* Decorative bottom */}
        <div style={{ width: '100%', textAlign: 'center', marginTop: '4mm' }}>
          <div
            style={{
              height: '1.5px',
              background: 'var(--forest)',
              opacity: 0.3,
              borderRadius: 2,
              marginBottom: '3mm',
            }}
          />
          <div style={{ fontSize: '16px' }}>🌿 🌸 🌿</div>
        </div>
      </div>

      <p
        className="no-print text-center text-xs mt-4 pb-8"
        style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}
      >
        URL: {guestUrl}
      </p>
    </div>
  )
}

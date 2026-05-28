'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, X, RefreshCw, Flower2 } from 'lucide-react'
import { UploadFile } from '@/types'
import { ALLOWED_MIME_TYPES, formatBytes, getMaxFileSizeBytes } from '@/lib/utils'

const MAX_FILES = 20

interface EventInfo {
  id: string
  slug: string
  title: string
}

export default function GuestUploadClient({
  eventSlug,
  code,
}: {
  eventSlug: string
  code: string
}) {
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(true)
  const [guestName, setGuestName] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!eventSlug || !code) {
      setVerifyError('Link non valido. Controlla il QR code o chiedi agli organizzatori.')
      setVerifying(false)
      return
    }
    fetch('/api/events/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: eventSlug, code }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setVerifyError(data.error)
        else setEvent(data)
      })
      .catch(() => setVerifyError('Errore di connessione. Riprova tra poco.'))
      .finally(() => setVerifying(false))
  }, [eventSlug, code])

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const maxBytes = getMaxFileSizeBytes()
      const valid: UploadFile[] = []

      for (const f of newFiles) {
        if (files.length + valid.length >= MAX_FILES) break
        if (!ALLOWED_MIME_TYPES.includes(f.type)) continue
        if (f.size > maxBytes) continue
        const isImage = f.type.startsWith('image/')
        valid.push({
          id: crypto.randomUUID(),
          file: f,
          preview: isImage ? URL.createObjectURL(f) : undefined,
          status: 'pending',
          progress: 0,
        })
      }

      setFiles((prev) => [...prev, ...valid])
    },
    [files.length]
  )

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id)
      if (f?.preview) URL.revokeObjectURL(f.preview)
      return prev.filter((x) => x.id !== id)
    })
  }

  const uploadSingle = async (uploadFile: UploadFile): Promise<void> => {
    setFiles((prev) =>
      prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f))
    )

    const formData = new FormData()
    formData.append('slug', eventSlug)
    formData.append('code', code)
    formData.append('guestName', guestName.trim())
    formData.append('file', uploadFile.file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: pct } : f))
          )
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: 'done', progress: 100 } : f
            )
          )
        } else {
          let errMsg = 'Errore nel caricamento.'
          try {
            const resp = JSON.parse(xhr.responseText)
            if (resp.error) errMsg = resp.error
          } catch {}
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: 'error', error: errMsg } : f
            )
          )
        }
        resolve()
      }

      xhr.onerror = () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: 'Connessione interrotta.' }
              : f
          )
        )
        resolve()
      }

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    })
  }

  const startUpload = async () => {
    const pending = files.filter((f) => f.status === 'pending' || f.status === 'error')
    if (pending.length === 0) return
    setUploading(true)

    for (const f of pending) {
      await uploadSingle(f)
    }

    setUploading(false)
    setFiles((prev) => {
      const allGood = prev.every((f) => f.status === 'done')
      if (allGood) setAllDone(true)
      return prev
    })
  }

  const retryFailed = () => {
    setFiles((prev) => prev.map((f) => (f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: undefined } : f)))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const hasFailed = files.some((f) => f.status === 'error')
  const pendingCount = files.filter((f) => f.status === 'pending').length
  const doneCount = files.filter((f) => f.status === 'done').length

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <Flower2 className="mx-auto mb-3 animate-spin" style={{ color: 'var(--forest)', width: 36, height: 36 }} />
          <p style={{ color: 'var(--coffee)', fontFamily: 'system-ui' }}>Verifica in corso…</p>
        </div>
      </div>
    )
  }

  if (verifyError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
        <div className="fiuri-card max-w-sm w-full p-8 text-center">
          <AlertCircle className="mx-auto mb-3" style={{ color: 'var(--coral)', width: 40, height: 40 }} />
          <h2 className="text-xl mb-2" style={{ color: 'var(--coffee)' }}>Ops</h2>
          <p style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui', fontSize: '0.95rem' }}>
            {verifyError}
          </p>
        </div>
      </div>
    )
  }

  if (allDone) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
        <div className="fiuri-card max-w-sm w-full p-10 text-center">
          <div className="text-5xl mb-4">🌸</div>
          <h2 className="text-2xl mb-3" style={{ color: 'var(--forest)' }}>
            Arrivato tutto.
          </h2>
          <p className="text-lg mb-4" style={{ color: 'var(--coffee)' }}>
            Grazie per averci lasciato un pezzo della festa.
          </p>
          <button
            className="fiuri-btn-primary"
            onClick={() => { setAllDone(false); setFiles([]) }}
          >
            Carica altri file
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="pt-10 pb-6 px-4 text-center" style={{ borderBottom: '1px solid var(--cream-dark)' }}>
        <div className="text-3xl mb-2">🌸</div>
        <h1 className="text-3xl mb-2" style={{ color: 'var(--forest)' }}>
          Mandaci i tuoi momenti
        </h1>
        <p className="text-base max-w-xs mx-auto" style={{ color: 'var(--coffee)', fontFamily: 'system-ui', lineHeight: 1.6 }}>
          Foto, video, dettagli, brindisi, balli improvvisati: carica qui quello che hai visto tu.
        </p>
        <p className="text-sm mt-1 italic" style={{ color: 'var(--coffee-light)', fontFamily: 'Georgia, serif' }}>
          Anche quelli spontanei, mossi, veri: saranno i nostri preferiti.
        </p>
        {event?.title && (
          <div
            className="inline-block mt-3 px-4 py-1 rounded-full text-sm"
            style={{ background: 'var(--forest)', color: 'var(--cream)', fontFamily: 'system-ui' }}
          >
            {event.title}
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        {/* Guest name */}
        <div>
          <label className="fiuri-label block mb-1">Il tuo nome (opzionale)</label>
          <input
            type="text"
            className="fiuri-input"
            placeholder="es. Marco e Giulia"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            maxLength={80}
            disabled={uploading}
          />
        </div>

        {/* Drop zone */}
        <div
          className={`upload-zone p-8 text-center${dragOver ? ' drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_MIME_TYPES.join(',')}
            className="hidden"
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
          />
          <UploadCloud className="mx-auto mb-3" style={{ color: 'var(--coral)', width: 40, height: 40 }} />
          <p className="font-semibold" style={{ color: 'var(--coffee)', fontFamily: 'system-ui' }}>
            Tocca qui per selezionare foto e video
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
            oppure trascinali qui — max {MAX_FILES} file
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
            JPG, PNG, HEIC, MP4, MOV e altri formati comuni
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <FileRow
                key={f.id}
                file={f}
                onRemove={() => removeFile(f.id)}
                disabled={uploading}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        {files.length > 0 && (
          <div className="space-y-3">
            {hasFailed && !uploading && (
              <button
                className="w-full fiuri-btn-primary flex items-center justify-center gap-2"
                style={{ background: 'var(--coral)' }}
                onClick={retryFailed}
              >
                <RefreshCw size={16} />
                Riprova i file falliti
              </button>
            )}
            <button
              className="w-full fiuri-btn-primary flex items-center justify-center gap-2"
              onClick={startUpload}
              disabled={uploading || pendingCount === 0}
            >
              {uploading ? (
                <>
                  <Flower2 size={16} className="animate-spin" />
                  Caricamento… {doneCount}/{files.length}
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Carica {pendingCount > 0 ? pendingCount : ''} {pendingCount === 1 ? 'file' : 'file'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Privacy */}
        <p className="text-xs text-center" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui', lineHeight: 1.5 }}>
          Caricando i file autorizzi gli organizzatori dell&apos;evento a conservarli e usarli privatamente come ricordo della serata.
        </p>
      </div>
    </div>
  )
}

function FileRow({
  file,
  onRemove,
  disabled,
}: {
  file: UploadFile
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div className="fiuri-card p-3 flex items-center gap-3">
      {file.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.preview}
          alt=""
          className="w-12 h-12 object-cover rounded"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <div
          className="w-12 h-12 rounded flex items-center justify-center text-xs"
          style={{ background: 'var(--cream-dark)', color: 'var(--coffee-light)', flexShrink: 0, fontFamily: 'system-ui' }}
        >
          VIDEO
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm truncate"
          style={{ color: 'var(--coffee)', fontFamily: 'system-ui', fontWeight: 500 }}
        >
          {file.file.name}
        </p>
        <p className="text-xs" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
          {formatBytes(file.file.size)}
        </p>
        {(file.status === 'uploading' || file.status === 'done') && (
          <div className="progress-bar-bg mt-1">
            <div
              className={`progress-bar-fill${file.status === 'done' ? ' done' : ''}`}
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {file.status === 'error' && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--coral)', fontFamily: 'system-ui' }}>
            {file.error}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {file.status === 'done' && <CheckCircle2 size={20} style={{ color: 'var(--forest)' }} />}
        {file.status === 'error' && <AlertCircle size={20} style={{ color: 'var(--coral)' }} />}
        {(file.status === 'pending' || file.status === 'uploading') && !disabled && (
          <button onClick={onRemove} className="p-0.5 rounded" style={{ color: 'var(--coffee-light)' }}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

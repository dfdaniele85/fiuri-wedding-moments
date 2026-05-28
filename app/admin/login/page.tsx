'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flower2, Lock } from 'lucide-react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Errore.')
      } else {
        router.push('/admin')
      }
    } catch {
      setError('Errore di connessione.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cream)' }}>
      <div className="fiuri-card max-w-sm w-full p-8">
        <div className="text-center mb-6">
          <Flower2 className="mx-auto mb-2" style={{ color: 'var(--forest)', width: 36, height: 36 }} />
          <h1 className="text-2xl" style={{ color: 'var(--forest)' }}>Fiuri Admin</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--coffee-light)', fontFamily: 'system-ui' }}>
            Accesso riservato agli organizzatori
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fiuri-label block mb-1">Password</label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--coffee-light)' }}
              />
              <input
                type="password"
                className="fiuri-input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
          </div>
          {error && (
            <p className="text-sm" style={{ color: 'var(--coral)', fontFamily: 'system-ui' }}>
              {error}
            </p>
          )}
          <button type="submit" className="fiuri-btn-primary w-full" disabled={loading}>
            {loading ? 'Accesso…' : 'Entra'}
          </button>
        </form>
      </div>
    </div>
  )
}

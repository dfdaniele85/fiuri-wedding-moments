import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fiuri – Mandaci i tuoi momenti',
  description: 'Carica foto e video dal tuo telefono direttamente agli sposi.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

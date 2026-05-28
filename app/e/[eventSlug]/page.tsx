import { Metadata } from 'next'
import GuestUploadClient from './client'

export const metadata: Metadata = {
  title: 'Mandaci i tuoi momenti – Fiuri',
  description: 'Carica foto e video della serata direttamente agli sposi.',
}

export default async function GuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { eventSlug } = await params
  const { code } = await searchParams

  return <GuestUploadClient eventSlug={eventSlug} code={code || ''} />
}

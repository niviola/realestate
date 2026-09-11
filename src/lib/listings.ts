export type ListingPhoto = {
  url: string
  sort_order: number
}

export type Listing = {
  id: string
  title: string
  address: string | null
  city: string
  neighborhood: string | null
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  property_type: string | null
  status: 'draft' | 'available' | 'pending' | 'sold'
  description: string | null
  created_at: string
  listing_photos: ListingPhoto[] | null
}

export const STATUS_LABEL: Partial<Record<Listing['status'], string>> = {
  pending: 'Under contract',
  sold: 'Sold',
}

export function formatPrice(price: number | null) {
  if (price == null) return 'Price on request'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatSpecs(l: Pick<Listing, 'beds' | 'baths' | 'sqft'>) {
  const parts: string[] = []
  if (l.beds != null) parts.push(`${l.beds} bed${l.beds === 1 ? '' : 's'}`)
  if (l.baths != null) parts.push(`${l.baths} bath${l.baths === 1 ? '' : 's'}`)
  if (l.sqft != null) parts.push(`${l.sqft.toLocaleString('en-US')} sq ft`)
  return parts.join(', ')
}

export function sortedPhotos(photos: ListingPhoto[] | null | undefined) {
  return [...(photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)
}

export function locationLine(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(', ')
}
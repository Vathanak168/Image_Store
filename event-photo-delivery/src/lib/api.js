const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─────────────────────────────────────────
// GUEST — Gallery API (uses JWT from URL)
// ─────────────────────────────────────────

export async function fetchGallery(token) {
  const res = await fetch(`${BASE_URL}/gallery`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load gallery')
  const data = await res.json()

  // Normalise to match our frontend shape
  return {
    event: data.event ?? { name: 'Your Gallery', date: '', venue: '' },
    photos: (data.photos ?? []).map(normalisePhoto),
    suggested: (data.suggested ?? []).map(normalisePhoto),
  }
}

export async function verifyToken(token) {
  const res = await fetch(`${BASE_URL}/auth/verify-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error('Invalid token')
  return res.json()
}

export async function downloadPhoto(photo) {
  // Get a signed URL from backend, then trigger download
  try {
    const res = await fetch(`${BASE_URL}/photos/${photo.id}/download`)
    if (res.ok) {
      const { download_url } = await res.json()
      const a = document.createElement('a')
      a.href = download_url
      a.download = photo.filename
      a.click()
      return
    }
  } catch (_) { /* fallback below */ }

  // Fallback: direct download from CDN URL
  const a = document.createElement('a')
  a.href = photo.url_original || photo.url_preview
  a.download = photo.filename
  a.click()
}

export async function faceScan(selfieFile, token) {
  const formData = new FormData()
  formData.append('selfie', selfieFile)
  const res = await fetch(`${BASE_URL}/gallery/face-scan`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error('Face scan failed')
  return res.json()
}

// ─────────────────────────────────────────
// ADMIN — Photographer API (uses Admin Secret)
// ─────────────────────────────────────────

function adminHeaders(adminSecret) {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': adminSecret,
  }
}

export async function createEvent(payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to create event')
  }
  return res.json()
}

export async function getEvent(eventId) {
  const res = await fetch(`${BASE_URL}/events/${eventId}`)
  if (!res.ok) throw new Error('Event not found')
  return res.json()
}

export async function importGuests(eventId, guests, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/guests/import`, {
    method: 'POST',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify({ guests }),
  })
  if (!res.ok) throw new Error('Failed to import guests')
  return res.json()
}

export async function sendInvites(eventId, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/guests/invite`, {
    method: 'POST',
    headers: adminHeaders(adminSecret),
  })
  if (!res.ok) throw new Error('Failed to send invites')
  return res.json()
}

export async function listGuests(eventId, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/guests`, {
    headers: adminHeaders(adminSecret),
  })
  if (!res.ok) throw new Error('Failed to list guests')
  return res.json()
}

export async function uploadPhoto(file, eventId, adminSecret, tableTag = null) {
  const formData = new FormData()
  formData.append('file', file)
  const headers = { 'x-admin-secret': adminSecret, 'X-Event-Id': eventId }
  if (tableTag) headers['X-Table-Tag'] = String(tableTag)

  const res = await fetch(`${BASE_URL}/photos/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function publishPhoto(photoId, adminSecret) {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/publish`, {
    method: 'PATCH',
    headers: adminHeaders(adminSecret),
  })
  if (!res.ok) throw new Error('Publish failed')
  return res.json()
}

// ─────────────────────────────────────────
// MOCK fallback (used when backend is offline)
// ─────────────────────────────────────────

const MOCK_PHOTOS = Array.from({ length: 24 }, (_, i) => ({
  id: `photo-${i}`,
  thumb:       `https://picsum.photos/seed/${i + 10}/400/500`,
  url_thumb:   `https://picsum.photos/seed/${i + 10}/400/500`,
  url_preview: `https://picsum.photos/seed/${i + 10}/1200/1500`,
  url_original:`https://picsum.photos/seed/${i + 10}/3000/3750`,
  filename:    `DSC_${4800 + i}.jpg`,
  size:        `${(Math.random() * 20 + 8).toFixed(1)} MB`,
  confidence:  i < 18 ? 0.92 : 0.71,
}))

export async function fetchGalleryMock(_token) {
  await new Promise(r => setTimeout(r, 1200))
  return {
    event: { name: 'Sophia & Daniel', date: 'June 14, 2025', venue: 'Grand Sofitel, Phnom Penh' },
    photos: MOCK_PHOTOS.slice(0, 18),
    suggested: MOCK_PHOTOS.slice(18),
  }
}

// ─────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────

function normalisePhoto(p) {
  return {
    id:          p.id,
    thumb:       p.url_thumb,
    url_thumb:   p.url_thumb,
    url_preview: p.url_preview,
    url_original:p.url_original,
    filename:    p.filename,
    confidence:  p.confidence ?? 1,
  }
}

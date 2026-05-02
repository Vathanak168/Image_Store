const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─────────────────────────────────────────
// GUEST — Gallery API (uses JWT from URL)
// ─────────────────────────────────────────

export async function fetchGallery(token, offset = 0, limit = 20) {
  const res = await fetch(`${BASE_URL}/gallery?offset=${offset}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load gallery')
  const data = await res.json()
  return {
    event:      data.event ?? { name: 'Your Gallery', date: '', venue: '' },
    photos:     (data.photos ?? []).map(normalisePhoto),
    suggested:  (data.suggested ?? []).map(normalisePhoto),
    pagination: data.pagination ?? {},
  }
}

export async function fetchGalleryBySession(token, sessionId, offset = 0, limit = 20) {
  const res = await fetch(`${BASE_URL}/gallery/by-session/${sessionId}?offset=${offset}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load session gallery')
  const data = await res.json()
  return {
    session: data.session,
    photos:  (data.photos ?? []).map(normalisePhoto),
    pagination: data.pagination ?? {},
  }
}

export async function getActiveEvent() {
  const res = await fetch(`${BASE_URL}/events/active`)
  if (!res.ok) throw new Error('No active event')
  return res.json()
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
  let targetUrl = photo.url_original || photo.url_preview || photo.thumb;
  
  try {
    const res = await fetch(`${BASE_URL}/photos/${photo.id}/download`)
    if (res.ok) {
      const { download_url } = await res.json()
      if (download_url) targetUrl = download_url;
    }
  } catch (_) { /* fallback below */ }

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error('Network response was not ok');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = photo.filename || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback if CORS prevents blob fetch
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = photo.filename || 'photo.jpg';
    a.target = '_blank';
    a.click();
  }
}

/**
 * Download queue: max `concurrency` downloads at once per user.
 */
export async function downloadQueue(photos, concurrency = 3) {
  const queue = [...photos]
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
    while (queue.length > 0) {
      const photo = queue.shift()
      if (!photo) break
      await downloadPhoto(photo)
      await sleep(400)
    }
  })
  await Promise.all(workers)
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

export async function listEvents(adminSecret) {
  const res = await fetch(`${BASE_URL}/events`, {
    headers: adminHeaders(adminSecret),
  })
  if (!res.ok) throw new Error('Failed to list events')
  return res.json()
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

export async function updateEvent(eventId, payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'PATCH',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to update event')
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

export async function uploadPhoto(file, eventId, adminSecret, tableTag = null, sessionId = null, tableId = null) {
  const formData = new FormData()
  formData.append('file', file)
  const headers = { 'x-admin-secret': adminSecret, 'X-Event-Id': eventId }
  if (tableTag)  headers['X-Table-Tag']  = String(tableTag)
  if (tableId)   headers['X-Table-Id']   = tableId
  if (sessionId) headers['X-Session-Id'] = sessionId
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

// ── Sessions API ────────────────────────────────────────────────────────────

export async function listSessions(eventId, adminSecret) {
  const headers = adminSecret ? adminHeaders(adminSecret) : {}
  const res = await fetch(`${BASE_URL}/events/${eventId}/sessions`, { headers })
  if (!res.ok) throw new Error('Failed to load sessions')
  return res.json()
}

export async function createSession(eventId, payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/sessions`, {
    method: 'POST',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to create session')
  }
  return res.json()
}

export async function updateSession(eventId, sessionId, payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update session')
  return res.json()
}

export async function deleteSession(eventId, sessionId, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: adminHeaders(adminSecret),
  })
  if (!res.ok) throw new Error('Failed to delete session')
}

export async function reorderSessions(eventId, sessions, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/sessions/reorder`, {
    method: 'PATCH',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify({ sessions }),
  })
  if (!res.ok) throw new Error('Failed to reorder sessions')
  return res.json()
}

// ── Tables API ──────────────────────────────────────────────────────────────

export async function listTables(eventId, adminSecret) {
  const headers = adminSecret ? adminHeaders(adminSecret) : {}
  const res = await fetch(`${BASE_URL}/events/${eventId}/tables`, { headers })
  if (!res.ok) throw new Error('Failed to load tables')
  return res.json()
}

/**
 * Bulk configure tables: delete all existing, generate new ones.
 * payload: { table_count: number, table_naming: 'numeric'|'alphabetic'|'custom' }
 */
export async function configureTables(eventId, payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/tables/configure`, {
    method: 'POST',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to configure tables')
  }
  return res.json()
}

export async function updateTable(eventId, tableId, payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/tables/${tableId}`, {
    method: 'PATCH',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),   // expects { table_label: "..." }
  })
  if (!res.ok) throw new Error('Failed to update table')
  return res.json()
}

/**
 * Upload multiple photos to a specific table.
 * files: File[] array
 */
export async function uploadTablePhotos(eventId, tableId, files, adminSecret) {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const res = await fetch(`${BASE_URL}/events/${eventId}/tables/${tableId}/photos`, {
    method: 'POST',
    headers: { 'x-admin-secret': adminSecret },  // no Content-Type — multipart
    body: form,
  })
  if (!res.ok) throw new Error('Failed to upload table photos')
  return res.json()
}

export async function getTablePhotos(eventId, tableId, { status = 'published', limit = 20, offset = 0 } = {}) {
  const res = await fetch(
    `${BASE_URL}/events/${eventId}/tables/${tableId}/photos?status=${status}&limit=${limit}&offset=${offset}`
  )
  if (!res.ok) throw new Error('Failed to load table photos')
  return res.json()
}

// ── Event config + toggles ──────────────────────────────────────────────────

export async function getEventConfig(eventId) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/config`)
  if (!res.ok) throw new Error('Failed to fetch event config')
  return res.json()
}

export async function updateEventToggles(eventId, payload, adminSecret) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/toggles`, {
    method: 'PATCH',
    headers: adminHeaders(adminSecret),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update toggles')
  return res.json()
}

// ─────────────────────────────────────────
// MOCK fallback (used when backend is offline)
// ─────────────────────────────────────────

const MOCK_PHOTOS = Array.from({ length: 24 }, (_, i) => ({
  id:          `photo-${i}`,
  thumb:       `https://picsum.photos/seed/${i + 10}/400/500`,
  url_thumb:   `https://picsum.photos/seed/${i + 10}/400/500`,
  url_preview: `https://picsum.photos/seed/${i + 10}/1200/1500`,
  url_original:`https://picsum.photos/seed/${i + 10}/3000/3750`,
  filename:    `DSC_${4800 + i}.jpg`,
  confidence:  i < 18 ? 0.92 : 0.71,
  session_id:  null,
}))

export async function fetchGalleryMock(_token) {
  await new Promise(r => setTimeout(r, 1200))
  return {
    event:      { name: 'Sophia & Daniel', date: 'June 14, 2025', venue: 'Grand Sofitel, Phnom Penh' },
    photos:     MOCK_PHOTOS.slice(0, 18),
    suggested:  MOCK_PHOTOS.slice(18),
    pagination: { offset: 0, limit: 20, has_more: false },
  }
}

// ─────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────

function normalisePhoto(p) {
  return {
    id:           p.id,
    thumb:        p.url_thumb,
    url_thumb:    p.url_thumb,
    url_preview:  p.url_preview,
    url_original: p.url_original,
    filename:     p.filename,
    confidence:   p.confidence ?? 1,
    session_id:   p.session_id ?? null,
  }
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import MasonryGallery from '../components/MasonryGallery'
import SkeletonGrid from '../components/SkeletonGrid'
import PhotoViewer from '../components/PhotoViewer'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Mock table photos using picsum (different seeds per table)
async function fetchTablePhotosMock(tableNumber) {
  await new Promise(r => setTimeout(r, 900))
  const seed = tableNumber * 10
  return Array.from({ length: 12 }, (_, i) => ({
    id: `table-${tableNumber}-${i}`,
    thumb:       `https://picsum.photos/seed/${seed + i}/400/500`,
    url_thumb:   `https://picsum.photos/seed/${seed + i}/400/500`,
    url_preview: `https://picsum.photos/seed/${seed + i}/1200/1500`,
    url_original:`https://picsum.photos/seed/${seed + i}/3000/3750`,
    filename:    `Table${tableNumber}_DSC_${1000 + i}.jpg`,
    confidence:  1,
  }))
}

async function fetchTablePhotos(tableNumber, token) {
  if (!token || token === 'demo') return fetchTablePhotosMock(tableNumber)
  const res = await fetch(`${BASE_URL}/gallery/by-table/${tableNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return fetchTablePhotosMock(tableNumber)
  const data = await res.json()
  return (data.photos || []).map(p => ({
    ...p,
    thumb: p.url_thumb,
  }))
}

export default function TableGalleryPage() {
  const { tableNumber } = useParams()
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('t') || 'demo'
  const [viewerIndex, setViewerIndex] = useState(null)

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['table-gallery', tableNumber],
    queryFn: () => fetchTablePhotos(parseInt(tableNumber), token),
  })

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-ink/8 px-4 py-3">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full border border-ink/15 flex items-center justify-center text-ink/60 text-base flex-shrink-0">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-xl italic text-ink truncate">Table {tableNumber}</h1>
            <p className="text-xs text-muted">
              {isLoading ? 'Loading...' : `${photos.length} photos`}
            </p>
          </div>
          <span className="text-xs bg-gold/10 text-gold border border-gold/30 px-3 py-1 rounded-full flex-shrink-0">
            {photos.length}
          </span>
        </div>
      </motion.header>

      {isLoading ? <SkeletonGrid /> : (
        <MasonryGallery photos={photos} onPhotoClick={setViewerIndex} />
      )}

      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  )
}

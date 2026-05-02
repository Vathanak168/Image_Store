import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGallery, fetchGalleryMock, downloadPhoto } from '../lib/api'
import MasonryGallery from '../components/MasonryGallery'
import SkeletonGrid from '../components/SkeletonGrid'
import PhotoViewer from '../components/PhotoViewer'
import { motion } from 'framer-motion'

export default function GalleryPage() {
  // Token comes from URL param /g/:token  OR  ?t=... query
  const { token: paramToken } = useParams()
  const queryToken = new URLSearchParams(window.location.search).get('t')
  const token = paramToken || queryToken || 'demo'

  const [viewerIndex, setViewerIndex] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery', token],
    queryFn: () => {
      // Use mock if token is literally "demo" (no backend needed)
      if (token === 'demo') return fetchGalleryMock(token)
      return fetchGallery(token)
    },
    retry: 1,
  })

  const allPhotos = [...(data?.photos ?? []), ...(data?.suggested ?? [])]

  return (
    <div className="min-h-screen bg-cream">

      {/* Header */}
      <motion.header
        className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-ink/8 px-4 py-3 gold-line"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-light italic text-ink">
              {data?.event?.name ?? 'Your Gallery'}
            </h1>
            <p className="text-xs text-muted font-sans mt-0.5">
              {data?.event?.date}
              {data?.event?.date && data?.photos?.length ? ' · ' : ''}
              {data?.photos?.length ? `${data.photos.length} photos matched` : isLoading ? 'Loading...' : ''}
            </p>
          </div>
          <span className="text-xs bg-gold/10 text-gold border border-gold/30 px-3 py-1 rounded-full font-sans font-medium">
            {data?.photos?.length ?? 0} photos
          </span>
        </div>
      </motion.header>

      {/* Error state */}
      {error && (
        <div className="p-8 text-center">
          <p className="text-ink/40 text-sm font-sans">Could not load gallery.</p>
          <p className="text-muted text-xs mt-1">Your link may have expired.</p>
        </div>
      )}

      {/* Gallery */}
      {isLoading ? (
        <SkeletonGrid />
      ) : (
        <MasonryGallery
          photos={data?.photos ?? []}
          onPhotoClick={setViewerIndex}
        />
      )}

      {/* Suggested strip */}
      {!isLoading && (data?.suggested?.length ?? 0) > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs uppercase tracking-widest text-muted font-sans mb-3">
            Suggested — might include you
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.suggested.map((p, i) => (
              <img
                key={p.id}
                src={p.thumb || p.url_thumb}
                onClick={() => setViewerIndex((data.photos?.length ?? 0) + i)}
                className="w-20 h-20 flex-shrink-0 rounded-lg object-cover cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      )}

      {/* Download All FAB */}
      {!isLoading && (data?.photos?.length ?? 0) > 0 && viewerIndex === null && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const photos = data?.photos ?? []
            photos.forEach((p, i) => {
              setTimeout(() => {
                const a = document.createElement('a')
                a.href = p.url_original || p.url_preview || p.thumb
                a.download = p.filename || `photo_${i}.jpg`
                a.target = '_blank'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }, i * 500)
            })
          }}
          className="fixed bottom-6 right-4 z-20 bg-ink text-cream pl-4 pr-5 py-3 rounded-full
            shadow-xl shadow-ink/30 flex items-center gap-2 text-xs font-sans font-medium"
        >
          <span>⬇</span> Download All ({data?.photos?.length})
        </motion.button>
      )}

      {/* Viewer */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={allPhotos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  )
}

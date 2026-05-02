import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGallery, fetchGalleryMock, downloadQueue } from '../lib/api'
import MasonryGallery from '../components/MasonryGallery'
import SkeletonGrid from '../components/SkeletonGrid'
import PhotoViewer from '../components/PhotoViewer'
import { motion } from 'framer-motion'

export default function GalleryPage() {
  const { token: paramToken } = useParams()
  const queryToken = new URLSearchParams(window.location.search).get('t')
  const token = paramToken || queryToken || 'demo'

  const [viewerIndex, setViewerIndex] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery', token],
    queryFn: () => {
      if (token === 'demo') return fetchGalleryMock(token)
      return fetchGallery(token)
    },
    retry: 1,
  })

  const allPhotos = [...(data?.photos ?? []), ...(data?.suggested ?? [])]
  
  // Feature toggles fallback
  const features = data?.event?.features || {
    download: true,
    show_suggested: true
  }

  const handleDownloadAll = async () => {
    const photos = data?.photos ?? []
    if (photos.length === 0 || downloading) return
    
    setDownloading(true)
    try {
      // Use the concurrency-limited queue from api.js
      await downloadQueue(photos, 3) 
    } finally {
      setDownloading(false)
    }
  }

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
              {data?.event?.date ? new Date(data.event.date).toLocaleDateString() : ''}
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

      {/* Suggested strip - conditionally rendered based on features */}
      {!isLoading && features.show_suggested && (data?.suggested?.length ?? 0) > 0 && (
        <div className="px-4 pb-6 mt-4 border-t border-ink/5 pt-4">
          <p className="text-xs uppercase tracking-widest text-muted font-sans mb-3">
            Suggested — might include you
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* Download All FAB - conditionally rendered based on features */}
      {!isLoading && features.download && (data?.photos?.length ?? 0) > 0 && viewerIndex === null && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadAll}
          disabled={downloading}
          className={`fixed bottom-6 right-4 z-20 pl-4 pr-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-xs font-sans font-medium transition-colors
            ${downloading ? 'bg-ink/60 text-cream/80 cursor-wait' : 'bg-ink text-cream shadow-ink/30'}`}
        >
          {downloading ? (
             <div className="w-3 h-3 border-2 border-cream border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>⬇</span>
          )}
          {downloading ? 'Downloading...' : `Download All (${data.photos.length})`}
        </motion.button>
      )}

      {/* Viewer */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={allPhotos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          allowDownload={features.download}
        />
      )}
    </div>
  )
}

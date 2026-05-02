import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEventConfig } from '../hooks/useEventConfig'
import FindMyPhotosDrawer from '../components/FindMyPhotosDrawer'
import SessionTabs from '../components/SessionTabs'

function EventHero({ event }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center w-full px-6 flex flex-col items-center"
    >
      {event.cover_image_url ? (
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto mb-6 bg-cream">
          <img src={event.cover_image_url} alt={event.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-6 bg-cream shadow-sm">
          <span className="text-gold text-2xl">✦</span>
        </div>
      )}

      <p className="text-muted text-[10px] uppercase tracking-[0.2em] mb-3 font-sans">
        Welcome to
      </p>
      <h1 className="font-serif text-[38px] sm:text-[44px] font-light italic text-ink leading-[1.15] mb-4">
        {event.name}
      </h1>
      
      {(event.date || event.venue) && (
        <div className="flex items-center gap-2 text-xs font-sans text-muted justify-center">
          {event.date && <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
          {event.date && event.venue && <span>•</span>}
          {event.venue && <span>{event.venue}</span>}
        </div>
      )}
    </motion.div>
  )
}

function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-full bg-ink/5 animate-pulse mb-6" />
      <div className="w-24 h-3 bg-ink/5 rounded animate-pulse mb-4" />
      <div className="w-64 h-10 bg-ink/5 rounded animate-pulse mb-4" />
      <div className="w-48 h-4 bg-ink/5 rounded animate-pulse" />
    </div>
  )
}

export default function LandingPage({ isPreview = false }) {
  const { eventId } = useParams()
  const navigate = useNavigate()
  
  // In preview mode, useEventConfig will pick up the prepopulated cache
  const { data: config, isLoading, error } = useEventConfig(eventId)
  const [activeSession, setActiveSession] = useState(null)

  if (isLoading) return <LandingPageSkeleton />

  if (error || !config) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif text-ink mb-2">Event Not Found</h2>
        <p className="text-muted text-sm font-sans">The event link might be broken or expired.</p>
      </div>
    )
  }

  const handleNavigateGallery = () => {
    if (isPreview) return
    navigate(`/e/${eventId}/gallery${activeSession ? `/${activeSession}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-hidden">
      {/* Gold accent top line */}
      <div 
        className="fixed top-0 left-0 right-0 h-0.5 z-20"
        style={{ 
          background: config.accent_color 
            ? `linear-gradient(90deg, transparent, ${config.accent_color}, transparent)`
            : 'linear-gradient(90deg, transparent, #C9A96E, transparent)' 
        }} 
      />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gold/5 blur-2xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-16 z-10 w-full max-w-lg mx-auto">
        <EventHero event={config} />

        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent my-10" />

        {/* MULTI-SESSION MODE */}
        {config.mode === 'multi_session' && (
          <SessionTabs
            sessions={config.sessions}
            activeSessionId={activeSession}
            onSelect={setActiveSession}
          />
        )}

        {/* SIMPLE MODE (or just the gallery button for the selected session) */}
        <div className="text-center w-full px-6">
          <button
            onClick={handleNavigateGallery}
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center px-8 py-3.5 bg-ink text-white rounded-full text-sm font-medium font-sans hover:bg-ink/90 transition-all shadow-lg shadow-ink/10"
          >
            {config.mode === 'multi_session' ? 'View Session Photos' : 'View All Photos'}
          </button>
        </div>

        {/* FIND MY PHOTOS — Collapsible Drawer */}
        <FindMyPhotosDrawer features={config.features} />
      </div>
    </div>
  )
}

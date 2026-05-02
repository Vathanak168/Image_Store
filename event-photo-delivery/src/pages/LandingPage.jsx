import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useEventConfig } from '../hooks/useEventConfig'
import FindMyPhotosDrawer from '../components/FindMyPhotosDrawer'

export default function LandingPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  
  // Try to use the URL eventId, fallback to active event logic if needed
  // Note: For now, we assume the new routing /e/:eventId is active
  const { data: event, isLoading, error } = useEventConfig(eventId)

  const [activeDrawer, setActiveDrawer] = useState(null) // 'face_scan', 'qr_access', 'table_browsing'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif text-ink mb-2">Event Not Found</h2>
        <p className="text-muted text-sm font-sans">The event link might be broken or expired.</p>
      </div>
    )
  }

  const features = event.features || {}

  const allOptions = [
    {
      id: 'face_scan',
      icon: '👤',
      label: 'Scan My Face',
      sub: 'AI finds your photos instantly',
      primary: true,
    },
    {
      id: 'qr_access',
      icon: '📷',
      label: 'Scan QR Code',
      sub: 'From your physical invitation',
    },
    {
      id: 'table_browsing',
      icon: '🪑',
      label: 'Table Number',
      sub: 'Browse by seating arrangement',
    },
  ]

  // Filter based on admin toggles
  const options = allOptions.filter(opt => features[opt.id] !== false)

  const handleOptionClick = (id) => {
    // Progressive disclosure: Open drawer instead of navigating away immediately
    setActiveDrawer(id)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-hidden">
      {/* Background styling remains same */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent z-10" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gold/5 blur-2xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 w-full max-w-xs"
        >
          <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-6 bg-cream shadow-sm">
            <span className="text-gold text-xl">✦</span>
          </div>

          <p className="text-muted text-[10px] uppercase tracking-[0.2em] mb-3 font-sans">
            Welcome to
          </p>
          <h1 className="font-serif text-[38px] sm:text-[44px] font-light italic text-ink leading-[1.15] mb-3">
            {event.name}
          </h1>
        </motion.div>

        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mb-10" />

        <div className="w-full max-w-xs space-y-3">
          {options.map((opt, i) => (
            <motion.button
              key={opt.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleOptionClick(opt.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all
                ${opt.primary
                  ? 'bg-ink text-cream shadow-xl shadow-ink/20 border border-ink'
                  : 'bg-white border border-ink/10 text-ink hover:border-gold/40 hover:bg-gold/5'
                }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                ${opt.primary ? 'bg-gold/20' : 'bg-ink/5'}`}>
                {opt.icon}
              </div>
              <div className="text-left flex-1">
                <p className={`font-sans font-medium text-sm ${opt.primary ? 'text-cream' : 'text-ink'}`}>
                  {opt.label}
                </p>
                <p className={`text-xs mt-0.5 ${opt.primary ? 'text-cream/50' : 'text-muted'}`}>
                  {opt.sub}
                </p>
              </div>
              <span className={`text-sm ${opt.primary ? 'text-gold' : 'text-muted'}`}>→</span>
            </motion.button>
          ))}
          
          {options.length === 0 && (
             <p className="text-center text-muted text-sm font-sans italic p-4 border border-cream-200 rounded-xl bg-white/50">
               No access methods enabled.
             </p>
          )}
        </div>
      </div>

      {/* Drawers for Progressive Disclosure */}
      <FindMyPhotosDrawer 
        isOpen={activeDrawer === 'face_scan'} 
        onClose={() => setActiveDrawer(null)}
        title="Scan My Face"
      >
        <div className="text-center">
          <p className="text-sm text-muted mb-6">Take a quick selfie to let our AI instantly find all photos of you from the event.</p>
          <div className="w-full h-48 bg-ink/5 rounded-xl border border-ink/10 flex items-center justify-center mb-6">
            <span className="text-4xl">📸</span>
          </div>
          <button 
            onClick={() => navigate(`/e/${eventId}/face-scan`)}
            className="w-full py-4 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-ink/90 transition-colors"
          >
            Open Camera
          </button>
        </div>
      </FindMyPhotosDrawer>

      <FindMyPhotosDrawer 
        isOpen={activeDrawer === 'table_browsing'} 
        onClose={() => setActiveDrawer(null)}
        title="Find Your Table"
      >
        <div className="text-center">
          <p className="text-sm text-muted mb-6">Enter your table number or select it from the list to see photos of your seating group.</p>
          <button 
            onClick={() => navigate(`/e/${eventId}/tables`)}
            className="w-full py-4 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-ink/90 transition-colors"
          >
            Browse Tables
          </button>
        </div>
      </FindMyPhotosDrawer>

      <FindMyPhotosDrawer 
        isOpen={activeDrawer === 'qr_access'} 
        onClose={() => setActiveDrawer(null)}
        title="Scan QR Code"
      >
        <div className="text-center">
          <p className="text-sm text-muted mb-6">Point your camera at the QR code on your physical invitation card.</p>
          <button 
            onClick={() => navigate(`/e/${eventId}/scan-qr`)}
            className="w-full py-4 bg-ink text-cream rounded-xl font-medium text-sm hover:bg-ink/90 transition-colors"
          >
            Open QR Scanner
          </button>
        </div>
      </FindMyPhotosDrawer>

    </div>
  )
}

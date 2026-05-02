import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function FindMyPhotosDrawer({ features }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  // Default to true if not explicitly set to false
  const showFace = features?.face_scan !== false
  const showQR = features?.qr_access !== false
  const showTable = features?.table_browse === true // Specific requirement: off by default

  const hasAnyFeature = showFace || showQR || showTable

  if (!hasAnyFeature) return null

  return (
    <div className="mt-8 mb-12 w-full px-6 flex flex-col items-center">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-muted font-sans mx-auto hover:text-ink transition-colors group"
      >
        <span>Find my photos</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-xs group-hover:text-gold"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full overflow-hidden flex flex-col items-center"
          >
            <div className="w-full max-w-xs flex flex-col gap-3 pb-2">
              {showFace && (
                <button onClick={() => navigate('/face-scan')} className="w-full py-3.5 px-6 border border-gold/30 rounded-full text-sm font-sans text-ink hover:border-gold hover:bg-gold/5 transition-all flex items-center justify-center gap-3 shadow-sm">
                  <span className="text-lg">📸</span> Scan my face
                </button>
              )}
              {showQR && (
                <button onClick={() => navigate('/scan-qr')} className="w-full py-3.5 px-6 border border-ink/10 rounded-full text-sm font-sans text-muted hover:border-ink/30 hover:text-ink transition-all flex items-center justify-center gap-3">
                  <span className="text-lg">📱</span> Scan QR code
                </button>
              )}
              {showTable && (
                <button onClick={() => navigate('/table')} className="w-full py-3.5 px-6 border border-ink/10 rounded-full text-sm font-sans text-muted hover:border-ink/30 hover:text-ink transition-all flex items-center justify-center gap-3">
                  <span className="text-lg">🪑</span> Browse by table
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

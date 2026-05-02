import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'

export default function PhotoViewer({ photos, initialIndex, onClose }) {
  const [index, setIndex]         = useState(initialIndex)
  const [uiVisible, setUiVisible] = useState(true)
  const [dlAnim, setDlAnim]       = useState(false)
  const [dlDone, setDlDone]       = useState(false)
  const hideTimer                  = useState(null)
  const photo = photos[index]

  // Cinema mode — hide UI after 3s idle
  const resetTimer = useCallback(() => {
    clearTimeout(hideTimer[0])
    setUiVisible(true)
    hideTimer[0] = setTimeout(() => setUiVisible(false), 3000)
  }, [])

  useEffect(() => { resetTimer() }, [index])
  useEffect(() => () => clearTimeout(hideTimer[0]), [])

  const prev = () => setIndex(i => Math.max(0, i - 1))
  const next = () => setIndex(i => Math.min(photos.length - 1, i + 1))

  const handlers = useSwipeable({
    onSwipedLeft:  () => { next(); resetTimer() },
    onSwipedRight: () => { prev(); resetTimer() },
    onSwipedUp:    () => { setUiVisible(false) },
    onSwipedDown:  () => onClose(),
    trackTouch: true,
    trackMouse: false,
    delta: 30,
    preventScrollOnSwipingX: true,
  })

  const handleDownload = async () => {
    if (dlAnim) return
    setDlAnim(true)
    try {
      const a = document.createElement('a')
      a.href = photo.url_original || photo.url_preview || photo.thumb
      a.download = photo.filename || 'photo.jpg'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => { setDlDone(true); setTimeout(() => { setDlAnim(false); setDlDone(false) }, 1200) }, 300)
    } catch { setDlAnim(false) }
  }

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-ink z-50 flex flex-col select-none"
      style={{ touchAction: 'none' }}
      onClick={() => { resetTimer() }}
      {...handlers}
    >
      {/* Photo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={photo.id}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <img
            src={photo.url_preview || photo.thumb}
            alt={photo.filename}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* UI Overlay */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            className="absolute inset-0 flex flex-col justify-between pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-8
              bg-gradient-to-b from-ink/75 via-ink/30 to-transparent pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="w-10 h-10 rounded-full bg-cream/10 backdrop-blur-sm border border-cream/20
                  flex items-center justify-center text-cream active:scale-95 transition-transform"
              >
                ✕
              </button>

              <div className="text-center">
                <p className="text-cream/70 text-xs font-sans">
                  {index + 1} <span className="text-cream/30">/</span> {photos.length}
                </p>
              </div>

              {/* Share button */}
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  if (navigator.share) {
                    await navigator.share({ title: photo.filename, url: photo.url_preview || photo.thumb })
                  }
                }}
                className="w-10 h-10 rounded-full bg-cream/10 backdrop-blur-sm border border-cream/20
                  flex items-center justify-center text-cream active:scale-95 transition-transform"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
              </button>
            </div>

            {/* ── Bottom Controls ── */}
            <div className="pb-safe pb-6 px-4
              bg-gradient-to-t from-ink/85 via-ink/40 to-transparent pointer-events-auto">

              {/* Filmstrip */}
              <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none mb-3"
                style={{ scrollbarWidth: 'none' }}>
                {photos.map((p, i) => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setIndex(i); resetTimer() }}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all duration-200
                      ${i === index
                        ? 'ring-2 ring-gold ring-offset-1 ring-offset-ink opacity-100'
                        : 'opacity-40 hover:opacity-70'
                      }`}
                  >
                    <img src={p.thumb || p.url_thumb} className="w-full h-full object-cover" draggable={false} />
                  </motion.button>
                ))}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-3">
                {/* Prev/Next */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); resetTimer() }}
                    disabled={index === 0}
                    className="w-10 h-10 rounded-full bg-cream/10 backdrop-blur-sm border border-cream/20
                      flex items-center justify-center text-cream disabled:opacity-30 text-lg active:scale-95 transition-transform"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); resetTimer() }}
                    disabled={index === photos.length - 1}
                    className="w-10 h-10 rounded-full bg-cream/10 backdrop-blur-sm border border-cream/20
                      flex items-center justify-center text-cream disabled:opacity-30 text-lg active:scale-95 transition-transform"
                  >
                    ›
                  </button>
                </div>

                {/* Download button — takes full remaining space */}
                <motion.button
                  onClick={(e) => { e.stopPropagation(); handleDownload() }}
                  animate={dlAnim && !dlDone ? { y: [0, 4, 0] } : {}}
                  whileTap={{ scale: 0.96 }}
                  className={`flex-1 h-10 rounded-full font-sans font-medium text-xs flex items-center justify-center gap-2
                    transition-all duration-300
                    ${dlDone
                      ? 'bg-green-500/80 text-white'
                      : 'bg-gold text-ink active:bg-gold-light'
                    }`}
                >
                  {dlDone ? (
                    <><span>✓</span> Saved!</>
                  ) : dlAnim ? (
                    <><span className="animate-bounce">⬇</span> Saving...</>
                  ) : (
                    <><span>⬇</span> Download</>
                  )}
                </motion.button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe hint (only first open) */}
      <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="text-cream/30 text-xs whitespace-nowrap"
        >
          ← Swipe to navigate · Swipe down to close →
        </motion.p>
      </div>
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'

export default function GuestPreviewPanel({ features }) {
  const showFace = features.face_scan !== false
  const showQR = features.qr_access !== false
  const showTable = features.table_browsing !== false

  return (
    <div className="bg-cream border border-ink/10 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
      <div className="absolute top-0 right-0 p-3">
        <span className="text-[10px] font-sans font-medium tracking-widest text-gold uppercase border border-gold/30 px-2 py-1 rounded-full">
          Live Preview
        </span>
      </div>

      <div className="w-[280px] bg-white rounded-[2rem] shadow-2xl border-[4px] border-ink/5 p-4 flex flex-col">
        <div className="text-center mt-4 mb-6">
          <div className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-3 bg-cream">
            <span className="text-gold text-xs">✦</span>
          </div>
          <h3 className="font-serif italic text-lg leading-tight">Sophia & Daniel's<br />Wedding</h3>
        </div>

        <div className="space-y-2 flex-1">
          <AnimatePresence>
            {showFace && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-ink text-cream p-3 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center">👤</div>
                <div>
                  <p className="text-xs font-medium">Scan My Face</p>
                  <p className="text-[10px] text-cream/60">AI finds your photos</p>
                </div>
              </motion.div>
            )}

            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-ink/10 text-ink p-3 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-ink/5 rounded-lg flex items-center justify-center">📷</div>
                <div>
                  <p className="text-xs font-medium">Scan QR Code</p>
                  <p className="text-[10px] text-muted">From your invitation</p>
                </div>
              </motion.div>
            )}

            {showTable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-ink/10 text-ink p-3 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-ink/5 rounded-lg flex items-center justify-center">🪑</div>
                <div>
                  <p className="text-xs font-medium">Table Number</p>
                  <p className="text-[10px] text-muted">Browse by seating</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showFace && !showQR && !showTable && (
            <p className="text-center text-[10px] text-muted italic mt-4">
              All access methods are disabled.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

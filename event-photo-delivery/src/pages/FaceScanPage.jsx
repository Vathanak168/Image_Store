import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { faceScan } from '../lib/api'

export default function FaceScanPage() {
  const navigate    = useNavigate()
  const { token }   = useParams()
  const inputRef    = useRef(null)
  const [phase, setPhase]       = useState('idle')  // idle|preview|scanning|results|error
  const [preview, setPreview]   = useState(null)
  const [results, setResults]   = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    setPhase('preview')

    // Start scanning
    setPhase('scanning')
    try {
      const tok = token || 'demo'
      const res = await faceScan(file, tok)
      setResults(res.matches || [])
      setPhase('results')
    } catch (err) {
      setErrorMsg(err.message || 'Face scan failed')
      setPhase('error')
    }
  }

  const retake = () => {
    setPhase('idle')
    setPreview(null)
    setResults([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const viewGallery = () => {
    navigate(token ? `/g/${token}` : '/g/demo')
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent z-10" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-cream/10 border border-cream/20 text-cream flex items-center justify-center">
          ←
        </button>
        <div className="text-center">
          <p className="text-cream font-serif text-lg italic">Face Scan</p>
          <p className="text-muted text-xs">Take a selfie to find your photos</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">

        {/* ── IDLE phase ── */}
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full max-w-xs">

              {/* Selfie circle */}
              <div className="w-44 h-44 rounded-full border-2 border-gold/40 flex items-center justify-center mb-8 bg-cream/5 relative">
                <span className="text-6xl">👤</span>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gold rounded-full flex items-center justify-center text-ink text-lg">
                  📷
                </div>
              </div>

              <h2 className="text-cream font-serif text-2xl italic mb-2">Take a Selfie</h2>
              <p className="text-muted text-sm text-center mb-8 leading-relaxed">
                We'll use AI to find all photos where you appear at the event.
              </p>

              {/* Hidden file input — capture=user opens front camera on mobile */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFile}
              />

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => inputRef.current?.click()}
                className="w-full py-4 bg-gold text-ink rounded-2xl font-medium font-sans text-sm mb-3 flex items-center justify-center gap-2">
                <span>📷</span> Take Selfie (Front Camera)
              </motion.button>

              {/* Upload fallback (no capture — opens file picker) */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="upload-fallback"
                onChange={handleFile}
              />
              <label htmlFor="upload-fallback"
                className="w-full py-3.5 border border-cream/20 rounded-2xl text-cream/60 text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-cream/5 transition-colors">
                <span>🖼️</span> Choose from Gallery
              </label>

              <p className="text-muted/60 text-xs text-center mt-6">
                Your selfie is not stored. Used only for matching.
              </p>
            </motion.div>
          )}

          {/* ── SCANNING phase ── */}
          {phase === 'scanning' && (
            <motion.div key="scanning"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center">

              {preview && (
                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-gold/50 mb-6">
                  <img src={preview} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Pulse rings */}
              <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    className="absolute inset-0 rounded-full border border-gold/40"
                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, delay: i * 0.5, repeat: Infinity }}
                  />
                ))}
                <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              </div>

              <p className="text-cream font-serif text-xl italic mb-2">Scanning...</p>
              <p className="text-muted text-sm">AI is searching through event photos</p>
            </motion.div>
          )}

          {/* ── RESULTS phase ── */}
          {phase === 'results' && (
            <motion.div key="results"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center w-full max-w-xs">

              {preview && (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold mb-4">
                  <img src={preview} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mb-3 text-gold text-lg">
                ✓
              </div>
              <p className="text-cream font-serif text-2xl italic mb-1">
                {results.length} Photos Found
              </p>
              <p className="text-muted text-xs mb-8">
                Matched across {results.filter(r => r.confidence >= 0.85).length} confirmed · {results.filter(r => r.confidence < 0.85).length} suggested
              </p>

              {/* Confidence breakdown */}
              <div className="w-full space-y-2 mb-6">
                <div className="flex justify-between items-center p-3 rounded-xl bg-cream/5 border border-cream/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    <span className="text-cream text-sm">Confirmed matches</span>
                  </div>
                  <span className="text-gold font-medium text-sm">{results.filter(r => r.confidence >= 0.85).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-cream/5 border border-cream/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                    <span className="text-cream text-sm">Suggested</span>
                  </div>
                  <span className="text-muted text-sm">{results.filter(r => r.confidence < 0.85).length}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={viewGallery}
                className="w-full py-4 bg-gold text-ink rounded-2xl font-medium font-sans text-sm mb-3">
                View My Photos →
              </motion.button>
              <button onClick={retake}
                className="text-muted text-xs underline-offset-2 underline">
                Retake selfie
              </button>
            </motion.div>
          )}

          {/* ── ERROR phase ── */}
          {phase === 'error' && (
            <motion.div key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center w-full max-w-xs text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-cream font-serif text-xl italic mb-2">Scan Failed</p>
              <p className="text-muted text-sm mb-6">{errorMsg}</p>
              <button onClick={retake}
                className="w-full py-4 bg-gold text-ink rounded-2xl font-medium text-sm mb-3">
                Try Again
              </button>
              <button onClick={viewGallery}
                className="text-muted text-xs underline">
                Skip — Browse all photos
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

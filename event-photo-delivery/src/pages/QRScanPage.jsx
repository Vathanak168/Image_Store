import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanPage() {
  const navigate   = useNavigate()
  const scannerRef = useRef(null)
  const [status, setStatus]     = useState('starting') // starting | scanning | error | success
  const [errorMsg, setErrorMsg] = useState('')
  const [cameras, setCameras]   = useState([])
  const [camIdx, setCamIdx]     = useState(0)

  useEffect(() => {
    let html5Qr = null

    const start = async () => {
      try {
        const devices = await Html5Qrcode.getCameras()
        if (!devices || devices.length === 0) {
          setStatus('error')
          setErrorMsg('No camera found on this device.')
          return
        }
        setCameras(devices)

        // Prefer back camera on mobile
        const backCam = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        )
        const cam = backCam || devices[devices.length - 1]

        html5Qr = new Html5Qrcode('qr-reader')
        scannerRef.current = html5Qr

        await html5Qr.start(
          cam.id,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            // QR Code contains the gallery URL or just the token
            setStatus('success')
            html5Qr.stop().then(() => {
              // Handle both full URL and token-only QR codes
              if (decodedText.startsWith('http')) {
                const url = new URL(decodedText)
                navigate(url.pathname + url.search)
              } else {
                navigate(`/g/${decodedText}`)
              }
            })
          },
          () => {} // ignore per-frame errors
        )
        setStatus('scanning')
      } catch (err) {
        setStatus('error')
        setErrorMsg(err.message || 'Camera permission denied.')
      }
    }

    start()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [camIdx])

  const switchCamera = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setCamIdx(i => (i + 1) % cameras.length)
    setStatus('starting')
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Top gold line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent z-10" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4 z-10">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-cream/10 border border-cream/20 text-cream flex items-center justify-center text-lg">
          ←
        </button>
        <div className="text-center">
          <p className="text-cream font-serif text-lg italic">Scan QR Code</p>
          <p className="text-muted text-xs font-sans">Point at your invitation card</p>
        </div>
        {cameras.length > 1 ? (
          <button onClick={switchCamera}
            className="w-10 h-10 rounded-full bg-cream/10 border border-cream/20 text-cream flex items-center justify-center text-sm">
            🔄
          </button>
        ) : <div className="w-10" />}
      </div>

      {/* Camera viewport */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="relative w-full max-w-sm">
          {/* QR reader container */}
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" />

          {/* Corner frame overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Animated scan line */}
              <motion.div
                className="absolute left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Corner brackets */}
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-gold ${cls}`} />
              ))}
            </div>
          )}

          {/* Status overlays */}
          <AnimatePresence>
            {status === 'starting' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink/80 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-cream text-sm">Starting camera...</p>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gold/20 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="text-4xl mb-2">✓</div>
                  <p className="text-gold font-medium">QR Code Detected!</p>
                  <p className="text-cream/70 text-xs mt-1">Opening your gallery...</p>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full aspect-square bg-ink border border-cream/10 rounded-2xl flex flex-col items-center justify-center p-6">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-cream text-sm text-center mb-1">Camera Unavailable</p>
                <p className="text-muted text-xs text-center mb-4">{errorMsg}</p>
                <p className="text-muted text-xs text-center">
                  Please allow camera access in your browser settings, then refresh.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instruction */}
        {status === 'scanning' && (
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-cream/50 text-xs text-center mt-6 font-sans max-w-xs">
            Hold your phone steady above the QR code on your invitation or seat card
          </motion.p>
        )}

        {/* Manual fallback */}
        <div className="mt-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-[1px] bg-cream/10" />
            <span className="text-muted text-xs">or try instead</span>
            <div className="flex-1 h-[1px] bg-cream/10" />
          </div>
          <button onClick={() => navigate('/table')}
            className="w-full py-3.5 border border-cream/20 rounded-xl text-cream/70 text-sm hover:bg-cream/5 transition-colors flex items-center justify-center gap-2">
            <span>🪑</span> Enter Table Number
          </button>
        </div>
      </div>
    </div>
  )
}

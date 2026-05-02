import { QRCodeSVG } from 'qrcode.react'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function QRGenerator({ guest, baseUrl }) {
  const [showModal, setShowModal] = useState(false)
  const svgRef = useRef(null)
  const galleryUrl = `${baseUrl || window.location.origin}/g/${guest.token}`

  const downloadQR = () => {
    const svg = svgRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#FAFAF8'
      ctx.fillRect(0, 0, 800, 800)
      ctx.drawImage(img, 100, 100, 600, 600)
      // Add guest name
      ctx.fillStyle = '#0A0A0A'
      ctx.font = '600 28px "DM Sans", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(guest.name, 400, 770)
      const a = document.createElement('a')
      a.download = `QR_${guest.name.replace(/\s/g, '_')}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="text-xs text-gold underline whitespace-nowrap min-h-0 min-w-0">
        QR
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-cream rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="font-serif text-xl italic text-ink mb-1">{guest.name}</p>
            <p className="text-muted text-xs mb-4">Scan to view gallery</p>
            <div ref={svgRef} className="flex justify-center mb-4">
              <QRCodeSVG value={galleryUrl} size={200} level="M"
                fgColor="#0A0A0A" bgColor="#FAFAF8"
                imageSettings={{ src: '', width: 0, height: 0 }} />
            </div>
            <p className="text-muted text-[10px] font-mono break-all mb-4">{galleryUrl.slice(0, 60)}...</p>
            <div className="flex gap-2">
              <button onClick={downloadQR}
                className="flex-1 bg-gold text-ink py-2.5 rounded-lg text-xs font-medium">
                Download PNG
              </button>
              <button onClick={() => { navigator.clipboard.writeText(galleryUrl); }}
                className="flex-1 border border-ink/15 text-ink py-2.5 rounded-lg text-xs">
                Copy Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

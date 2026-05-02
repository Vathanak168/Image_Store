import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NUMPAD = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['','0','⌫'],
]

export default function TablePage() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)

  const press = (key) => {
    if (key === '⌫') {
      setValue(v => v.slice(0, -1))
    } else if (key === '') {
      // empty slot — do nothing
    } else if (value.length < 3) {
      setValue(v => v + key)
    }
  }

  const submit = () => {
    const num = parseInt(value, 10)
    if (!value || num < 1 || num > 999) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    navigate(`/browse/table/${num}`)
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-between pb-safe">
      {/* Top gold line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pt-6 pb-2">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-cream/10 border border-cream/20 text-cream flex items-center justify-center text-lg">
          ←
        </button>
        <div className="text-center">
          <p className="text-cream font-serif text-lg italic">Your Table</p>
          <p className="text-muted text-xs">Find photos from your table</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Display */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-8">
        <p className="text-muted text-xs uppercase tracking-widest mb-6 font-sans">
          Table Number
        </p>

        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`w-full max-w-xs h-20 rounded-2xl border flex items-center justify-center mb-8
            ${value ? 'border-gold/50 bg-gold/5' : 'border-cream/15 bg-cream/5'}`}
        >
          {value ? (
            <span className="font-serif text-6xl text-cream font-light tracking-wider">
              {value}
            </span>
          ) : (
            <span className="text-cream/20 text-4xl font-light">—</span>
          )}
        </motion.div>

        {/* Number Pad */}
        <div className="w-full max-w-xs space-y-2.5">
          {NUMPAD.map((row, ri) => (
            <div key={ri} className="flex gap-2.5">
              {row.map((key, ki) => (
                <motion.button
                  key={ki}
                  whileTap={key ? { scale: 0.92 } : {}}
                  onClick={() => press(key)}
                  disabled={!key && key !== '0'}
                  className={`flex-1 h-16 rounded-2xl text-xl font-light transition-colors
                    ${key === '⌫'
                      ? 'text-muted bg-cream/5 border border-cream/10 text-base'
                      : key
                        ? 'text-cream bg-cream/8 border border-cream/15 active:bg-cream/15 hover:bg-cream/12'
                        : 'invisible'
                    }`}
                >
                  {key}
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={!value}
          className={`w-full max-w-xs mt-6 py-4 rounded-2xl font-sans font-medium text-sm transition-all
            ${value
              ? 'bg-gold text-ink shadow-lg shadow-gold/20'
              : 'bg-cream/10 text-cream/30'
            }`}
        >
          {value ? `View Table ${value} Photos →` : 'Enter table number'}
        </motion.button>
      </div>

      {/* Alt options */}
      <div className="w-full max-w-xs px-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-[1px] bg-cream/10" />
          <span className="text-muted text-xs">or</span>
          <div className="flex-1 h-[1px] bg-cream/10" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/scan-qr')}
            className="flex-1 py-3 border border-cream/20 rounded-xl text-cream/60 text-xs hover:bg-cream/5 transition-colors flex items-center justify-center gap-1.5">
            📷 Scan QR
          </button>
          <button onClick={() => navigate('/face-scan')}
            className="flex-1 py-3 border border-cream/20 rounded-xl text-cream/60 text-xs hover:bg-cream/5 transition-colors flex items-center justify-center gap-1.5">
            👤 Scan Face
          </button>
        </div>
      </div>
    </div>
  )
}

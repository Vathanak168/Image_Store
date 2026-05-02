import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TableConfigModal({ isOpen, onClose, onSave, isSaving }) {
  const [step, setStep] = useState(1)
  const [count, setCount] = useState(20)
  const [naming, setNaming] = useState('numeric') // 'numeric' | 'alphabetic' | 'custom'

  if (!isOpen) return null

  // Reset state when closing/opening
  const handleClose = () => {
    setStep(1)
    onClose()
  }

  const handleNext = () => {
    if (count > 0 && count <= 200) {
      setStep(2)
    }
  }

  const handleConfirm = () => {
    onSave({
      table_count: parseInt(count, 10),
      table_naming: naming
    })
  }

  const generatePreview = () => {
    const preview = []
    const limit = Math.min(count, 5) // Show max 5 in preview
    for (let i = 1; i <= limit; i++) {
      if (naming === 'numeric') preview.push(`Table ${i}`)
      else if (naming === 'alphabetic') {
        // Simple A-Z logic for preview (A=1...Z=26)
        let label = ''
        let n = i
        while (n > 0) {
          n--
          label = String.fromCharCode(65 + (n % 26)) + label
          n = Math.floor(n / 26)
        }
        preview.push(`Table ${label}`)
      }
      else preview.push(`Table ${i} (Unlabeled)`)
    }
    if (count > 5) preview.push(`... and ${count - 5} more`)
    return preview
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-cream w-full max-w-md rounded-2xl shadow-xl border border-ink/10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
            <h2 className="font-serif text-xl text-ink">
              Configure Tables
            </h2>
            <button onClick={handleClose} className="text-muted hover:text-ink">✕</button>
          </div>
          
          <div className="p-6">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Number of Tables
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={count}
                    onChange={e => setCount(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-ink/20 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-3">
                    Table Naming Convention
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-ink/10 rounded-lg cursor-pointer hover:bg-ink/5 transition-colors">
                      <input 
                        type="radio" 
                        name="naming" 
                        value="numeric"
                        checked={naming === 'numeric'}
                        onChange={() => setNaming('numeric')}
                        className="text-gold focus:ring-gold"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink">Numeric</p>
                        <p className="text-xs text-muted">Table 1, Table 2, Table 3...</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-ink/10 rounded-lg cursor-pointer hover:bg-ink/5 transition-colors">
                      <input 
                        type="radio" 
                        name="naming" 
                        value="alphabetic"
                        checked={naming === 'alphabetic'}
                        onChange={() => setNaming('alphabetic')}
                        className="text-gold focus:ring-gold"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink">Alphabetic</p>
                        <p className="text-xs text-muted">Table A, Table B, Table C...</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-ink/10 rounded-lg cursor-pointer hover:bg-ink/5 transition-colors">
                      <input 
                        type="radio" 
                        name="naming" 
                        value="custom"
                        checked={naming === 'custom'}
                        onChange={() => setNaming('custom')}
                        className="text-gold focus:ring-gold"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink">Custom</p>
                        <p className="text-xs text-muted">You will manually set each table's name later.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={count < 1}
                    className="px-6 py-2.5 bg-ink text-cream rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg text-sm">
                  <strong>Warning:</strong> Generating tables will delete any currently configured tables for this event. 
                  Any photos already uploaded to existing tables will lose their table tag.
                </div>

                <div>
                  <h3 className="text-sm font-medium text-ink mb-2">Preview</h3>
                  <div className="bg-white border border-ink/10 rounded-lg p-4 space-y-2">
                    {generatePreview().map((label, i) => (
                      <div key={i} className="text-sm text-muted">{label}</div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm text-ink hover:bg-ink/5 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-ink text-cream rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Generating...' : 'Confirm & Generate'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

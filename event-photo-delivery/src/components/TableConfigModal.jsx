import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TableConfigModal({ isOpen, onClose, onSave, initialData = null, isSaving }) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '')
      setNumber(initialData?.table_number || '')
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      table_number: number ? parseInt(number, 10) : null
    })
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
              {initialData ? 'Edit Table' : 'Add New Table'}
            </h2>
            <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
                Table Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., VIP Table, Table 1"
                required
                className="w-full px-4 py-2 bg-white border border-ink/20 rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">
                Table Number (Optional)
              </label>
              <input
                type="number"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="For sorting purposes"
                className="w-full px-4 py-2 bg-white border border-ink/20 rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-ink hover:bg-black/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="px-6 py-2 bg-ink text-cream text-sm rounded-lg hover:bg-ink/80 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Table'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

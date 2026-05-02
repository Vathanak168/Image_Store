import { motion, AnimatePresence } from 'framer-motion'

export default function FindMyPhotosDrawer({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-cream rounded-t-[2rem] shadow-2xl border-t border-ink/10 overflow-hidden"
          >
            <div className="flex flex-col max-h-[85vh]">
              {/* Drawer Handle */}
              <div className="w-full pt-4 pb-2 flex justify-center shrink-0 cursor-pointer" onClick={onClose}>
                <div className="w-12 h-1.5 bg-ink/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-ink/5 shrink-0 flex items-center justify-between">
                <h2 className="font-serif text-xl italic text-ink">{title}</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-muted hover:bg-ink/10 transition-colors">
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

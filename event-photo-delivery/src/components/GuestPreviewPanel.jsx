import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from '../pages/LandingPage'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// We create a fresh QueryClient just for the preview so it doesn't pollute the main one
const previewQc = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } }
})

export default function GuestPreviewPanel({ isOpen, onClose, eventConfig }) {
  if (!isOpen) return null

  // We pre-populate the query cache for the LandingPage to use
  previewQc.setQueryData(['eventConfig', eventConfig.id], eventConfig)

  const activeFeatures = []
  if (eventConfig.features?.face_scan !== false) activeFeatures.push('Face Scan')
  if (eventConfig.features?.qr_access !== false) activeFeatures.push('QR')
  if (eventConfig.features?.table_browse !== false) activeFeatures.push('Tables')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-ink/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ink/10 shrink-0 bg-cream">
              <div>
                <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                  <span>👁</span> Guest Preview
                </h3>
                <p className="text-xs text-muted font-sans">Exactly what your guests will see</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 text-muted transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Preview Area (Simulated Phone) */}
            <div className="flex-1 bg-ink/5 p-6 overflow-y-auto flex justify-center items-start">
              <div className="w-[320px] h-[650px] bg-white rounded-[2.5rem] shadow-xl border-[6px] border-ink/10 overflow-hidden relative shrink-0">
                {/* Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                  <div className="w-32 h-5 bg-ink/10 rounded-b-xl backdrop-blur-md" />
                </div>
                
                <div className="w-full h-full overflow-y-auto scrollbar-hide relative pointer-events-none">
                  {/* We use MemoryRouter to render the LandingPage without affecting actual URL */}
                  <QueryClientProvider client={previewQc}>
                    <MemoryRouter initialEntries={[`/e/${eventConfig.id}`]}>
                      <Routes>
                        <Route path="/e/:eventId" element={<LandingPage isPreview={true} />} />
                      </Routes>
                    </MemoryRouter>
                  </QueryClientProvider>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-ink/10 shrink-0 bg-cream space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Mode:</span>
                <span className="font-medium text-ink">
                  {eventConfig.mode === 'multi_session' ? 'Multi-Session' : 'Simple'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Features active:</span>
                <span className="font-medium text-ink text-right">
                  {activeFeatures.length > 0 ? activeFeatures.join(', ') : 'None'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Tables:</span>
                <span className="font-medium text-ink">
                  {eventConfig.table_count > 0 ? `${eventConfig.table_count} (${eventConfig.table_naming})` : 'Not configured'}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

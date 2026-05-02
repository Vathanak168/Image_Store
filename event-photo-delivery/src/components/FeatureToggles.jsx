import { useFeatureToggles } from '../hooks/useFeatureToggles'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function FeatureToggles({ event, adminSecret }) {
  const { updateToggles, isUpdating } = useFeatureToggles(event.id, adminSecret)
  const navigate = useNavigate()

  const currentFeatures = event.features || {}
  const toggleStatus = event.toggle_status || {}

  const TOGGLE_DEPENDENCIES = {
    face_scan: {
      label: 'AI Face Scan',
      description: 'Guests take a selfie to find photos',
      link: 'photos',
    },
    qr_access: {
      label: 'QR Code Access',
      description: 'Guests scan personal QR from invitation',
      link: 'guests',
    },
    table_browse: {
      label: 'Table Number Browse',
      description: 'Guests find photos by table number',
      link: 'tables',
    },
    download: {
      label: 'Photo Downloads',
      description: 'Allow guests to download originals',
    },
    show_suggested: {
      label: 'Show Suggested Photos',
      description: 'Show lower confidence AI matches',
    },
  }

  const handleToggle = async (featureId, isCurrentlyEnabled) => {
    await updateToggles({ [featureId]: !isCurrentlyEnabled })
  }

  return (
    <div className="bg-white border border-ink/10 rounded-xl p-6">
      <h2 className="font-serif text-xl text-ink mb-2">Guest Access Features</h2>
      <p className="text-muted text-sm mb-6">
        Control what guests see on the landing page.
      </p>

      <div className="space-y-6">
        {Object.entries(TOGGLE_DEPENDENCIES).map(([id, config]) => {
          const isEnabled = currentFeatures[id] !== false
          const status = toggleStatus[id] || { ready: true, reason: null }

          return (
            <div key={id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-ink/5 last:border-0 last:pb-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-sans font-medium text-ink text-sm">{config.label}</p>
                  
                  {/* Status Badge */}
                  {isEnabled && status.ready && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                      ✅ Ready
                    </span>
                  )}
                  {isEnabled && !status.ready && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                      ⚠️ Not ready
                    </span>
                  )}
                  {!isEnabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink/5 text-muted border border-ink/10 flex items-center gap-1">
                      ⚙️ Setup needed
                    </span>
                  )}
                </div>
                
                <p className="text-muted text-xs">{config.description}</p>
                
                {/* Dependency Warning */}
                {isEnabled && !status.ready && status.reason && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center gap-2">
                    <span className="text-orange-400">└─</span> {status.reason}
                    {config.link && (
                      <button 
                        onClick={() => navigate(`../${config.link}`)}
                        className="underline hover:text-orange-800 transition-colors font-medium ml-1"
                      >
                        [Setup →]
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <button
                disabled={isUpdating}
                onClick={() => handleToggle(id, isEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 mt-1 sm:mt-0
                  ${isEnabled ? 'bg-gold' : 'bg-ink/20'}
                  ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: isEnabled ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

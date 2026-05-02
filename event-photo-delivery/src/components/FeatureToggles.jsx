import { useFeatureToggles } from '../hooks/useFeatureToggles'
import { motion } from 'framer-motion'

export default function FeatureToggles({ eventId, currentFeatures, adminSecret }) {
  const { updateToggles, isUpdating } = useFeatureToggles(eventId, adminSecret)

  const featuresList = [
    { id: 'face_scan', label: 'AI Face Scan', desc: 'Allow guests to find photos by taking a selfie.' },
    { id: 'qr_access', label: 'QR Code Access', desc: 'Allow guests to scan physical invitation cards.' },
    { id: 'table_browsing', label: 'Table Browsing', desc: 'Allow guests to browse photos by seating table.' },
    { id: 'download', label: 'Photo Downloads', desc: 'Allow guests to download high-resolution photos.' },
    { id: 'show_suggested', label: 'Suggested Photos', desc: 'Show lower-confidence matches to guests.' },
  ]

  const handleToggle = async (featureId, currentValue) => {
    await updateToggles({ [featureId]: !currentValue })
  }

  return (
    <div className="bg-white border border-ink/10 rounded-xl p-6">
      <h2 className="font-serif text-xl text-ink mb-2">Guest Features</h2>
      <p className="text-muted text-sm mb-6">
        Turn specific access methods and gallery features on or off. Changes reflect instantly on the guest page.
      </p>

      <div className="space-y-4">
        {featuresList.map((feat) => {
          const isEnabled = currentFeatures[feat.id] !== false // true by default if undefined
          return (
            <div key={feat.id} className="flex items-center justify-between py-3 border-b border-ink/5 last:border-0">
              <div>
                <p className="font-sans font-medium text-ink text-sm">{feat.label}</p>
                <p className="text-muted text-xs mt-0.5">{feat.desc}</p>
              </div>
              <button
                disabled={isUpdating}
                onClick={() => handleToggle(feat.id, isEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0
                  ${isEnabled ? 'bg-gold' : 'bg-ink/20'}
                  ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{
                    x: isEnabled ? 24 : 4
                  }}
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

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  const options = [
    {
      icon: '👤',
      label: 'Scan My Face',
      sub: 'AI finds your photos',
      action: () => navigate('/face-scan'),
      primary: true,
    },
    {
      icon: '📷',
      label: 'Scan QR Code',
      sub: 'From your invitation',
      action: () => navigate('/scan-qr'),
    },
    {
      icon: '🪑',
      label: 'Table Number',
      sub: 'Browse by seating',
      action: () => navigate('/table'),
    },
  ]

  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-hidden">

      {/* Top gold line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent z-10" />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gold/5 blur-2xl" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Event branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 w-full max-w-xs"
        >
          {/* Logo mark */}
          <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-6">
            <span className="text-gold text-xl">✦</span>
          </div>

          <p className="text-muted text-[10px] uppercase tracking-[0.2em] mb-3 font-sans">
            Welcome to
          </p>
          <h1 className="font-serif text-[38px] sm:text-[44px] font-light italic text-ink leading-[1.15] mb-3">
            Sophia & Daniel's<br />Wedding
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted text-xs font-sans">
            <span>June 14, 2025</span>
            <span className="w-1 h-1 rounded-full bg-muted/40 inline-block" />
            <span>Grand Sofitel, Phnom Penh</span>
          </div>
        </motion.div>

        {/* Gold divider */}
        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mb-10" />

        {/* Access options */}
        <div className="w-full max-w-xs space-y-3">
          {options.map((opt, i) => (
            <motion.button
              key={opt.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={opt.action}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all
                ${opt.primary
                  ? 'bg-ink text-cream shadow-xl shadow-ink/20 border border-ink'
                  : 'bg-white border border-ink/10 text-ink hover:border-gold/40 hover:bg-gold/5'
                }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                ${opt.primary ? 'bg-gold/20' : 'bg-ink/5'}`}>
                {opt.icon}
              </div>
              <div className="text-left flex-1">
                <p className={`font-sans font-medium text-sm ${opt.primary ? 'text-cream' : 'text-ink'}`}>
                  {opt.label}
                </p>
                <p className={`text-xs mt-0.5 ${opt.primary ? 'text-cream/50' : 'text-muted'}`}>
                  {opt.sub}
                </p>
              </div>
              <span className={`text-sm ${opt.primary ? 'text-gold' : 'text-muted'}`}>→</span>
            </motion.button>
          ))}
        </div>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted/50 text-[10px] text-center mt-8 max-w-[200px] leading-relaxed font-sans"
        >
          Photos are private. Only you can access your gallery via your unique link.
        </motion.p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center pb-8">
        <button
          onClick={() => navigate('/admin')}
          className="text-muted/40 text-[10px] hover:text-muted/70 transition-colors font-sans"
        >
          Photographer Admin ↗
        </button>
      </div>
    </div>
  )
}

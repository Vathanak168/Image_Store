import { motion } from 'framer-motion'

export default function SessionTabs({ sessions, activeSessionId, onSelectSession }) {
  if (!sessions || sessions.length <= 1) return null

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-3 border-b border-ink/10 bg-cream sticky top-[68px] z-20">
      <div className="flex px-4 gap-2 min-w-max">
        <button
          onClick={() => onSelectSession(null)}
          className={`relative px-4 py-2 rounded-full text-sm font-sans transition-colors
            ${activeSessionId === null ? 'text-cream' : 'text-ink hover:bg-ink/5'}`}
        >
          {activeSessionId === null && (
            <motion.div
              layoutId="session-tab-bg"
              className="absolute inset-0 bg-ink rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">All Photos</span>
        </button>

        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`relative px-4 py-2 rounded-full text-sm font-sans flex items-center gap-2 transition-colors
              ${activeSessionId === session.id ? 'text-cream' : 'text-ink hover:bg-ink/5'}`}
          >
            {activeSessionId === session.id && (
              <motion.div
                layoutId="session-tab-bg"
                className="absolute inset-0 bg-ink rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{session.icon}</span>
            <span className="relative z-10">{session.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function SessionTabs({ sessions, activeSessionId, onSelect }) {
  // Use activeSessionId from props if provided, otherwise manage local state
  // defaulting to the first session's ID
  const defaultId = sessions && sessions.length > 0 ? sessions[0].id : null
  const [active, setActive] = useState(activeSessionId !== undefined ? activeSessionId : defaultId)

  // Sync internal state if prop changes
  useEffect(() => {
    if (activeSessionId !== undefined) {
      setActive(activeSessionId)
    }
  }, [activeSessionId])

  if (!sessions || sessions.length === 0) return null

  const handleSelect = (id) => {
    setActive(id)
    if (onSelect) onSelect(id)
  }

  return (
    <div className="mt-8 mb-6 w-full px-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted text-center mb-4 font-sans font-medium">
        Browse by session
      </p>
      <div className="flex gap-2 justify-center flex-wrap max-w-2xl mx-auto">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => handleSelect(session.id)}
            className={`
              relative px-5 py-2.5 rounded-full text-sm font-sans transition-all duration-300
              flex items-center gap-2 border
              ${active === session.id
                ? 'bg-gold text-white border-gold shadow-md shadow-gold/20'
                : 'bg-white border-ink/10 text-muted hover:border-gold/50 hover:text-ink'
              }
            `}
          >
            {session.icon && <span className="text-base leading-none">{session.icon}</span>}
            <span className="font-medium">{session.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

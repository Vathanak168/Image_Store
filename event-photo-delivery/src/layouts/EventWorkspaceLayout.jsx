import { useState } from 'react'
import { Outlet, useParams, NavLink, useNavigate } from 'react-router-dom'
import { useEventConfig } from '../hooks/useEventConfig'

export default function EventWorkspaceLayout() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  
  // Note: We're simulating having adminSecret stored. In reality, it might come from context/auth.
  const adminSecret = localStorage.getItem('admin_secret') || 'admin_secret_12345'
  
  const { data: event, isLoading } = useEventConfig(eventId)
  
  if (isLoading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center">Loading Workspace...</div>
  }

  if (!event) {
    return <div className="min-h-screen bg-cream p-8">Event not found.</div>
  }

  const NAV_ITEMS = [
    { label: "Overview",  path: "overview",  icon: "⚡️" },
    { label: "Guests",    path: "guests",    icon: "👥" },
    { label: "Photos",    path: "photos",    icon: "🖼" },
    { label: "Tables",    path: "tables",    icon: "🪑" },
    { label: "Sessions",  path: "sessions",  icon: "📋",
      showIf: (ev) => ev.mode === "multi_session" },
    { label: "Delivery",  path: "delivery",  icon: "📤" },
    { label: "Analytics", path: "analytics", icon: "📊" },
    { label: "Settings",  path: "settings",  icon: "⚙️" },
  ]

  const visibleNavItems = NAV_ITEMS.filter(item => !item.showIf || item.showIf(event))

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-ink/10 flex flex-col shrink-0">
        <div className="p-6 border-b border-ink/5">
          <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => navigate('/admin')}>
            <div className="w-8 h-8 rounded border border-ink/10 flex items-center justify-center text-xs text-muted hover:bg-ink/5">
              ←
            </div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-sans font-medium">All Events</p>
          </div>
          <h2 className="font-serif text-xl text-ink leading-tight truncate">{event.name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${event.mode === 'multi_session' ? 'bg-gold' : 'bg-green-500'}`} />
            <span className="text-[10px] text-muted font-sans uppercase">
              {event.mode === 'multi_session' ? 'Multi-Session' : 'Simple Mode'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-sans transition-colors
                ${isActive ? 'bg-ink/5 text-ink font-medium' : 'text-muted hover:text-ink hover:bg-ink/5'}
              `}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ink/5">
          <button 
            onClick={() => window.open(`/e/${eventId}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-ink/20 rounded-lg text-xs font-medium text-ink hover:bg-ink/5 transition-colors"
          >
            <span>👁</span> View Guest Site
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-cream">
        {/* Pass adminSecret down to nested routes */}
        <Outlet context={{ adminSecret, event }} />
      </main>
    </div>
  )
}

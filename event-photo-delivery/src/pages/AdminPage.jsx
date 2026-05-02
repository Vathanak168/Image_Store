import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  createEvent, updateEvent, getEvent, importGuests, sendInvites, listGuests,
  uploadPhoto, publishPhoto, listSessions, createSession, deleteSession, updateSession
} from '../lib/api'
import QRGenerator from '../components/QRGenerator'

const DEFAULT_FEATURES = {
  face_scan: true,
  qr_access: true,
  table_browse: true,
  download: true,
  show_suggested: true
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [adminSecret, setAdminSecret] = useState('')
  const [authed, setAuthed]           = useState(false)
  const [activeTab, setActiveTab]     = useState(0)
  const [toast, setToast]             = useState(null)

  // Event state
  const [eventId, setEventId] = useState('')
  const [eventForm, setEventForm] = useState({
    name: '', date: '', venue: '', slug: '', accent_color: '#C9A96E',
    is_multi_session: false, features: DEFAULT_FEATURES
  })
  const [currentEvent, setCurrentEvent] = useState(null)

  // Sessions state
  const [sessions, setSessions] = useState([])
  const [sessionForm, setSessionForm] = useState({ name: '', order: 0, icon: '💍' })

  // Guests state
  const [guestText, setGuestText]   = useState('[\n  {"name":"Sopheap Chan","phone":"012000001","table_number":1}\n]')
  const [guestResult, setGuestResult] = useState(null)
  const [guestList, setGuestList]   = useState([])

  // Photos state
  const [files, setFiles]         = useState([])
  const [uploadLog, setUploadLog] = useState([])
  const [uploading, setUploading] = useState(false)
  const [staged, setStaged]       = useState([])
  const [uploadSessionId, setUploadSessionId] = useState('')

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load event details if eventId changes
  useEffect(() => {
    if (!eventId || !authed) return
    getEvent(eventId).then(ev => {
      setCurrentEvent(ev)
      setEventForm({
        name: ev.name, date: ev.date, venue: ev.venue, slug: ev.slug,
        accent_color: ev.accent_color, is_multi_session: ev.is_multi_session,
        features: ev.features || DEFAULT_FEATURES
      })
      if (ev.is_multi_session) {
        listSessions(eventId, adminSecret).then(setSessions).catch(console.error)
      }
    }).catch(e => showToast(e.message, 'err'))
  }, [eventId, authed, adminSecret])

  const TABS = currentEvent?.is_multi_session
    ? ['Event', 'Sessions', 'Guests', 'Photos', 'Invite']
    : ['Event', 'Guests', 'Photos', 'Invite']

  const getRealTabIndex = (tabName) => TABS.indexOf(tabName)

  // ── Auth gate ──────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <h1 className="font-serif text-3xl italic text-cream mb-1">Admin Panel</h1>
          <p className="text-muted text-xs mb-6 font-sans">Photographer & Event Manager</p>
          <input
            type="password" placeholder="Enter Admin Secret" value={adminSecret}
            onChange={e => setAdminSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adminSecret && setAuthed(true)}
            className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-3 text-sm mb-3 focus:outline-none focus:border-gold"
          />
          <button onClick={() => adminSecret && setAuthed(true)} className="w-full bg-gold text-ink font-medium py-3 rounded-lg text-sm">
            Enter →
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Handlers ─────────────────────────
  const handleSaveEvent = async () => {
    try {
      if (currentEvent) {
        const ev = await updateEvent(currentEvent.id, eventForm, adminSecret)
        setCurrentEvent(ev)
        showToast('Event updated!')
      } else {
        const ev = await createEvent(eventForm, adminSecret)
        setCurrentEvent(ev)
        setEventId(ev.id)
        showToast(`Event "${ev.name}" created!`)
      }
    } catch (e) { showToast(e.message, 'err') }
  }

  const handleCreateSession = async () => {
    try {
      const s = await createSession(eventId, sessionForm, adminSecret)
      setSessions([...sessions, s])
      setSessionForm({ name: '', order: sessions.length + 1, icon: '💍' })
      showToast('Session created')
    } catch (e) { showToast(e.message, 'err') }
  }

  const handleDeleteSession = async (sid) => {
    try {
      await deleteSession(eventId, sid, adminSecret)
      setSessions(sessions.filter(s => s.id !== sid))
      showToast('Session deleted')
    } catch (e) { showToast(e.message, 'err') }
  }

  // ... (Other handlers like importGuests, handleUploadAll remain mostly the same)
  const handleImportGuests = async () => {
    try {
      const guests = JSON.parse(guestText)
      const result = await importGuests(eventId, guests, adminSecret)
      setGuestResult(result)
      showToast(`${result.imported} guests imported!`)
    } catch (e) { showToast(e.message, 'err') }
  }

  const handleListGuests = async () => {
    try {
      const list = await listGuests(eventId, adminSecret)
      setGuestList(list)
    } catch (e) { showToast(e.message, 'err') }
  }

  const handleSendInvites = async () => {
    try {
      const res = await sendInvites(eventId, adminSecret)
      showToast(`${res.sent_count} invite links generated!`)
    } catch (e) { showToast(e.message, 'err') }
  }

  const handleUploadAll = async () => {
    if (!eventId) { showToast('Create an event first', 'err'); return }
    if (currentEvent?.is_multi_session && !uploadSessionId) {
      showToast('Select a session first', 'err'); return
    }
    setUploading(true)
    const results = []
    for (const file of files) {
      try {
        setUploadLog(l => [...l, { name: file.name, status: 'uploading' }])
        const photo = await uploadPhoto(file, eventId, adminSecret, null, uploadSessionId || null)
        results.push(photo)
        setUploadLog(l => l.map(x => x.name === file.name ? { ...x, status: 'staged', id: photo.id } : x))
      } catch {
        setUploadLog(l => l.map(x => x.name === file.name ? { ...x, status: 'error' } : x))
      }
    }
    setStaged(results)
    setUploading(false)
    showToast(`${results.length} photos staged`)
  }

  const handlePublish = async (photoId, fileName) => {
    try {
      await publishPhoto(photoId, adminSecret)
      setUploadLog(l => l.map(x => x.id === photoId ? { ...x, status: 'published' } : x))
      showToast(`${fileName} published!`)
    } catch (e) { showToast(e.message, 'err') }
  }

  const publishAll = async () => {
    for (const p of staged) await handlePublish(p.id, p.filename)
  }

  // ── Render ──────────────────────────────
  return (
    <div className="min-h-screen bg-ink text-cream font-sans pb-20">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cream/10">
        <h1 className="font-serif text-xl italic text-cream">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          {eventId && <span className="text-xs text-gold border border-gold/30 px-2 py-1 rounded-full">Event Active</span>}
          <button onClick={() => navigate('/')} className="text-xs text-muted hover:text-cream">← Guest View</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream/10 px-5 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`py-3 px-4 text-xs font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap
              ${activeTab === i ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-cream'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="p-5 max-w-2xl mx-auto space-y-8">
        
        {/* ── TAB: Event ── */}
        {TABS[activeTab] === 'Event' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Event Basic Info */}
            <div className="space-y-3">
              <p className="text-muted text-xs uppercase tracking-widest">Event Settings</p>
              {['name', 'venue', 'slug'].map(key => (
                <div key={key}>
                  <label className="text-xs text-muted mb-1 block capitalize">{key}</label>
                  <input value={eventForm[key]} onChange={e => setEventForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-2 text-sm focus:border-gold" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted mb-1 block">Date</label>
                <input type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-2 text-sm focus:border-gold" />
              </div>
            </div>

            {/* Event Mode Picker */}
            <div className="space-y-3 pt-4 border-t border-cream/10">
              <p className="text-muted text-xs uppercase tracking-widest">Event Mode</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setEventForm(f => ({ ...f, is_multi_session: false }))}
                  className={`p-4 rounded-xl border text-left transition-colors ${!eventForm.is_multi_session ? 'bg-gold/10 border-gold' : 'border-cream/20 hover:border-cream/40'}`}>
                  <p className="text-cream font-medium text-sm mb-1">📋 Simple Mode</p>
                  <p className="text-xs text-muted">Single photo pool, no tabs. Best for small parties.</p>
                </button>
                <button onClick={() => setEventForm(f => ({ ...f, is_multi_session: true }))}
                  className={`p-4 rounded-xl border text-left transition-colors ${eventForm.is_multi_session ? 'bg-gold/10 border-gold' : 'border-cream/20 hover:border-cream/40'}`}>
                  <p className="text-cream font-medium text-sm mb-1">🎊 Multi-Session</p>
                  <p className="text-xs text-muted">Photos separated by programs (Ceremony, Party).</p>
                </button>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-4 border-t border-cream/10">
              <p className="text-muted text-xs uppercase tracking-widest">Feature Toggles</p>
              <div className="space-y-2">
                {[
                  { key: 'face_scan', label: '👤 AI Face Scan', sub: 'Enable selfie matching' },
                  { key: 'qr_access', label: '📷 QR Code Access', sub: 'Enable QR scanning' },
                  { key: 'table_browse', label: '🪑 Table Browsing', sub: 'Allow browsing by table' },
                  { key: 'download', label: '⬇️ Photo Download', sub: 'Allow downloading photos' },
                  { key: 'show_suggested', label: '💡 Suggested Photos', sub: 'Show lower confidence matches' }
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-cream/10 rounded-lg">
                    <div>
                      <p className="text-cream text-sm">{label}</p>
                      <p className="text-muted text-xs">{sub}</p>
                    </div>
                    <button
                      onClick={() => setEventForm(f => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${eventForm.features[key] ? 'bg-gold' : 'bg-cream/20'}`}
                    >
                      <div className={`w-4 h-4 bg-ink rounded-full absolute top-1 transition-transform ${eventForm.features[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveEvent} className="w-full bg-gold text-ink font-medium py-3 rounded-lg text-sm mt-4">
              {currentEvent ? 'Update Event' : 'Create Event'}
            </button>

            <div className="pt-6 border-t border-cream/10">
              <label className="text-xs text-muted mb-1 block">Switch to existing Event ID</label>
              <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="Enter UUID..."
                className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-2 font-mono text-xs focus:border-gold" />
            </div>
          </motion.div>
        )}

        {/* ── TAB: Sessions ── */}
        {TABS[activeTab] === 'Sessions' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <p className="text-muted text-xs uppercase tracking-widest">Manage Programs</p>
            
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-cream/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-cream text-sm">{s.name}</p>
                      <p className="text-muted text-xs">Order: {s.order}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSession(s.id)} className="text-red-400 text-xs px-3 py-1 hover:bg-red-500/10 rounded">Delete</button>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-muted text-sm text-center py-4">No sessions created yet.</p>}
            </div>

            <div className="p-4 border border-cream/10 rounded-xl space-y-3 bg-cream/5 mt-6">
              <p className="text-cream text-sm font-medium">Add New Session</p>
              <div className="flex gap-2">
                <input value={sessionForm.icon} onChange={e => setSessionForm(f => ({ ...f, icon: e.target.value }))} className="w-12 bg-ink border border-cream/20 text-cream rounded-lg text-center" />
                <input value={sessionForm.name} onChange={e => setSessionForm(f => ({ ...f, name: e.target.value }))} placeholder="Session Name (e.g. Ceremony)" className="flex-1 bg-ink border border-cream/20 text-cream rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={sessionForm.order} onChange={e => setSessionForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="w-16 bg-ink border border-cream/20 text-cream rounded-lg px-2 text-sm text-center" />
              </div>
              <button onClick={handleCreateSession} className="w-full bg-gold/20 text-gold border border-gold/40 py-2 rounded-lg text-sm font-medium">Add Session</button>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Guests ── */}
        {TABS[activeTab] === 'Guests' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-muted text-xs uppercase tracking-widest">Import Guests</p>
            <textarea value={guestText} onChange={e => setGuestText(e.target.value)} rows={6} className="w-full bg-ink border border-cream/20 text-cream rounded-lg p-3 font-mono text-xs" />
            <div className="flex gap-2">
              <button onClick={handleImportGuests} className="flex-1 bg-gold text-ink font-medium py-2 rounded-lg text-sm">Import</button>
              <button onClick={handleListGuests} className="flex-1 border border-cream/20 text-cream py-2 rounded-lg text-sm">Refresh List</button>
            </div>
            {guestList.length > 0 && (
              <div className="space-y-2 mt-4">
                {guestList.map(g => (
                  <div key={g.id} className="flex justify-between p-3 border border-cream/10 rounded-lg">
                    <div>
                      <p className="text-cream text-sm">{g.name}</p>
                      <p className="text-muted text-xs">{g.phone || `Table ${g.table_number}`}</p>
                    </div>
                    <span className="text-xs text-gold">{g.link_sent_at ? 'Invited' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: Photos ── */}
        {TABS[activeTab] === 'Photos' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-muted text-xs uppercase tracking-widest">Upload Photos</p>
            
            {currentEvent?.is_multi_session && (
              <div className="mb-4">
                <label className="text-xs text-muted mb-1 block">Assign to Session</label>
                <select value={uploadSessionId} onChange={e => setUploadSessionId(e.target.value)}
                  className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-3 py-2 text-sm focus:border-gold appearance-none">
                  <option value="">Select a Session...</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
            )}

            <label className="block border-2 border-dashed border-cream/20 rounded-xl p-8 text-center cursor-pointer hover:border-gold/50">
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
              <p className="text-cream text-sm">{files.length > 0 ? `${files.length} files selected` : 'Tap to select photos'}</p>
            </label>

            <div className="flex gap-2">
              <button onClick={handleUploadAll} disabled={uploading || !files.length || (currentEvent?.is_multi_session && !uploadSessionId)}
                className="flex-1 bg-gold text-ink font-medium py-3 rounded-lg text-sm disabled:opacity-50">
                {uploading ? 'Uploading...' : `Upload ${files.length}`}
              </button>
              {staged.length > 0 && <button onClick={publishAll} className="flex-1 border border-gold text-gold py-3 rounded-lg text-sm">Publish All</button>}
            </div>

            {uploadLog.length > 0 && (
              <div className="space-y-2">
                {uploadLog.map((log, i) => (
                  <div key={i} className="flex justify-between p-2 border border-cream/10 rounded">
                    <p className="text-cream text-xs truncate">{log.name}</p>
                    <span className="text-xs text-blue-400">{log.status}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: Invite ── */}
        {TABS[activeTab] === 'Invite' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-muted text-xs uppercase tracking-widest">Send Invites</p>
            <button onClick={handleSendInvites} className="w-full bg-gold text-ink font-medium py-3 rounded-lg text-sm">Generate Links</button>
            <button onClick={handleListGuests} className="w-full border border-cream/20 text-cream py-3 rounded-lg text-sm">View Links</button>
            <div className="space-y-2">
              {guestList.filter(g => g.token).map(g => (
                <div key={g.id} className="p-3 border border-cream/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-cream text-sm">{g.name}</p>
                    <QRGenerator guest={g} />
                  </div>
                  <p className="text-muted text-[10px] font-mono mt-1 break-all">{window.location.origin}/g/{g.token}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm shadow-xl z-50 ${toast.type === 'err' ? 'bg-red-500 text-white' : 'bg-gold text-ink font-medium'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

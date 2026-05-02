import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { createEvent, importGuests, sendInvites, listGuests, uploadPhoto, publishPhoto } from '../lib/api'
import QRGenerator from '../components/QRGenerator'

const TABS = ['Event', 'Guests', 'Photos', 'Invite']

export default function AdminPage() {
  const navigate = useNavigate()
  const [adminSecret, setAdminSecret] = useState('')
  const [authed, setAuthed]           = useState(false)
  const [activeTab, setActiveTab]     = useState(0)
  const [toast, setToast]             = useState(null)

  // Event state
  const [eventId, setEventId]   = useState('')
  const [eventForm, setEventForm] = useState({ name: '', date: '', venue: '', slug: '', accent_color: '#C9A96E' })
  const [createdEvent, setCreatedEvent] = useState(null)

  // Guests state
  const [guestText, setGuestText]   = useState('[\n  {"name":"Sopheap Chan","phone":"012000001","table_number":1},\n  {"name":"Bopha Lim","phone":"012000002","table_number":2}\n]')
  const [guestResult, setGuestResult] = useState(null)
  const [guestList, setGuestList]   = useState([])

  // Photos state
  const [files, setFiles]         = useState([])
  const [uploadLog, setUploadLog] = useState([])
  const [uploading, setUploading] = useState(false)
  const [staged, setStaged]       = useState([])

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Auth gate ──────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h1 className="font-serif text-3xl italic text-cream mb-1">Admin Panel</h1>
          <p className="text-muted text-xs mb-6 font-sans">Photographer & Event Manager</p>
          <input
            type="password"
            placeholder="Enter Admin Secret"
            value={adminSecret}
            onChange={e => setAdminSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adminSecret && setAuthed(true)}
            className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-3 text-sm font-sans mb-3 focus:outline-none focus:border-gold"
          />
          <button
            onClick={() => adminSecret && setAuthed(true)}
            className="w-full bg-gold text-ink font-sans font-medium py-3 rounded-lg text-sm"
          >
            Enter →
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Tab: Event ─────────────────────────
  const handleCreateEvent = async () => {
    try {
      const ev = await createEvent(eventForm, adminSecret)
      setCreatedEvent(ev)
      setEventId(ev.id)
      showToast(`Event "${ev.name}" created!`)
    } catch (e) { showToast(e.message, 'err') }
  }

  // ── Tab: Guests ────────────────────────
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

  // ── Tab: Photos ────────────────────────
  const handleUploadAll = async () => {
    if (!eventId) { showToast('Create an event first', 'err'); return }
    setUploading(true)
    const results = []
    for (const file of files) {
      try {
        setUploadLog(l => [...l, { name: file.name, status: 'uploading' }])
        const photo = await uploadPhoto(file, eventId, adminSecret)
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
    for (const p of staged) {
      await handlePublish(p.id, p.filename)
    }
  }

  // ── Render ──────────────────────────────
  return (
    <div className="min-h-screen bg-ink text-cream font-sans">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cream/10">
        <h1 className="font-serif text-xl italic text-cream">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          {eventId && (
            <span className="text-xs text-gold border border-gold/30 px-2 py-1 rounded-full">
              Event active
            </span>
          )}
          <button onClick={() => navigate('/')} className="text-xs text-muted hover:text-cream transition-colors">
            ← Guest View
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream/10 px-5">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`py-3 px-4 text-xs font-medium transition-colors border-b-2 -mb-[1px]
              ${activeTab === i ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-cream'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-5 max-w-2xl mx-auto">

        {/* ── TAB 0: Event ── */}
        {activeTab === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-muted text-xs uppercase tracking-widest">Create New Event</p>

            {[
              { key: 'name',  label: 'Event Name',  placeholder: 'Sophia & Daniel Wedding' },
              { key: 'venue', label: 'Venue',        placeholder: 'Grand Sofitel, Phnom Penh' },
              { key: 'slug',  label: 'Slug',         placeholder: 'sophia-daniel-2025' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted mb-1 block">{label}</label>
                <input
                  value={eventForm[key]}
                  onChange={e => setEventForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
                />
              </div>
            ))}

            <div>
              <label className="text-xs text-muted mb-1 block">Date</label>
              <input
                type="date"
                value={eventForm.date}
                onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <button onClick={handleCreateEvent}
              className="w-full bg-gold text-ink font-medium py-3 rounded-lg text-sm mt-2">
              Create Event →
            </button>

            {createdEvent && (
              <div className="mt-4 p-4 border border-gold/30 rounded-lg bg-gold/5">
                <p className="text-gold text-xs font-medium mb-1">Event Created!</p>
                <p className="text-cream text-sm">{createdEvent.name}</p>
                <p className="text-muted text-xs mt-1 font-mono break-all">ID: {createdEvent.id}</p>
                <p className="text-muted text-xs font-mono">/events/{createdEvent.slug}</p>
              </div>
            )}

            {/* Manual Event ID override */}
            <div className="pt-4 border-t border-cream/10">
              <label className="text-xs text-muted mb-1 block">Or enter existing Event ID</label>
              <input
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                placeholder="uuid..."
                className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gold font-mono"
              />
            </div>
          </motion.div>
        )}

        {/* ── TAB 1: Guests ── */}
        {activeTab === 1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-muted text-xs uppercase tracking-widest">Import Guest List (JSON)</p>
            <textarea
              value={guestText}
              onChange={e => setGuestText(e.target.value)}
              rows={8}
              className="w-full bg-ink border border-cream/20 text-cream rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:border-gold resize-none"
            />
            <div className="flex gap-3">
              <button onClick={handleImportGuests}
                className="flex-1 bg-gold text-ink font-medium py-3 rounded-lg text-sm">
                Import Guests
              </button>
              <button onClick={handleListGuests}
                className="flex-1 border border-cream/20 text-cream font-medium py-3 rounded-lg text-sm hover:bg-cream/5 transition-colors">
                Refresh List
              </button>
            </div>

            {guestResult && (
              <p className="text-gold text-xs">{guestResult.imported} guests imported with tokens.</p>
            )}

            {/* Guest list table */}
            {guestList.length > 0 && (
              <div className="space-y-1.5 mt-2">
                <p className="text-muted text-xs uppercase tracking-widest">{guestList.length} Guests</p>
                {guestList.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 border border-cream/10 rounded-lg">
                    <div>
                      <p className="text-cream text-sm">{g.name}</p>
                      <p className="text-muted text-xs">{g.phone || g.email || `Table ${g.table_number}`}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${g.link_sent_at ? 'bg-gold/20 text-gold' : 'bg-cream/10 text-muted'}`}>
                      {g.link_sent_at ? 'Invited' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 2: Photos ── */}
        {activeTab === 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-muted text-xs uppercase tracking-widest">Upload & Stage Photos</p>

            {/* Drop zone */}
            <label className="block border-2 border-dashed border-cream/20 rounded-xl p-8 text-center cursor-pointer hover:border-gold/50 transition-colors">
              <input
                type="file" multiple accept="image/*" className="hidden"
                onChange={e => setFiles(Array.from(e.target.files))}
              />
              <p className="text-cream text-sm">{files.length > 0 ? `${files.length} files selected` : 'Tap to select photos'}</p>
              <p className="text-muted text-xs mt-1">JPEG, PNG — any resolution</p>
            </label>

            <div className="flex gap-3">
              <button onClick={handleUploadAll} disabled={uploading || files.length === 0}
                className="flex-1 bg-gold text-ink font-medium py-3 rounded-lg text-sm disabled:opacity-50">
                {uploading ? 'Uploading...' : `Upload ${files.length} Photos`}
              </button>
              {staged.length > 0 && (
                <button onClick={publishAll}
                  className="flex-1 border border-gold/40 text-gold font-medium py-3 rounded-lg text-sm hover:bg-gold/10 transition-colors">
                  Publish All
                </button>
              )}
            </div>

            {/* Upload log */}
            {uploadLog.length > 0 && (
              <div className="space-y-1.5">
                {uploadLog.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-cream/10 rounded-lg">
                    <p className="text-cream text-xs font-mono truncate flex-1">{log.name}</p>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.status === 'published' ? 'bg-gold/20 text-gold' :
                        log.status === 'staged'    ? 'bg-blue-500/20 text-blue-400' :
                        log.status === 'error'     ? 'bg-red-500/20 text-red-400' :
                        'bg-cream/10 text-muted'
                      }`}>
                        {log.status}
                      </span>
                      {log.status === 'staged' && log.id && (
                        <button onClick={() => handlePublish(log.id, log.name)}
                          className="text-xs text-gold underline">
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB 3: Invite ── */}
        {activeTab === 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-muted text-xs uppercase tracking-widest">Send Invitations</p>
            <p className="text-cream/60 text-sm">
              Generate unique gallery links for all guests and mark them as invited.
              SMS/WhatsApp delivery is handled externally (Twilio, etc).
            </p>
            <button onClick={handleSendInvites}
              className="w-full bg-gold text-ink font-medium py-3 rounded-lg text-sm">
              Generate Invite Links →
            </button>
            <button onClick={handleListGuests}
              className="w-full border border-cream/20 text-cream font-medium py-3 rounded-lg text-sm hover:bg-cream/5 transition-colors">
              View Guest Links
            </button>

            {guestList.length > 0 && (
              <div className="space-y-2">
                {guestList.filter(g => g.token).map(g => (
                  <div key={g.id} className="p-3 border border-cream/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-cream text-sm">{g.name}</p>
                      <QRGenerator guest={g} />
                    </div>
                    <p className="text-muted text-xs font-mono mt-0.5 break-all">
                      {window.location.origin}/g/{g.token?.slice(0, 40)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-sans shadow-xl z-50
              ${toast.type === 'err' ? 'bg-red-500/90 text-white' : 'bg-gold text-ink font-medium'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

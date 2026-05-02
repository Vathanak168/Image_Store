import { useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useTables, useConfigureTables, useUploadTablePhotos } from '../../hooks/useTables'
import TableCard from '../../components/TableCard'
import TableConfigModal from '../../components/TableConfigModal'

export default function TablesPage() {
  const { eventId } = useParams()
  const { adminSecret, event } = useOutletContext() 
  
  const { tables, isLoading: isLoadingTables, updateTable } = useTables(eventId, adminSecret)
  const { mutateAsync: configureTables, isPending: isConfiguring } = useConfigureTables(eventId, adminSecret)
  const { mutateAsync: uploadPhotos } = useUploadTablePhotos(eventId, null, adminSecret) // We pass tableId dynamically below
  
  const [modalOpen, setModalOpen] = useState(false)
  const [uploadingTableId, setUploadingTableId] = useState(null)

  const handleConfigureSave = async (payload) => {
    try {
      await configureTables(payload)
      setModalOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleLabelEdit = async (tableId, newLabel) => {
    try {
      await updateTable({ tableId, payload: { table_label: newLabel } })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpload = async (tableId, files) => {
    if (!files || files.length === 0) return
    setUploadingTableId(tableId)
    try {
      // The hook allows us to pass a specific tableId for this call
      const { uploadTablePhotos } = await import('../../lib/api')
      await uploadTablePhotos(eventId, tableId, files, adminSecret)
      
      // Invalidate to refresh photos
      const { useQueryClient } = await import('@tanstack/react-query')
      // Note: we can't call hooks in callbacks, but we can rely on the fact
      // that the user will refresh or the hook handles invalidation.
      // Actually we will just reload the window for simplicity, or we can use the hook directly:
    } catch (err) {
      alert(err.message)
    } finally {
      setUploadingTableId(null)
      window.location.reload() // Quick refresh to see new counts/thumbs
    }
  }

  if (isLoadingTables) {
    return <div className="p-8 text-center text-muted animate-pulse font-sans">Loading tables...</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-ink mb-2">Tables & Seating</h1>
          <p className="text-muted text-sm max-w-xl leading-relaxed">
            Configure how guests browse photos by table. Guests will select their table number on the landing page to instantly see photos of their seating group.
          </p>
        </div>
        
        {tables.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-white border border-ink/20 text-ink rounded-lg text-sm font-medium hover:bg-ink/5 transition-colors"
            >
              Reconfigure
            </button>
          </div>
        )}
      </div>

      {tables.length === 0 ? (
        <div className="bg-white border border-ink/10 border-dashed rounded-2xl p-12 text-center max-w-2xl mx-auto mt-12">
          <div className="w-16 h-16 bg-cream rounded-full border border-gold/30 flex items-center justify-center text-2xl mx-auto mb-4">
            🪑
          </div>
          <h3 className="font-serif text-xl text-ink mb-2">No tables configured</h3>
          <p className="text-muted text-sm mx-auto mb-6">
            Generate your tables first. You can use numeric (Table 1), alphabetic (Table A), or custom names.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-ink text-cream px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors inline-block"
          >
            Configure Tables
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tables.map(table => (
            <div key={table.id} className="relative">
              <TableCard
                table={table}
                onLabelEdit={handleLabelEdit}
                onUpload={handleUpload}
              />
              {uploadingTableId === table.id && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
                  <div className="text-xs font-medium text-ink bg-white px-3 py-1.5 rounded-full shadow-sm border border-ink/10 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <TableConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleConfigureSave}
        isSaving={isConfiguring}
      />
    </div>
  )
}

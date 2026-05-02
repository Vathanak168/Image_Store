import { useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useTables } from '../../hooks/useTables'
import TableCard from '../../components/TableCard'
import TableConfigModal from '../../components/TableConfigModal'
import { motion } from 'framer-motion'

export default function TablesPage() {
  const { eventId } = useParams()
  const { adminSecret } = useOutletContext() // Provided by EventWorkspaceLayout
  
  const { tables, isLoading, createTable, updateTable, deleteTable, isCreating, isUpdating } = useTables(eventId, adminSecret)
  
  const [modalState, setModalState] = useState({ isOpen: false, data: null })

  const handleSave = async (payload) => {
    try {
      if (modalState.data) {
        await updateTable({ tableId: modalState.data.id, payload })
      } else {
        await createTable(payload)
      }
      setModalState({ isOpen: false, data: null })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table? Photos tagged with this table will lose their tag.')) return
    try {
      await deleteTable(tableId)
    } catch (err) {
      alert(err.message)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted animate-pulse">Loading tables...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-ink mb-2">Tables & Seating</h1>
          <p className="text-muted text-sm max-w-lg leading-relaxed">
            Manage physical tables for this event. When "Table Browsing" is enabled, guests can browse photos tagged to their seating table.
          </p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, data: null })}
          className="bg-ink text-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/80 transition-colors shrink-0 shadow-sm"
        >
          + Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white border border-ink/10 border-dashed rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-full border border-gold/30 flex items-center justify-center text-2xl mx-auto mb-4">
            🪑
          </div>
          <h3 className="font-serif text-xl text-ink mb-2">No tables yet</h3>
          <p className="text-muted text-sm max-w-sm mx-auto mb-6">
            Create tables to organize photos by seating arrangements. Guests can easily find their photos by selecting their table.
          </p>
          <button
            onClick={() => setModalState({ isOpen: true, data: null })}
            className="text-ink text-sm font-medium hover:text-gold transition-colors underline underline-offset-4"
          >
            Create your first table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={() => setModalState({ isOpen: true, data: table })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TableConfigModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, data: null })}
        onSave={handleSave}
        initialData={modalState.data}
        isSaving={isCreating || isUpdating}
      />
    </div>
  )
}

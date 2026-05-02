import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function TableCard({ table, onUpload, onLabelEdit }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(table.table_label || '')
  const fileInputRef = useRef(null)

  const handleEditSubmit = () => {
    setIsEditing(false)
    if (editValue.trim() !== table.table_label) {
      onLabelEdit(table.id, editValue.trim())
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleEditSubmit()
    if (e.key === 'Escape') {
      setEditValue(table.table_label || '')
      setIsEditing(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(table.id, Array.from(e.target.files))
      // Reset input so the same files can be selected again if needed
      e.target.value = null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-white border border-ink/10 rounded-xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
    >
      <div className="flex flex-col h-full justify-center">
        <p className="text-xs text-muted uppercase tracking-wider mb-1">
          Table {table.table_number}
        </p>
        
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            className="font-serif text-xl italic text-ink border-b border-gold focus:outline-none bg-transparent"
          />
        ) : (
          <h3 
            onClick={() => setIsEditing(true)}
            className="font-serif text-xl italic text-ink cursor-text hover:text-gold transition-colors inline-block"
            title="Click to edit label"
          >
            {table.table_label || `Table ${table.table_number}`}
          </h3>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <p className="text-sm font-sans text-muted">
            {table.photo_count} photos
          </p>
          {table.photo_count === 0 && (
            <span className="text-sm" title="No photos uploaded yet">⚠️</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        {/* Photo Thumbnails */}
        <div className="flex -space-x-2">
          {table.photos && table.photos.map((thumb, idx) => (
            <div key={idx} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-cream">
              <img src={thumb} alt="thumb" className="w-full h-full object-cover" />
            </div>
          ))}
          {table.photo_count > (table.photos?.length || 0) && (
            <div className="w-10 h-10 rounded-full border-2 border-white bg-ink/5 flex items-center justify-center text-xs text-muted z-10">
              +{table.photo_count - (table.photos?.length || 0)}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded bg-ink/5 text-ink font-medium hover:bg-ink/10 transition-colors"
          >
            Upload
          </button>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'

export default function TableCard({ table, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-white border border-ink/10 rounded-xl shadow-sm hover:shadow-md transition-shadow group flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-cream flex items-center justify-center rounded-lg border border-gold/30 text-gold text-lg font-serif">
          {table.table_number || '#'}
        </div>
        <div>
          <h3 className="font-sans font-medium text-ink text-sm">{table.name}</h3>
          <p className="text-muted text-xs mt-0.5">Physical Table</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(table)}
          className="p-2 text-muted hover:text-ink hover:bg-cream rounded-lg transition-colors text-xs"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(table.id)}
          className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs"
        >
          Delete
        </button>
      </div>
    </motion.div>
  )
}

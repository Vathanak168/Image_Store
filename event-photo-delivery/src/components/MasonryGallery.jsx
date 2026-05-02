import { motion } from 'framer-motion'

export default function MasonryGallery({ photos, onPhotoClick }) {
  return (
    <div className="columns-3 md:columns-4 lg:columns-5 gap-1.5 p-4">
      {photos.map((photo, i) => (
        <motion.div
          key={photo.id}
          className="mb-1.5 break-inside-avoid rounded-lg overflow-hidden 
                     cursor-pointer group relative"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
          onClick={() => onPhotoClick(i)}
        >
          <img
            src={photo.thumb}
            alt=""
            className="w-full block object-cover transition-transform 
                       duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 
                          transition-colors duration-300 flex items-center 
                          justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity
                             bg-ink/60 text-cream text-xs px-3 py-1 rounded-full">
              View
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function SkeletonGrid() {
  return (
    <div className="columns-3 md:columns-4 lg:columns-5 gap-1.5 p-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="mb-1.5 break-inside-avoid rounded-lg bg-surface animate-skeleton"
          style={{
            height: `${[160, 200, 240, 180, 220][i % 5]}px`,
            animationDelay: `${i * 60}ms`
          }}
        />
      ))}
    </div>
  )
}

export default function StarRating({ value = 0, max = 5, size = 16, interactive = false, onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {stars.map(s => {
        const filled = s <= Math.floor(value)
        const partial = !filled && s === Math.ceil(value) && value % 1 !== 0
        return (
          <span
            key={s}
            onClick={() => interactive && onChange?.(s)}
            style={{
              fontSize: size,
              cursor: interactive ? 'pointer' : 'default',
              display: 'inline-block',
              transition: 'transform 0.1s ease',
              color: filled ? '#f59e0b' : partial ? '#f59e0b' : '#d1d5db',
              filter: filled || partial ? 'none' : 'grayscale(1)',
            }}
            onMouseEnter={e => { if (interactive) e.currentTarget.style.transform = 'scale(1.25)' }}
            onMouseLeave={e => { if (interactive) e.currentTarget.style.transform = 'scale(1)' }}
          >★</span>
        )
      })}
    </div>
  )
}

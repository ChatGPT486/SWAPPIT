import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 3000)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: { bg: 'var(--green)', icon: '✓' },
    error:   { bg: 'var(--red)', icon: '✕' },
    info:    { bg: 'var(--accent)', icon: 'ℹ' },
  }
  const { bg, icon } = colors[type] || colors.info

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'var(--ink)', color: '#fff',
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'var(--shadow-lg)',
      animation: visible ? 'fadeUp 0.3s ease' : 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      maxWidth: 320,
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: bg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
    </div>
  )
}

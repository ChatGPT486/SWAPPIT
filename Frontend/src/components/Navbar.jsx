import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { currentUser, signout, getUnreadCount } = useApp()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  const unread   = getUnreadCount()
  const isActive = (p) => location.pathname === p

  const handleSignout = async () => { await signout(); navigate('/') }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // FIX: Django returns first_name/last_name. AppContext normalizes them to
  // firstName/lastName — but guard here too with safe fallbacks.
  const firstName = currentUser?.firstName || currentUser?.first_name || ''
  const lastName  = currentUser?.lastName  || currentUser?.last_name  || ''
  const photo     = currentUser?.photo     || currentUser?.avatar     || null
  const initials  = `${firstName[0] || '?'}${lastName[0] || ''}`.toUpperCase()

  return (
    <nav className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
      <div style={{
        maxWidth: 'var(--max-w)', margin: '0 auto',
        padding: '0 5%', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>

        {/* Logo */}
        <Link to={currentUser ? '/explorer' : '/'} className="logo">
          swap<span style={{ color: 'var(--coral)' }}>pit</span>
        </Link>

        {/* Desktop nav */}
        <div className="hide-mobile" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {currentUser ? (
            <>
              <NavLink to="/explorer" active={isActive('/explorer')}>Explorer</NavLink>
              <NavLink to="/my-space" active={isActive('/my-space')}>My Space</NavLink>
              <NavLink to="/about"    active={isActive('/about')}>About</NavLink>
            </>
          ) : (
            <NavLink to="/about" active={isActive('/about')}>About</NavLink>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {currentUser ? (
            <>
              {/* Notification bell */}
              <Link to="/my-space?tab=notifications" style={{
                position: 'relative', padding: '9px', display: 'flex',
                borderRadius: 10, background: 'transparent', transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--muted)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--coral)', color: '#fff',
                    fontSize: 8, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </Link>

              {/* Avatar + dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(o => !o)} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--ink)', color: 'var(--lime)',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.2s var(--ease-spring), box-shadow 0.2s',
                  flexShrink: 0, overflow: 'hidden', border: 'none', cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,242,48,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {photo
                    ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials
                  }
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: 6,
                    boxShadow: 'var(--shadow-lg)', minWidth: 210,
                    animation: 'scaleIn 0.15s var(--ease)', transformOrigin: 'top right',
                    zIndex: 300,
                  }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                        {firstName} {lastName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{currentUser.email}</div>
                    </div>
                    <DropItem to="/my-space"                   onClick={() => setMenuOpen(false)}>👤  Profile</DropItem>
                    <DropItem to="/my-space?tab=products"      onClick={() => setMenuOpen(false)}>📦  My Items</DropItem>
                    <DropItem to="/my-space?tab=exchanges"     onClick={() => setMenuOpen(false)}>🔁  Exchanges</DropItem>
                    <DropItem to="/my-space?tab=notifications" onClick={() => setMenuOpen(false)}>
                      🔔  Notifications
                      {unread > 0 && (
                        <span style={{ marginLeft: 'auto', background: 'var(--coral)', color: '#fff', borderRadius: 99, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                          {unread}
                        </span>
                      )}
                    </DropItem>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
                    <button onClick={handleSignout} style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      borderRadius: 8, fontSize: 13, color: 'var(--error)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'background 0.2s', fontFamily: 'var(--font-body)',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >↩  Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn btn--outline hide-mobile" style={{ padding: '8px 18px', fontSize: 13 }}>Sign in</Link>
              <Link to="/signup" className="btn btn--primary" style={{ padding: '8px 18px', fontSize: 13 }}>Get started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{ display: 'none', padding: 8, color: 'var(--muted)', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer' }}
            className="mobile-menu-btn"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop to close menus */}
      {(menuOpen || mobileOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: -1 }}
          onClick={() => { setMenuOpen(false); setMobileOpen(false) }}
        />
      )}
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      padding: '7px 14px', borderRadius: 8, fontSize: 14,
      fontFamily: 'var(--font-display)',
      fontWeight: active ? 700 : 500,
      color: active ? 'var(--ink)' : 'var(--muted)',
      background: active ? 'var(--surface-2)' : 'transparent',
      transition: 'all 0.2s var(--ease)',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}
    >{children}</Link>
  )
}

function DropItem({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8,
      fontSize: 13, color: 'var(--ink)',
      transition: 'background 0.18s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{children}</Link>
  )
}
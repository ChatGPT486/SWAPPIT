import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { currentUser, signout, getUnreadCount } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const unread = getUnreadCount()
  const isActive = (p) => location.pathname === p

  const handleSignout = () => { signout(); navigate('/') }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 'var(--max-w)', margin: '0 auto',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Logo */}
        <Link to={currentUser ? '/explorer' : '/'} style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.03em',
          flexShrink: 0,
        }}>
          swap<span style={{ color: 'var(--accent)' }}>pit</span>
        </Link>

        {/* Desktop Nav links */}
        <div className="hide-mobile" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {currentUser ? (
            <>
              <NavLink to="/explorer" active={isActive('/explorer')}>Explorer</NavLink>
              <NavLink to="/my-space" active={isActive('/my-space')}>My Space</NavLink>
              <NavLink to="/about"    active={isActive('/about')}>About</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/about" active={isActive('/about')}>About</NavLink>
            </>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {currentUser ? (
            <>
              {/* Bell */}
              <Link to="/my-space?tab=notifications" style={{ position: 'relative', padding: '8px 8px', display: 'flex' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--ink-muted)" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </Link>

              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(o => !o)} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform var(--transition), box-shadow var(--transition)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,82,31,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = 'none' }}
                >
                  {currentUser.photo
                    ? <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : `${currentUser.firstName[0]}${currentUser.lastName[0]}`
                  }
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 6,
                    boxShadow: 'var(--shadow-lg)', minWidth: 200,
                    animation: 'scaleIn 0.15s ease', transformOrigin: 'top right',
                  }}>
                    <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{currentUser.firstName} {currentUser.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 1 }}>{currentUser.email}</div>
                    </div>
                    <DropItem to="/my-space"             onClick={() => setMenuOpen(false)}>👤  Profile</DropItem>
                    <DropItem to="/my-space?tab=products" onClick={() => setMenuOpen(false)}>📦  My Items</DropItem>
                    <DropItem to="/my-space?tab=exchanges" onClick={() => setMenuOpen(false)}>🔁  Exchanges</DropItem>
                    <DropItem to="/my-space?tab=notifications" onClick={() => setMenuOpen(false)}>🔔  Notifications {unread > 0 && <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{unread}</span>}</DropItem>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
                    <button onClick={handleSignout} style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px',
                      borderRadius: 8, fontSize: 13, color: 'var(--red)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'background var(--transition)',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >↩  Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="hide-mobile" style={outlineBtn}>Sign in</Link>
              <Link to="/signup" style={primaryBtn}>Get started</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{ display: 'none', padding: 8, color: 'var(--ink-muted)', '@media (maxWidth: 640px)': { display: 'flex' } }}
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

      {/* Overlay to close menus */}
      {(menuOpen || mobileOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}
          onClick={() => { setMenuOpen(false); setMobileOpen(false) }} />
      )}
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      padding: '6px 13px', borderRadius: 8, fontSize: 14,
      fontWeight: active ? 600 : 500,
      color: active ? 'var(--ink)' : 'var(--ink-muted)',
      background: active ? 'var(--surface)' : 'transparent',
      transition: 'all var(--transition)',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)' } }}
    >{children}</Link>
  )
}

function DropItem({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 12px', borderRadius: 8,
      fontSize: 13, color: 'var(--ink)',
      transition: 'background var(--transition)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{children}</Link>
  )
}

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center',
  padding: '8px 18px', borderRadius: 'var(--radius-pill)',
  background: 'var(--ink)', color: '#fff',
  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
  transition: 'background var(--transition)',
}

const outlineBtn = {
  display: 'inline-flex', alignItems: 'center',
  padding: '7px 16px', borderRadius: 'var(--radius-pill)',
  background: 'transparent', color: 'var(--ink-light)',
  border: '1.5px solid var(--border)',
  fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 13,
  transition: 'all var(--transition)',
}

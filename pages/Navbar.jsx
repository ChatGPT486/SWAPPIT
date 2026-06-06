import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Barre de navigation partagée pour toutes les pages authentifiées.
 * - Logo → retour à /
 * - Liens actifs soulignés
 * - Bouton Logout qui vide la session et redirige vers /
 */
export default function Navbar() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const linkStyle = (path) => ({
    fontSize: 14,
    fontWeight: 600,
    color: pathname === path ? 'var(--accent)' : 'var(--ink)',
    textDecoration: 'none',
    paddingBottom: 3,
    borderBottom: pathname === path ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'color 0.18s ease, border-color 0.18s ease',
  });

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 'var(--max-w)',
        margin: '0 auto',
        padding: '0 24px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* Logo */}
        <Link to="/" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 22,
          color: 'var(--ink)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>
          swap<span style={{ color: 'var(--accent)' }}>pit</span>
          <span style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        {/* Liens centraux */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link to="/explorer" style={linkStyle('/explorer')}>Vitrine 🌐</Link>
          <Link to="/myspace"  style={linkStyle('/myspace')}>Mon Espace 🚀</Link>
          <Link to="/about"    style={linkStyle('/about')}>À propos</Link>
        </nav>

        {/* Droite : username + publier + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {currentUser && (
            <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>
              👤 @{currentUser.username}
            </span>
          )}

          <Link to="/publier" style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.18s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            + Publier
          </Link>

          {/* ── BOUTON LOGOUT ── */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--red)';
              e.currentTarget.style.color = 'var(--red)';
              e.currentTarget.style.background = 'var(--red-soft)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--ink-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ↩ Logout
          </button>
        </div>
      </div>
    </header>
  );
}

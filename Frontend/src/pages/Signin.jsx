import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Signin() {
  const { signin } = useApp()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = signin(email, password)
    if (result.ok) navigate('/explorer')
    else { setError(result.error); setLoading(false) }
  }

  const fillDemo = (em) => { setEmail(em); setPassword('pass123') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)' }}>

      {/* Left panel */}
      <div className="hide-mobile" style={{
        flex: '0 0 42%', background: 'var(--ink)',
        display: 'flex', flexDirection: 'column',
        padding: 'clamp(32px, 5vw, 52px)', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
          swap<span style={{ color: 'var(--accent)' }}>pit</span>
        </Link>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 3vw, 40px)', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 18 }}>
            Welcome back<br />to the market.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
            Your items are waiting. New swap proposals may be pending your review.
          </p>

          {/* Demo accounts */}
          <div style={{ marginTop: 32, padding: '16px 18px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.09)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Demo Accounts</div>
            {[['armel@example.com','Armel K.'],['diane@example.com','Diane M.'],['patrick@example.com','Patrick N.']].map(([em, name]) => (
              <button key={em} onClick={() => fillDemo(em)} style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'left',
                transition: 'color var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
              >
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span style={{ opacity: 0.55 }}>{em}</span>
              </button>
            ))}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>Password: pass123</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Made with ♥ in Cameroon</div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 5vw, 52px) clamp(20px, 5vw, 52px)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', display: 'block', marginBottom: 36 }}>
            swap<span style={{ color: 'var(--accent)' }}>pit</span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.02em', marginBottom: 6 }}>Sign in</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 28 }}>Welcome back to Swappit</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />

            {error && <ErrBox>{error}</ErrBox>}

            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: 10, marginTop: 4,
              background: loading ? 'var(--border)' : 'var(--ink)',
              color: loading ? 'var(--ink-muted)' : '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              transition: 'background var(--transition)',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--ink)' }}
            >{loading ? 'Signing in…' : 'Sign In →'}</button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-muted)', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} required style={{
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid var(--border)', background: '#fff',
        fontSize: 15, color: 'var(--ink)', transition: 'border-color var(--transition)',
      }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function ErrBox({ children }) {
  return <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 500 }}>{children}</div>
}

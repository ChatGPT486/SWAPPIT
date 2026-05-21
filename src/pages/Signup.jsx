import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Signup() {
  const { signup } = useApp()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ firstName:'', lastName:'', email:'', contact:'', password:'', bio:'' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    setLoading(true); setError('')
    const r = signup(form)
    if (r.ok) navigate('/explorer')
    else { setError(r.error); setLoading(false) }
  }

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
            Join the swap<br />community.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
            Post items, find matches, trade fairly. No fees, no cash required — just honest exchanges.
          </p>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['✓  Free forever', 'No listing fees, no commissions'],['✓  Fairness built-in','Every swap is rated for balance'],['✓  Real community','Leave reviews, build your reputation']].map(([t,s]) => (
              <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{t}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Made with ♥ in Cameroon</div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 5vw, 52px) clamp(20px, 5vw, 52px)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', display: 'block', marginBottom: 32 }}>
            swap<span style={{ color: 'var(--accent)' }}>pit</span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.02em', marginBottom: 6 }}>Create account</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 28 }}>Join the trading community — it's free</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="First name" name="firstName" value={form.firstName} onChange={change} required />
              <Field label="Last name"  name="lastName"  value={form.lastName}  onChange={change} required />
            </div>
            <Field label="Email"          name="email"    type="email"    value={form.email}    onChange={change} required />
            <Field label="Contact number" name="contact"  type="tel"      value={form.contact}  onChange={change} placeholder="+237 6XX XXX XXX" required />
            <Field label="Password"       name="password" type="password" value={form.password} onChange={change} required />
            <Field label="Short bio (optional)" name="bio" value={form.bio} onChange={change} placeholder="Tell others a bit about yourself…" />

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginTop: 4 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                I agree to the <a href="#" style={{ color: 'var(--accent)' }}>Terms of Service</a> and{' '}
                <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
              </span>
            </label>

            {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 500 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: 10, marginTop: 6,
              background: loading ? 'var(--border)' : 'var(--ink)',
              color: loading ? 'var(--ink-muted)' : '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              transition: 'background var(--transition)',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--ink)' }}
            >{loading ? 'Creating account…' : 'Create Account →'}</button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-muted)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder || ''} style={{
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid var(--border)', background: '#fff',
        fontSize: 14, color: 'var(--ink)', transition: 'border-color var(--transition)',
      }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

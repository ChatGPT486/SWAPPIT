import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

// ── Validation rules ───────────────────────────────────────────────────────────
const EMAIL_RE = /^[a-zA-Z0-9]([a-zA-Z0-9._+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/

function validateEmail(email) {
  const v = email.trim()
  if (!v)                          return 'Email is required.'
  if (v.startsWith('-'))           return 'Email cannot start with a hyphen (-).'
  if (v.startsWith('.'))           return 'Email cannot start with a dot (.).'
  if (v.includes('..'))            return 'Email cannot contain consecutive dots (..).'
  if (!v.includes('@'))            return 'Email must contain the @ symbol.'
  const [local, ...domainParts] = v.split('@')
  if (domainParts.length > 1)      return 'Email can only contain one @ symbol.'
  const domain = domainParts[0]
  if (!local)                      return 'Email must have a username before @.'
  if (!domain || !domain.includes('.')) return 'Email must have a valid domain (e.g. gmail.com).'
  if (!EMAIL_RE.test(v))           return 'Invalid email format. Example: name@example.com'
  return null
}

function validatePassword(password) {
  if (!password)         return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  return null
}

export default function Signin() {
  const { signin } = useApp()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [blocked,  setBlocked]  = useState(false)

  // Real-time field validation on blur
  const validateField = (field, value) => {
    const err = field === 'email' ? validateEmail(value) : validatePassword(value)
    setErrors(prev => ({ ...prev, [field]: err }))
    return !err
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (blocked) { setApiError('Too many failed attempts. Please wait a moment before trying again.'); return }

    const emailErr = validateEmail(email)
    const passErr  = validatePassword(password)
    setErrors({ email: emailErr, password: passErr })
    if (emailErr || passErr) return

    setLoading(true)
    try {
      await signin({ email: email.trim().toLowerCase(), password })
      navigate('/explorer')
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        setBlocked(true)
        setTimeout(() => { setBlocked(false); setAttempts(0) }, 30000)
        setApiError('Too many failed attempts. Signin blocked for 30 seconds.')
      } else {
        setApiError(`Incorrect email or password. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? 's' : ''} remaining.`)
      }
      setLoading(false)
    }
  }

  const fillDemo = (em) => { setEmail(em); setPassword('pass123'); setErrors({}); setApiError('') }

  return (
    <div className="page-entrance" style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)' }}>

      {/* ── Left panel ── */}
      <div className="hide-mobile" style={{ flex: '0 0 44%', background: 'var(--ink)', color: '#fff', display: 'flex', flexDirection: 'column', padding: 'clamp(36px,5vw,56px)', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-60, right:-60, width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,242,48,0.12) 0%, transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,85,51,0.1) 0%, transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />

        <Link to="/" className="logo" style={{ color: '#fff', position: 'relative' }}>
          swap<span style={{ color: 'var(--lime)' }}>pit</span>
        </Link>

        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(28px,3vw,44px)', color:'#fff', lineHeight:0.95, letterSpacing:'-0.035em', marginBottom:20 }}>
            Welcome back<br />to the market.
          </h2>
          <p style={{ fontSize:15, color:'rgba(245,244,240,0.45)', lineHeight:1.75, marginBottom:36 }}>
            Your items are waiting. New swap proposals may be pending your review.
          </p>

          {/* Security note */}
          <div style={{ padding: '14px 16px', background: 'rgba(200,242,48,0.07)', borderRadius: 12, border: '1px solid rgba(200,242,48,0.15)', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🔒 Secure Sign In</div>
            <div style={{ fontSize: 12, color: 'rgba(245,244,240,0.5)', lineHeight: 1.7 }}>
              Your connection is protected. After 5 failed attempts, signin will be temporarily blocked.
            </div>
          </div>

          {/* Demo accounts */}
          <div style={{ padding:'18px 20px', background:'rgba(245,244,240,0.05)', borderRadius:14, border:'1px solid rgba(245,244,240,0.08)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,244,240,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14, fontFamily:'var(--font-display)' }}>Demo Accounts</div>
            {[['armel@example.com','Armel K.'],['diane@example.com','Diane M.'],['patrick@example.com','Patrick N.']].map(([em, name]) => (
              <button key={em} onClick={() => fillDemo(em)} style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'10px 0', fontSize:13, color:'rgba(245,244,240,0.5)', textAlign:'left', transition:'color 0.2s', fontFamily:'var(--font-body)', background:'none', border:'none', borderBottom:'1px solid rgba(245,244,240,0.05)', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--lime)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,244,240,0.5)'}
              >
                <span style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>{name}</span>
                <span style={{ opacity:0.6 }}>{em}</span>
              </button>
            ))}
            <div style={{ fontSize:11, color:'rgba(245,244,240,0.2)', marginTop:12, fontFamily:'var(--font-display)', fontWeight:600 }}>Password: pass123</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:'rgba(245,244,240,0.2)', position:'relative' }}>Made with ♥ in Cameroon</div>
      </div>

      {/* ── Right: form ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(32px,5vw,56px) clamp(20px,5vw,56px)' }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <Link to="/" className="logo" style={{ display:'block', marginBottom:44 }}>
            swap<span style={{ color:'var(--coral)' }}>pit</span>
          </Link>

          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(24px,3vw,34px)', letterSpacing:'-0.03em', marginBottom:8 }}>Sign in</h1>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:32 }}>Welcome back to Swappit</p>

          {blocked && (
            <div style={{ padding:'14px 16px', borderRadius:'var(--radius-sm)', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:18 }}>🔒</span>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, color:'var(--error)', marginBottom:3 }}>Account temporarily blocked</div>
                <div style={{ fontSize:12, color:'var(--error)', opacity:0.8 }}>Too many failed attempts. Please wait 30 seconds before trying again.</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }} noValidate>
            <SecureField
              label="Email address" type="email" value={email}
              onChange={v => { setEmail(v); if (errors.email) validateField('email', v) }}
              onBlur={() => validateField('email', email)}
              error={errors.email}
              hint="e.g. yourname@gmail.com"
            />
            <SecureField
              label="Password" type={showPass ? 'text' : 'password'} value={password}
              onChange={v => { setPassword(v); if (errors.password) validateField('password', v) }}
              onBlur={() => validateField('password', password)}
              error={errors.password}
              suffix={
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:14, padding:'0 12px' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              }
            />

            {apiError && <ErrBox>{apiError}</ErrBox>}

            <button type="submit" disabled={loading || blocked} style={{
              padding:'14px', borderRadius:'var(--radius-sm)', marginTop:4,
              background: blocked ? 'var(--muted)' : loading ? 'rgba(12,12,16,0.5)' : 'var(--ink)',
              color:'var(--lime)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:15,
              border:'none', cursor: (loading || blocked) ? 'not-allowed' : 'pointer', width:'100%',
              transition:'transform 0.2s var(--ease-spring), box-shadow 0.2s',
            }}
              onMouseEnter={e => { if (!loading && !blocked) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
            >
              {loading ? 'Signing in…' : blocked ? '🔒 Blocked — Please wait' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:14, color:'var(--muted)', marginTop:28 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color:'var(--ink)', fontWeight:700, fontFamily:'var(--font-display)' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Shared secure field ──────────────────────────────────────────────────────
function SecureField({ label, type, value, onChange, onBlur, error, hint, suffix }) {
  const hasError = !!error
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color: hasError ? 'var(--error)' : 'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7, fontFamily:'var(--font-display)', transition:'color 0.2s' }}>
        {label}
      </label>
      <div style={{ display:'flex', alignItems:'center', borderRadius:'var(--radius-sm)', border:`2px solid ${hasError ? 'var(--error)' : 'var(--border-md)'}`, background:'#fff', overflow:'hidden', transition:'border-color 0.2s, box-shadow 0.2s' }}
        onFocusCapture={e => e.currentTarget.style.borderColor = hasError ? 'var(--error)' : 'var(--ink)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = hasError ? 'var(--error)' : 'var(--border-md)'}
      >
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={hint || ''}
          style={{ flex:1, padding:'12px 14px', border:'none', outline:'none', fontSize:14, fontFamily:'var(--font-body)', color:'var(--ink)', background:'transparent' }}
        />
        {suffix}
      </div>
      {hasError && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
          <span style={{ fontSize:12 }}>⚠️</span>
          <span style={{ fontSize:12, color:'var(--error)', fontWeight:500 }}>{error}</span>
        </div>
      )}
    </div>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{ padding:'12px 16px', borderRadius:'var(--radius-sm)', background:'rgba(239,68,68,0.08)', color:'var(--error)', fontSize:13, border:'1px solid rgba(239,68,68,0.2)', display:'flex', gap:8, alignItems:'flex-start' }}>
      <span>⚠️</span><span>{children}</span>
    </div>
  )
}
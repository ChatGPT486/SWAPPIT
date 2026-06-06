import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

// ── Validation rules ───────────────────────────────────────────────────────────
const EMAIL_RE = /^[a-zA-Z0-9]([a-zA-Z0-9._+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/

function validateEmail(email) {
  const v = email.trim()
  if (!v)                               return 'Email is required.'
  if (v.startsWith('-'))                return 'Email cannot start with a hyphen (-).'
  if (v.startsWith('.'))                return 'Email cannot start with a dot (.).'
  if (v.includes('..'))                 return 'Email cannot have consecutive dots (..).'
  if ((v.match(/@/g) || []).length > 1) return 'Email can only have one @ symbol.'
  if (!v.includes('@'))                 return 'Email must include the @ symbol.'
  const [local, domain] = v.split('@')
  if (!local)                           return 'Email must have a username before @.'
  if (!domain || !domain.includes('.')) return 'Email must have a valid domain, e.g. gmail.com'
  if (domain.startsWith('.') || domain.endsWith('.')) return 'Email domain cannot start or end with a dot.'
  if (!EMAIL_RE.test(v))                return 'Invalid email format. Example: name@gmail.com'
  return null
}

// Password strength checker — returns { score 0-4, label, color, checks }
function analyzePassword(pw) {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  const config = [
    { label: 'Too weak',    color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    { label: 'Weak',        color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    { label: 'Fair',        color: '#d97706', bg: 'rgba(217,119,6,0.12)'  },
    { label: 'Good',        color: '#2563eb', bg: 'rgba(37,99,235,0.12)'  },
    { label: 'Strong 🔒',  color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
  ]
  return { score, checks, ...config[Math.min(score, 4)] }
}

function validatePassword(pw) {
  if (!pw)              return 'Password is required.'
  if (pw.length < 8)    return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter (A–Z).'
  if (!/[a-z]/.test(pw)) return 'Password must include at least one lowercase letter (a–z).'
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number (0–9).'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include at least one special character (!@#$%^&*).'
  return null
}

function validateConfirm(pw, confirm) {
  if (!confirm)     return 'Please confirm your password.'
  if (pw !== confirm) return 'Passwords do not match. Please re-enter.'
  return null
}

function validateName(val, label) {
  const v = val.trim()
  if (!v) return `${label} is required.`
  if (v.length < 2) return `${label} must be at least 2 characters.`
  if (/[0-9]/.test(v)) return `${label} should not contain numbers.`
  if (/[^a-zA-ZÀ-ÿ\s'\-]/.test(v)) return `${label} contains invalid characters.`
  return null
}

function validateContact(val) {
  const v = val.trim().replace(/[\s\-\(\)]/g, '')
  if (!v) return 'Contact number is required.'
  if (!/^\+?[0-9]{7,15}$/.test(v)) return 'Enter a valid phone number (7–15 digits, optional + prefix).'
  return null
}

export default function Signup() {
  const { signup } = useApp()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    contact: '', password: '', confirmPassword: '', bio: '',
  })
  const [agreed,  setAgreed]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [apiError,setApiError]= useState('')
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState(1)
  const [showPass, setShowPass]= useState(false)
  const [showConf, setShowConf]= useState(false)

  const strength = form.password ? analyzePassword(form.password) : null

  const setField = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validateStep1 = () => {
    const e = {
      firstName: validateName(form.firstName, 'First name'),
      lastName:  validateName(form.lastName,  'Last name'),
      email:     validateEmail(form.email),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const validateStep2 = () => {
    const e = {
      contact:         validateContact(form.contact),
      password:        validatePassword(form.password),
      confirmPassword: validateConfirm(form.password, form.confirmPassword),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const goToStep2 = () => {
    setApiError('')
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validateStep2()) return
    if (!agreed) { setApiError('You must agree to the Terms of Service to continue.'); return }

    setLoading(true)
    try {
      await signup(form)
      navigate('/explorer')
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="page-entrance" style={{ minHeight:'100vh', display:'flex', background:'var(--surface)' }}>

      {/* ── Left panel ── */}
      <div className="hide-mobile" style={{ flex:'0 0 44%', background:'var(--ink)', display:'flex', flexDirection:'column', padding:'clamp(36px,5vw,56px)', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-60, right:-60, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,242,48,0.12) 0%, transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />

        <Link to="/" className="logo" style={{ color:'#fff', position:'relative' }}>
          swap<span style={{ color:'var(--lime)' }}>pit</span>
        </Link>

        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', gap:8, marginBottom:36 }}>
            {[1,2].map(n => <div key={n} style={{ height:3, flex:1, borderRadius:2, background: step >= n ? 'var(--lime)' : 'rgba(245,244,240,0.15)', transition:'background 0.3s' }} />)}
          </div>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(28px,3vw,44px)', color:'#fff', lineHeight:0.95, letterSpacing:'-0.035em', marginBottom:20 }}>
            Join the swap<br />community.
          </h2>
          <p style={{ fontSize:15, color:'rgba(245,244,240,0.45)', lineHeight:1.75, marginBottom:36 }}>
            Post items, find matches, trade fairly. No fees, no cash required.
          </p>

          {/* Password requirements guide */}
          {step === 2 && (
            <div style={{ padding:'16px 18px', background:'rgba(245,244,240,0.05)', borderRadius:12, border:'1px solid rgba(245,244,240,0.08)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--lime)', fontFamily:'var(--font-display)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>🔒 Password Requirements</div>
              {[
                ['length',    '8+ characters'],
                ['uppercase', 'One uppercase letter (A–Z)'],
                ['lowercase', 'One lowercase letter (a–z)'],
                ['number',    'One number (0–9)'],
                ['special',   'One special character (!@#$%)'],
              ].map(([key, label]) => {
                const met = strength?.checks?.[key] ?? false
                return (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background: met ? 'var(--lime)' : 'rgba(245,244,240,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, flexShrink:0, transition:'background 0.2s' }}>
                      {met ? '✓' : ''}
                    </div>
                    <span style={{ fontSize:12, color: met ? 'rgba(245,244,240,0.8)' : 'rgba(245,244,240,0.35)', transition:'color 0.2s' }}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ fontSize:12, color:'rgba(245,244,240,0.2)', position:'relative' }}>Made with ♥ in Cameroon</div>
      </div>

      {/* ── Right: form ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(32px,5vw,56px) clamp(20px,5vw,56px)', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <Link to="/" className="logo" style={{ display:'block', marginBottom:36 }}>
            swap<span style={{ color:'var(--coral)' }}>pit</span>
          </Link>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:6, marginBottom:24 }}>
            {[1,2].map(n => <div key={n} style={{ height:3, width: step===n ? 28 : 14, borderRadius:2, background: step>=n ? 'var(--ink)' : 'var(--border-md)', transition:'all 0.3s' }} />)}
          </div>

          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(24px,3vw,34px)', letterSpacing:'-0.03em', marginBottom:6 }}>
            {step === 1 ? 'Create account' : 'Secure your account'}
          </h1>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:28 }}>
            {step === 1 ? "Join the trading community — it's free" : 'Set a strong password to protect your account'}
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }} noValidate>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <SF label="First name"   name="firstName" value={form.firstName} onChange={setField} error={errors.firstName} placeholder="Armel" />
                  <SF label="Last name"    name="lastName"  value={form.lastName}  onChange={setField} error={errors.lastName}  placeholder="Kamga" />
                </div>
                <SF label="Email address" name="email" type="email" value={form.email} onChange={setField} error={errors.email} placeholder="yourname@gmail.com"
                  hint={form.email && !errors.email ? '✓ Valid email format' : null}
                  hintColor="#059669"
                />
                <button type="button" onClick={goToStep2} style={BtnStyle()}>Continue →</button>
              </>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <>
                <SF label="Contact number" name="contact" type="tel" value={form.contact} onChange={setField} error={errors.contact} placeholder="+237 6XX XXX XXX" />

                {/* Password with strength meter */}
                <div>
                  <SF label="Password" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={setField} error={errors.password} placeholder="Min. 8 chars, uppercase, number, symbol"
                    suffix={<button type="button" onClick={() => setShowPass(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:14, padding:'0 12px' }}>{showPass ? '🙈' : '👁'}</button>}
                  />
                  {/* Strength bar */}
                  {form.password && strength && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ display:'flex', gap:3, marginBottom:5 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= strength.score ? strength.color : 'var(--border-md)', transition:'background 0.25s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color: strength.color, fontFamily:'var(--font-display)' }}>{strength.label}</div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <SF label="Confirm password" name="confirmPassword" type={showConf ? 'text' : 'password'} value={form.confirmPassword} onChange={setField} error={errors.confirmPassword} placeholder="Re-enter your password"
                    suffix={<button type="button" onClick={() => setShowConf(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:14, padding:'0 12px' }}>{showConf ? '🙈' : '👁'}</button>}
                    hint={form.confirmPassword && form.confirmPassword === form.password ? '✓ Passwords match' : null}
                    hintColor="#059669"
                  />
                </div>

                <SF label="Short bio (optional)" name="bio" value={form.bio} onChange={setField} placeholder="Tell others about yourself…" />

                {/* Terms checkbox */}
                <label style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', marginTop:4 }}>
                  <div onClick={() => setAgreed(a => !a)} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${agreed ? 'var(--ink)' : 'var(--border-md)'}`, background: agreed ? 'var(--ink)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all 0.2s', cursor:'pointer' }}>
                    {agreed && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
                    I agree to the <a href="#" style={{ color:'var(--ink)', fontWeight:600 }}>Terms of Service</a> and{' '}
                    <a href="#" style={{ color:'var(--ink)', fontWeight:600 }}>Privacy Policy</a>
                  </span>
                </label>

                {apiError && <ErrBox>{apiError}</ErrBox>}

                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" onClick={() => { setStep(1); setErrors({}) }} style={{ flex:1, padding:'13px', borderRadius:'var(--radius-sm)', border:'1.5px solid var(--border-md)', background:'transparent', color:'var(--muted)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-md)'; e.currentTarget.style.color='var(--muted)' }}
                  >← Back</button>
                  <button type="submit" disabled={loading} style={{ ...BtnStyle(), flex:2, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Creating account…' : 'Create Account 🔒'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p style={{ textAlign:'center', fontSize:14, color:'var(--muted)', marginTop:28 }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color:'var(--ink)', fontWeight:700, fontFamily:'var(--font-display)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Secure field component ─────────────────────────────────────────────────────
function SF({ label, name, type='text', value, onChange, error, placeholder, suffix, hint, hintColor }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color: error ? 'var(--error)' : 'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, fontFamily:'var(--font-display)', transition:'color 0.2s' }}>
        {label}
      </label>
      <div style={{ display:'flex', alignItems:'center', borderRadius:'var(--radius-sm)', border:`2px solid ${error ? 'var(--error)' : 'var(--border-md)'}`, background:'#fff', overflow:'hidden', transition:'border-color 0.2s, box-shadow 0.2s' }}
        onFocusCapture={e => e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--ink)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border-md)'}
      >
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder || ''}
          style={{ flex:1, padding:'11px 13px', border:'none', outline:'none', fontSize:14, fontFamily:'var(--font-body)', color:'var(--ink)', background:'transparent' }} />
        {suffix}
      </div>
      {error && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:5, marginTop:5 }}>
          <span style={{ fontSize:12, flexShrink:0 }}>⚠️</span>
          <span style={{ fontSize:12, color:'var(--error)', fontWeight:500 }}>{error}</span>
        </div>
      )}
      {hint && !error && (
        <div style={{ fontSize:12, color: hintColor || 'var(--success)', marginTop:4, fontWeight:600 }}>{hint}</div>
      )}
    </div>
  )
}

function BtnStyle() {
  return { padding:'13px 20px', borderRadius:'var(--radius-sm)', background:'var(--ink)', color:'var(--lime)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, border:'none', cursor:'pointer', width:'100%', transition:'transform 0.2s var(--ease-spring), box-shadow 0.2s' }
}

function ErrBox({ children }) {
  return (
    <div style={{ padding:'12px 16px', borderRadius:'var(--radius-sm)', background:'rgba(239,68,68,0.08)', color:'var(--error)', fontSize:13, border:'1px solid rgba(239,68,68,0.2)', display:'flex', gap:8, alignItems:'flex-start' }}>
      <span>⚠️</span><span>{children}</span>
    </div>
  )
}
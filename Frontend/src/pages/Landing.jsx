import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useEffect, useState, useRef } from 'react'

const WORDS = ['phones','clothes','books','gadgets','cameras','furniture']

export default function Landing() {
  const { currentUser } = useApp()
  const [wordIdx, setWordIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const revealRefs = useRef([])

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setWordIdx(i => (i+1)%WORDS.length); setVisible(true) }, 300)
    }, 2600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? 'rgba(245,244,240,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s var(--ease)',
      }}>
        <div style={{
          maxWidth: 'var(--max-w)', margin: '0 auto',
          padding: '0 5%', height: 68,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span className="logo">swap<span style={{ color: 'var(--coral)' }}>pit</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/about" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'var(--muted)', fontFamily: 'var(--font-display)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >About</Link>
            {currentUser ? (
              <Link to="/explorer" className="btn btn--primary" style={{ padding: '10px 22px' }}>Open App →</Link>
            ) : (
              <>
                <Link to="/signin" className="btn btn--outline hide-mobile">Sign in</Link>
                <Link to="/signup" className="btn btn--lime">Get started →</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(100px,12vh,140px) 5% clamp(60px,8vh,100px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(245,244,240,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,244,240,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:'15%', right:'8%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,242,48,0.12) 0%, transparent 65%)', pointerEvents:'none', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'-5%', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,85,51,0.1) 0%, transparent 65%)', pointerEvents:'none', filter:'blur(50px)' }} />

        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', width:'100%', display:'flex', alignItems:'center', gap:'clamp(40px,6vw,80px)', flexWrap:'wrap' }}>

          {/* Left */}
          <div style={{ flex:'1 1 340px', maxWidth:600, animation:'fadeUp 0.6s var(--ease) both' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(200,242,48,0.1)', color:'var(--lime)',
              padding:'6px 16px', borderRadius:'var(--radius-pill)',
              fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              marginBottom:32, border:'1px solid rgba(200,242,48,0.2)',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--lime)', display:'inline-block', boxShadow:'0 0 8px var(--lime)' }} />
              Made in Cameroon · For Everyone
            </div>

            <h1 style={{
              fontFamily:'var(--font-display)', fontWeight:800,
              fontSize:'clamp(42px,6vw,80px)', letterSpacing:'-0.04em', lineHeight:0.95,
              color:'#fff', marginBottom:30,
            }}>
              Don't sell<br />your{' '}
              <span style={{
                color:'var(--lime)',
                opacity: visible ? 1 : 0,
                transition:'opacity 0.28s ease',
                display:'inline-block',
              }}>{WORDS[wordIdx]}</span>
              <br />— <em style={{ fontStyle:'normal', color:'var(--coral)' }}>swap</em> them.
            </h1>

            <p style={{
              fontSize:'clamp(15px,1.4vw,17px)', lineHeight:1.75,
              color:'rgba(245,244,240,0.55)', maxWidth:460, marginBottom:44,
            }}>
              Swappit connects people who have things they no longer need with those who actually want them.
              Trade fairly, reduce waste, build community.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:56 }}>
              <Link to="/signup" className="btn btn--lime" style={{ fontSize:15, padding:'13px 36px' }}>
                Start Swapping →
              </Link>
              <a href="#how" className="btn btn--outline" style={{ fontSize:15, padding:'13px 28px', color:'rgba(245,244,240,0.6)', borderColor:'rgba(245,244,240,0.15)' }}>
                How it works
              </a>
            </div>

            <div style={{ display:'flex', gap:'clamp(20px,4vw,48px)', flexWrap:'wrap' }}>
              {[['100% Free','No fees, ever'],['Fair Value','Equity checker'],['Local First','Trade nearby']].map(([t,s]) => (
                <div key={t}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'#fff', marginBottom:3 }}>{t}</div>
                  <div style={{ fontSize:12, color:'rgba(245,244,240,0.4)' }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating cards */}
          <div className="hide-mobile" style={{ flex:'1 1 300px', maxWidth:420, height:440, position:'relative', animation:'fadeUp 0.7s var(--ease) 0.15s both' }}>
            <HeroCard top="0%" left="0%" rotate="-4deg" z={1} emoji="📱" title="iPhone 13 Pro" value="180,000" user="Armel K." city="Douala" />
            <HeroCard top="14%" right="0%" rotate="3deg" z={3} featured emoji="👟" title="Nike Air Max" value="55,000" user="Diane M." city="Yaoundé" />
            <HeroCard bottom="0%" left="16%" rotate="-2deg" z={2} emoji="📚" title="Book Collection" value="25,000" user="Patrick N." city="Bafoussam" />
            <div style={{
              position:'absolute', top:'44%', left:'44%', zIndex:10,
              width:48, height:48, borderRadius:'50%',
              background:'var(--lime)', color:'var(--ink)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:800, fontFamily:'var(--font-display)',
              boxShadow:'var(--shadow-glow-lime)',
            }}>⇄</div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div style={{ background:'var(--lime)', padding:'14px 0', overflow:'hidden', borderTop:'none' }}>
        <div style={{ display:'flex', animation:'marquee 18s linear infinite', width:'max-content' }}>
          {[...Array(2)].map((_, ri) => (
            <div key={ri} style={{ display:'flex', gap:0 }}>
              {['📱 Electronics','👕 Clothing','🪑 Furniture','📚 Books','🎸 Music','⚽ Sports','🔁 Swap Now','💯 Free Forever','📍 Cameroon'].map(t => (
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'0 36px', fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, color:'var(--ink)', letterSpacing:'0.01em', whiteSpace:'nowrap' }}>
                  {t} <span style={{ opacity:0.4 }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Problem ── */}
      <section style={{ padding:'clamp(72px,8vw,110px) 5%', background:'var(--surface)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <SLabel>The Problem</SLabel>
          <h2 className="display-lg reveal" style={{ color:'var(--ink)', marginBottom:56, maxWidth:640 }}>
            Why do useful things end up in the bin?
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:2 }}>
            {[
              { n:'01', icon:'📦', t:'Items go to waste', d:"Millions of usable items are discarded simply because finding a new owner is too hard." },
              { n:'02', icon:'💸', t:"Cash isn't always available", d:"Many people can't afford to buy what they need — but often have something of equal value to offer." },
              { n:'03', icon:'🔍', t:"Hard to find the right match", d:"Without a dedicated platform, finding someone who wants what you have is nearly impossible." },
            ].map((p,i) => (
              <div key={p.t} className="reveal" style={{
                padding:'clamp(24px,3.5vw,36px)', transition:'transform 0.3s var(--ease)',
                background: i===1 ? 'var(--ink)' : 'transparent',
                borderRadius:'var(--radius)',
              }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', color: i===1 ? 'var(--lime)' : 'var(--muted)', marginBottom:20 }}>{p.n}</div>
                <div style={{ fontSize:40, marginBottom:20 }}>{p.icon}</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:12, color: i===1 ? '#fff' : 'var(--ink)' }}>{p.t}</h3>
                <p style={{ fontSize:14, color: i===1 ? 'rgba(245,244,240,0.5)' : 'var(--muted)', lineHeight:1.75 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding:'clamp(72px,8vw,110px) 5%', background:'#fff' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <SLabel>How It Works</SLabel>
          <h2 className="display-lg reveal" style={{ color:'var(--ink)', marginBottom:64 }}>Four steps to a fair swap</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:0 }}>
            {[
              { n:'01', icon:'📸', t:'Post your item', d:'Upload a photo, write a description, set your estimated value in FCFA.' },
              { n:'02', icon:'🔎', t:'Explore the market', d:'Browse items from all users. Filter by category, condition, or value range.' },
              { n:'03', icon:'🤝', t:'Propose a swap', d:"Find something you like? Offer one of your items. We show if values balance." },
              { n:'04', icon:'✅', t:'Deal done', d:'Both parties agree → contacts shared → meet and complete the exchange.' },
            ].map((s,i) => (
              <div key={i} className="reveal" style={{
                padding:'clamp(20px,3vw,32px)',
                borderLeft: i>0 ? '1px solid var(--border-md)' : 'none',
                transition:'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  width:40, height:40, borderRadius:'var(--radius-sm)',
                  background:'var(--lime)', color:'var(--ink)',
                  fontFamily:'var(--font-display)', fontWeight:800, fontSize:13,
                  marginBottom:20,
                }}>{s.n}</div>
                <div style={{ fontSize:36, marginBottom:16 }}>{s.icon}</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, marginBottom:10 }}>{s.t}</h3>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.75 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:'clamp(72px,8vw,110px) 5%', background:'var(--ink)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <SLabel light>Our Innovation</SLabel>
          <h2 className="display-lg reveal" style={{ color:'#fff', marginBottom:56 }}>Smart features that make swapping better</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:2 }}>
            {[
              { icon:'💡', t:'Smart Suggestions', d:'The platform automatically finds the best possible matches based on value and category.' },
              { icon:'🔗', t:'Chain Exchanges', d:'A swaps with B, B with C — expanding possibilities beyond direct one-to-one matches.' },
              { icon:'⚖️', t:'Fairness Indicator', d:'Every proposal shows Balanced, Acceptable, or Unfair so both parties always know the score.' },
              { icon:'⭐', t:'Trust Stars', d:'After every swap, both parties can rate each other. More stars = more community trust.' },
            ].map((f,i) => (
              <div key={f.t} className="reveal" style={{
                padding:'clamp(24px,3.5vw,36px)', borderRadius:'var(--radius)',
                background: i===0 ? 'var(--lime)' : 'rgba(245,244,240,0.04)',
                border: i===0 ? 'none' : '1px solid rgba(245,244,240,0.07)',
                transition:'background 0.22s',
              }}
                onMouseEnter={e => { if(i>0) e.currentTarget.style.background='rgba(245,244,240,0.08)' }}
                onMouseLeave={e => { if(i>0) e.currentTarget.style.background='rgba(245,244,240,0.04)' }}
              >
                <div style={{ fontSize:36, marginBottom:20 }}>{f.icon}</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color: i===0 ? 'var(--ink)' : '#fff', marginBottom:12 }}>{f.t}</h3>
                <p style={{ fontSize:14, color: i===0 ? 'rgba(12,12,16,0.65)' : 'rgba(245,244,240,0.45)', lineHeight:1.75 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding:'clamp(64px,7vw,96px) 5%', background:'var(--lime)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:0 }}>
            {[['100%','Free forever'],['0','Listing fees'],['4','Steps to swap'],['∞','Possibilities']].map(([n,l],i) => (
              <div key={l} className="reveal" style={{
                textAlign:'center', padding:'28px 0',
                borderLeft: i>0 ? '1px solid rgba(12,12,16,0.12)' : 'none',
              }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(36px,5vw,64px)', color:'var(--ink)', letterSpacing:'-0.04em', lineHeight:1 }}>{n}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, color:'rgba(12,12,16,0.5)', marginTop:8, letterSpacing:'0.02em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'clamp(72px,8vw,120px) 5%', background:'#fff', textAlign:'center' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <div className="reveal" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'var(--surface)', padding:'6px 18px', borderRadius:'var(--radius-pill)',
            fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
            color:'var(--muted)', marginBottom:28,
          }}>✦ Join the movement</div>
          <h2 className="display-lg reveal" style={{ color:'var(--ink)', marginBottom:20 }}>Ready to start swapping?</h2>
          <p className="reveal" style={{ fontSize:16, color:'var(--muted)', lineHeight:1.75, marginBottom:44 }}>
            Create your free account in under two minutes. Post your first item, browse what others have, and make your first swap today.
          </p>
          <div className="reveal" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/signup" className="btn btn--lime" style={{ fontSize:15, padding:'14px 40px' }}>Create Free Account</Link>
            <Link to="/signin" className="btn btn--outline" style={{ fontSize:15, padding:'14px 30px' }}>I have an account</Link>
          </div>
          <p className="reveal" style={{ fontSize:12, color:'var(--muted)', marginTop:20 }}>No credit card. No fees. Ever.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:'28px 5%', background:'var(--ink)', borderTop:'none' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <span className="logo" style={{ color:'#fff' }}>swap<span style={{ color:'var(--lime)' }}>pit</span></span>
          <span style={{ fontSize:12, color:'rgba(245,244,240,0.3)' }}>© 2026 Swappit · Made with ♥ in Cameroon</span>
          <div style={{ display:'flex', gap:24 }}>
            {['About','Privacy','Contact'].map(l => (
              <Link key={l} to={l==='About' ? '/about' : '#'} style={{ fontSize:13, color:'rgba(245,244,240,0.35)', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color='var(--lime)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(245,244,240,0.35)'}
              >{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

function HeroCard({ emoji, title, value, user, city, top, bottom, left, right, rotate, z, featured }) {
  return (
    <div style={{
      position:'absolute', width:196,
      background: featured ? 'var(--lime)' : 'rgba(245,244,240,0.07)',
      backdropFilter: featured ? 'none' : 'blur(12px)',
      borderRadius:20, padding:'16px 16px 14px',
      border: featured ? 'none' : '1px solid rgba(245,244,240,0.12)',
      boxShadow: featured ? 'var(--shadow-glow-lime)' : '0 20px 60px rgba(0,0,0,0.3)',
      transform:`rotate(${rotate})`, zIndex:z,
      top, bottom, left, right,
    }}>
      <div style={{ fontSize:34, marginBottom:10 }}>{emoji}</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, marginBottom:4, color: featured ? 'var(--ink)' : '#fff' }}>{title}</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:13, color: featured ? 'var(--ink)' : 'var(--lime)', marginBottom:10 }}>{value} FCFA</div>
      <div style={{ borderTop:`1px solid ${featured ? 'rgba(12,12,16,0.12)' : 'rgba(245,244,240,0.1)'}`, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, color: featured ? 'rgba(12,12,16,0.55)' : 'rgba(245,244,240,0.45)', fontWeight:600 }}>👤 {user}</span>
        <span style={{ fontSize:10, color: featured ? 'rgba(12,12,16,0.55)' : 'rgba(245,244,240,0.45)', fontWeight:600 }}>📍 {city}</span>
      </div>
    </div>
  )
}

function SLabel({ children, light }) {
  return (
    <div style={{
      fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
      letterSpacing:'0.08em', textTransform:'uppercase',
      color: light ? 'var(--lime)' : 'var(--muted)',
      marginBottom:18,
    }}>{children}</div>
  )
}
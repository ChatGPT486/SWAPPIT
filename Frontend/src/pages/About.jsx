import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import StarRating from '../components/StarRating'

export default function About() {
  const { getTeam } = useApp()
  const team = getTeam()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{
        background: 'var(--ink)', padding: 'clamp(72px,10vw,120px) 5%',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-80, right:-80, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,242,48,0.1) 0%, transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-40, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,85,51,0.08) 0%, transparent 65%)', filter:'blur(50px)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(200,242,48,0.1)', color: 'var(--lime)',
            padding: '5px 16px', borderRadius: 'var(--radius-pill)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 28, border: '1px solid rgba(200,242,48,0.18)',
          }}>✦ The Team</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(36px,6vw,80px)', letterSpacing: '-0.04em',
            color: '#fff', lineHeight: 0.95, marginBottom: 28, maxWidth: 700,
          }}>
            Built by people<br />who believe<br /><span style={{ color: 'var(--lime)' }}>in sharing.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(15px,1.5vw,17px)', color: 'rgba(245,244,240,0.5)',
            lineHeight: 1.8, maxWidth: 520,
          }}>
            Swappit started as a university project in Cameroon, born out of a simple observation:
            too many useful things go to waste because finding the right trade is hard.
            We built the solution we wished existed.
          </p>
        </div>
      </section>

      {/* ── Mission / Values / Vision ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 5%', background: '#fff' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14, fontFamily: 'var(--font-display)' }}>What drives us</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,46px)', letterSpacing: '-0.03em', marginBottom: 56, lineHeight: 1.0 }}>
            Purpose-built for fair trade
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
            {[
              { icon: '🌍', title: 'Our Mission', text: "Reduce waste and help people access what they need through fair, transparent exchanges. We believe trade is the oldest form of community.", accent: false },
              { icon: '⚖️', title: 'Our Values',  text: "Fairness above all. Every exchange on Swappit is rated for balance, because honest trade builds real trust between strangers.", accent: true },
              { icon: '🚀', title: 'Our Vision',  text: "Start in Cameroon, grow across Africa. A continent where millions of useful items sit idle while others need them — we're changing that.", accent: false },
            ].map(v => (
              <div key={v.title} style={{
                padding: 'clamp(24px,3.5vw,36px)',
                background: v.accent ? 'var(--ink)' : 'transparent',
                borderRadius: 'var(--radius)',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => { if (!v.accent) e.currentTarget.style.background='var(--surface)' }}
                onMouseLeave={e => { if (!v.accent) e.currentTarget.style.background='transparent' }}
              >
                <div style={{ fontSize: 40, marginBottom: 20 }}>{v.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 12, color: v.accent ? '#fff' : 'var(--ink)' }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: v.accent ? 'rgba(245,244,240,0.45)' : 'var(--muted)', lineHeight: 1.8 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 5%', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14, fontFamily: 'var(--font-display)' }}>Meet the builders</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,46px)', letterSpacing: '-0.03em', lineHeight: 1.0 }}>
              The people behind Swappit
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {team.map((member, i) => (
              <TeamCard key={member.id} member={member} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) 5%', background: 'var(--lime)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 0 }}>
            {[
              { value: '8+',   label: 'Items in marketplace' },
              { value: '3',    label: 'Active beta users' },
              { value: '100%', label: 'Free, no fees' },
              { value: '♥',   label: 'Made in Cameroon' },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: 'center', padding: 'clamp(20px,3vw,32px) 0',
                borderLeft: i > 0 ? '1px solid rgba(12,12,16,0.12)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px,5vw,64px)', color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'rgba(12,12,16,0.5)', marginTop: 8, letterSpacing: '0.02em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 5%', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--surface)', padding:'6px 18px', borderRadius:'var(--radius-pill)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:24, fontFamily:'var(--font-display)' }}>✦ Join the movement</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,46px)', letterSpacing: '-0.03em', marginBottom: 18, lineHeight: 1.0 }}>
            Ready to join us?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 40 }}>
            Create your account and start swapping. No fees, no hassle — just fair trades between real people.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{
              padding: '13px 36px', borderRadius: 'var(--radius-pill)',
              background: 'var(--ink)', color: 'var(--lime)',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
              transition: 'all 0.2s var(--ease-spring)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
            >Start Swapping →</Link>
            <Link to="/" style={{
              padding: '13px 28px', borderRadius: 'var(--radius-pill)',
              border: '1.5px solid var(--border-md)', color: 'var(--muted)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-md)'; e.currentTarget.style.color='var(--muted)' }}
            >← Back home</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '24px 5%', background: 'var(--ink)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>
            swap<span style={{ color: 'var(--lime)' }}>pit</span>
          </span>
          <span style={{ fontSize: 12, color: 'rgba(245,244,240,0.25)' }}>© 2026 Swappit · Made with ♥ in Cameroon</span>
        </div>
      </footer>
    </div>
  )
}

function TeamCard({ member, delay }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', overflow: 'hidden',
      transition: 'transform 0.3s var(--ease-spring), box-shadow 0.3s var(--ease)',
      animation: `fadeUp 0.5s var(--ease) ${delay}ms both`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Accent bar */}
      <div style={{ height: 4, background: member.color || 'var(--lime)' }} />

      <div style={{ padding: 'clamp(20px,3vw,28px)' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: (member.color || '#c8f230') + '18',
          border: `2px solid ${(member.color || '#c8f230')}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, marginBottom: 18,
        }}>{member.emoji}</div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {member.name}
        </h3>
        <div style={{
          display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-pill)',
          background: (member.color || '#c8f230') + '15', color: member.color || 'var(--ink)',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 14, fontFamily: 'var(--font-display)',
        }}>{member.role}</div>

        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.75 }}>{member.bio}</p>
      </div>
    </div>
  )
}
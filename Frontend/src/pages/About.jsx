import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

// ── Real team data ─────────────────────────────────────────────────────────
const TEAM = [
  {
    id:    't1',
    name:  'Tabi Paul Agwe',
    role:  'Full Stack Developer',
    badge: 'Product Owner',
    bio:   'Leads product vision and drives end-to-end development across the full stack. Ensures every feature delivers real value to Swappit users across Cameroon.',
    initials: 'TA',
    color: '#e8521f',
    photo: '../images/tabi.jpg',   // replace with image path when ready e.g. '/team/tabi.jpg'
  },
  {
    id:    't2',
    name:  'Takam Serge',
    role:  'Full Stack Developer',
    badge: 'Scrum Master',
    bio:   'Keeps the team moving with agile practices and removes blockers so we ship fast. Also contributes across both frontend and backend codebases.',
    initials: 'TS',
    color: '#7c3aed',
    photo: '../images/takam.jpg',   // replace with image path when ready e.g. '/team/takam.jpg'

  },
  {
    id:    't3',
    name:  'Obam Banga Samuel',
    role:  'Frontend Developer',
    badge: 'Database Engineer',
    bio:   'Crafts pixel-perfect UI components and designs the data schemas that power the marketplace. Bridges the gap between design and data.',
    initials: 'OS',
    color: '#0891b2',
    photo: '../images/obam.jpg',   // replace with image path when ready e.g. '/team/obam.jpg'
  },
  {
    id:    't4',
    name:  'Ndongo Pamsy',
    role:  'Frontend Developer',
    badge: null,
    bio:   'Transforms mockups into responsive, accessible React components. Obsessed with smooth animations and clean user experiences.',
    initials: 'NP',
    color: '#16a34a',
    photo: '../images/pamsy.jpg',   // replace with image path when ready e.g. '/team/ndongo.jpg'
  },
  {
    id:    't5',
    name:  'Nzeugang Daniel',
    role:  'Backend Developer',
    badge: null,
    bio:   'Architects the Django REST API, manages database migrations and keeps the server-side logic clean, secure and performant.',
    initials: 'ND',
    color: '#d97706',
    photo: '../images/snip.jpg',   // replace with image path when ready e.g. '/team/daniel.jpg'
  },
]

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ background: 'var(--ink)', padding: 'clamp(72px,10vw,120px) 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-80, right:-80, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,242,48,0.1) 0%, transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-40, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,85,51,0.08) 0%, transparent 65%)', filter:'blur(50px)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', position: 'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(200,242,48,0.1)', color:'var(--lime)', padding:'5px 16px', borderRadius:'var(--radius-pill)', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:28, border:'1px solid rgba(200,242,48,0.18)' }}>
            ✦ The Team
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(36px,6vw,80px)', letterSpacing:'-0.04em', color:'#fff', lineHeight:0.95, marginBottom:28, maxWidth:700 }}>
            Built by people<br />who believe<br /><span style={{ color:'var(--lime)' }}>in sharing.</span>
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,17px)', color:'rgba(245,244,240,0.5)', lineHeight:1.8, maxWidth:540 }}>
            Swappit was born at university in Cameroon from a simple observation: too many useful
            things go to waste because finding the right trade is hard. Five builders.
            One mission. We built the solution we wished existed.
          </p>
        </div>
      </section>

      {/* ── Mission / Values / Vision ── */}
      <section style={{ padding:'clamp(60px,8vw,100px) 5%', background:'#fff' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:14, fontFamily:'var(--font-display)' }}>What drives us</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,3.5vw,46px)', letterSpacing:'-0.03em', marginBottom:56, lineHeight:1.0 }}>
            Purpose-built for fair trade
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:2 }}>
            {[
              { icon:'🌍', title:'Our Mission', text:'Reduce waste and help people access what they need through fair, transparent exchanges. We believe trade is the oldest form of community.', accent:false },
              { icon:'⚖️', title:'Our Values',  text:'Fairness above all. Every exchange on Swappit is rated for balance, because honest trade builds real trust between strangers.', accent:true },
              { icon:'🚀', title:'Our Vision',  text:"Start in Cameroon, grow across Africa. A continent where millions of useful items sit idle while others need them — we're changing that.", accent:false },
            ].map(v => (
              <div key={v.title} style={{ padding:'clamp(24px,3.5vw,36px)', background:v.accent ? 'var(--ink)' : 'transparent', borderRadius:'var(--radius)', transition:'background 0.2s' }}
                onMouseEnter={e => { if (!v.accent) e.currentTarget.style.background='var(--surface)' }}
                onMouseLeave={e => { if (!v.accent) e.currentTarget.style.background='transparent' }}
              >
                <div style={{ fontSize:40, marginBottom:20 }}>{v.icon}</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:12, color:v.accent ? '#fff' : 'var(--ink)' }}>{v.title}</h3>
                <p style={{ fontSize:14, color:v.accent ? 'rgba(245,244,240,0.45)' : 'var(--muted)', lineHeight:1.8 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section style={{ padding:'clamp(60px,8vw,100px) 5%', background:'var(--surface)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div style={{ marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:14, fontFamily:'var(--font-display)' }}>Meet the builders</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,3.5vw,46px)', letterSpacing:'-0.03em', lineHeight:1.0 }}>
              The 5 people behind Swappit
            </h2>
          </div>

          {/* Top row — 3 cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20, marginBottom:20 }}>
            {TEAM.slice(0, 3).map((member, i) => (
              <TeamCard key={member.id} member={member} delay={i * 80} />
            ))}
          </div>

          {/* Bottom row — 2 cards centered */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20, maxWidth:680, margin:'0 auto' }}>
            {TEAM.slice(3).map((member, i) => (
              <TeamCard key={member.id} member={member} delay={(i + 3) * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding:'clamp(48px,6vw,80px) 5%', background:'var(--lime)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:0 }}>
            {[
              { value:'5',    label:'Team members' },
              { value:'100%', label:'Free, no fees' },
              { value:'1',    label:'Mission' },
              { value:'♥',   label:'Made in Cameroon' },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign:'center', padding:'clamp(20px,3vw,32px) 0', borderLeft: i > 0 ? '1px solid rgba(12,12,16,0.12)' : 'none' }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(36px,5vw,64px)', color:'var(--ink)', letterSpacing:'-0.04em', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:12, color:'rgba(12,12,16,0.5)', marginTop:8, letterSpacing:'0.02em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'clamp(60px,8vw,100px) 5%', background:'#fff', textAlign:'center' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--surface)', padding:'6px 18px', borderRadius:'var(--radius-pill)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:24, fontFamily:'var(--font-display)' }}>✦ Join the movement</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,3.5vw,46px)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.0 }}>
            Ready to join us?
          </h2>
          <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.8, marginBottom:40 }}>
            Create your account and start swapping. No fees, no hassle — just fair trades between real people.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/signup" style={{ padding:'13px 36px', borderRadius:'var(--radius-pill)', background:'var(--ink)', color:'var(--lime)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, transition:'all 0.2s var(--ease-spring)', display:'inline-flex', alignItems:'center', gap:8 }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
            >Start Swapping →</Link>
            <Link to="/" style={{ padding:'13px 28px', borderRadius:'var(--radius-pill)', border:'1.5px solid var(--border-md)', color:'var(--muted)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, transition:'all 0.2s', display:'inline-flex', alignItems:'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-md)'; e.currentTarget.style.color='var(--muted)' }}
            >← Back home</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:'24px 5%', background:'var(--ink)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.04em' }}>
            swap<span style={{ color:'var(--lime)' }}>pit</span>
          </span>
          <span style={{ fontSize:12, color:'rgba(245,244,240,0.25)' }}>© 2026 Swappit · Made with ♥ in Cameroon</span>
        </div>
      </footer>
    </div>
  )
}

// ── Team Card component ────────────────────────────────────────────────────
function TeamCard({ member, delay }) {
  return (
    <div style={{ background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden', transition:'transform 0.3s var(--ease-spring), box-shadow 0.3s var(--ease)', animation:`fadeUp 0.5s var(--ease) ${delay}ms both` }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Accent top bar */}
      <div style={{ height:4, background: member.color || 'var(--lime)' }} />

      <div style={{ padding:'clamp(20px,3vw,28px)' }}>

        {/* Avatar — photo when available, initials as fallback */}
        <div style={{ marginBottom:20, position:'relative', width:72, height:72 }}>
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:`3px solid ${member.color}30`, display:'block' }}
            />
          ) : (
            <div style={{ width:72, height:72, borderRadius:'50%', background:`${member.color}18`, border:`3px solid ${member.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color: member.color }}>
                {member.initials}
              </span>
            </div>
          )}
          {/* Online-style indicator dot */}
          <div style={{ position:'absolute', bottom:2, right:2, width:14, height:14, borderRadius:'50%', background: member.color, border:'2px solid #fff', boxShadow:`0 0 6px ${member.color}60` }} />
        </div>

        {/* Name */}
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, marginBottom:6, color:'var(--ink)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
          {member.name}
        </h3>

        {/* Role */}
        <div style={{ fontSize:13, fontWeight:600, color:'var(--muted)', marginBottom: member.badge ? 8 : 14 }}>
          {member.role}
        </div>

        {/* Badge (Product Owner / Scrum Master) */}
        {member.badge && (
          <div style={{ display:'inline-block', padding:'3px 12px', borderRadius:'var(--radius-pill)', background:`${member.color}18`, color: member.color, fontSize:10, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:14, fontFamily:'var(--font-display)', border:`1px solid ${member.color}30` }}>
            {member.badge}
          </div>
        )}

        {/* Bio */}
        <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.75, margin:0 }}>
          {member.bio}
        </p>
      </div>
    </div>
  )
}
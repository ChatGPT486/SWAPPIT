import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const TEAM = [
  { id:'t1', name:'Tabi Paul Agwe', role:'Full Stack Developer', badge:'Product Owner', bio:'Leads product vision and drives end-to-end development across the full stack.', initials:'TA', color:'#e8521f', photo:'../images/tabi.jpg' },
  { id:'t2', name:'Takam Serge', role:'Full Stack Developer', badge:'Scrum Master', bio:'Keeps the team moving with agile practices and removes blockers so we ship fast.', initials:'TS', color:'#7c3aed', photo:'../images/takam.jpg' },
  { id:'t3', name:'Obam Banga Samuel', role:'Frontend Developer', badge:'Database Engineer', bio:'Crafts pixel-perfect UI components and designs the data schemas that power the marketplace.', initials:'OS', color:'#0891b2', photo:'../images/obam.jpg' },
  { id:'t4', name:'Ndongo Pamsy', role:'Frontend Developer', badge:null, bio:'Transforms mockups into responsive, accessible React components.', initials:'NP', color:'#16a34a', photo:'../images/pamsy.jpg' },
  { id:'t5', name:'Nzeugang Daniel', role:'Backend Developer', badge:null, bio:'Architects the Django REST API and keeps the server-side logic clean and secure.', initials:'ND', color:'#d97706', photo:'../images/snip.jpg' },
]

export default function About() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <Navbar />
      <section style={{ background:'var(--ink)', padding:'clamp(72px,10vw,120px) 5%' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(36px,6vw,80px)', color:'#fff', lineHeight:0.95, marginBottom:28 }}>Built by people<br />who believe<br /><span style={{ color:'var(--lime)' }}>in sharing.</span></h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,17px)', color:'rgba(245,244,240,0.5)', lineHeight:1.8, maxWidth:540 }}>Swappit was born at university in Cameroon. Five builders. One mission.</p>
        </div>
      </section>
      <section style={{ padding:'clamp(60px,8vw,100px) 5%', background:'var(--surface)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,3.5vw,46px)', marginBottom:56 }}>The 5 people behind Swappit</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20, marginBottom:20 }}>
            {TEAM.slice(0,3).map((m,i) => <TeamCard key={m.id} member={m} />)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20, maxWidth:680, margin:'0 auto' }}>
            {TEAM.slice(3).map((m,i) => <TeamCard key={m.id} member={m} />)}
          </div>
        </div>
      </section>
      <section style={{ padding:'clamp(48px,6vw,80px) 5%', background:'var(--lime)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:0 }}>
          {[{value:'5',label:'Team members'},{value:'100%',label:'Free, no fees'},{value:'1',label:'Mission'},{value:'♥',label:'Made in Cameroon'}].map((s,i) => (
            <div key={s.label} style={{ textAlign:'center', padding:'clamp(20px,3vw,32px) 0', borderLeft:i>0?'1px solid rgba(12,12,16,0.12)':'none' }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(36px,5vw,64px)', color:'var(--ink)' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'rgba(12,12,16,0.5)', marginTop:8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding:'clamp(60px,8vw,100px) 5%', background:'#fff', textAlign:'center' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(26px,3.5vw,46px)', marginBottom:18 }}>Ready to join us?</h2>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:40 }}>
            <Link to="/signup" style={{ padding:'13px 36px', borderRadius:'var(--radius-pill)', background:'var(--ink)', color:'var(--lime)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:15 }}>Start Swapping →</Link>
            <Link to="/" style={{ padding:'13px 28px', borderRadius:'var(--radius-pill)', border:'1.5px solid var(--border-md)', color:'var(--muted)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>← Back home</Link>
          </div>
        </div>
      </section>
      <footer style={{ padding:'24px 5%', background:'var(--ink)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'#fff' }}>swap<span style={{ color:'var(--lime)' }}>pit</span></span>
          <span style={{ fontSize:12, color:'rgba(245,244,240,0.25)' }}>© 2026 Swappit · Made with ♥ in Cameroon</span>
        </div>
      </footer>
    </div>
  )
}

function TeamCard({ member }) {
  return (
    <div style={{ background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
    >
      <div style={{ height:4, background:member.color||'var(--lime)' }} />
      <div style={{ padding:'clamp(20px,3vw,28px)' }}>
        <div style={{ marginBottom:20, width:72, height:72, borderRadius:'50%', background:`${member.color}18`, border:`3px solid ${member.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color:member.color }}>{member.initials}</span>
        </div>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, marginBottom:6, color:'var(--ink)' }}>{member.name}</h3>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--muted)', marginBottom:member.badge?8:14 }}>{member.role}</div>
        {member.badge && <div style={{ display:'inline-block', padding:'3px 12px', borderRadius:'var(--radius-pill)', background:`${member.color}18`, color:member.color, fontSize:10, fontWeight:800, textTransform:'uppercase', marginBottom:14, border:`1px solid ${member.color}30` }}>{member.badge}</div>}
        <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.75, margin:0 }}>{member.bio}</p>
      </div>
    </div>
  )
}

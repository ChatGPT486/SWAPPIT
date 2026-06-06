import { Link } from 'react-router-dom';

const TEAM = [
    { id: 1, name: 'Membre 1', role: 'Fullstack Developer', bio: 'Passionné de tech et de commerce équitable. Architecte du système de troc.', emoji: '👨‍💻', color: '#E8521F' },
    { id: 2, name: 'Membre 2', role: 'UI/UX Designer', bio: 'Créatrice de l\'interface Swappit. Croit en un design centré sur l\'humain.', emoji: '🎨', color: '#3B82F6' },
    { id: 3, name: 'Membre 3', role: 'Backend Engineer', bio: 'Architecte Django. Garant de la performance et de la sécurité de la plateforme.', emoji: '⚙️', color: '#10B981' },
];

export default function About() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
            {/* Navbar simple */}
            <nav style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 5%', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                    swap<span style={{ color: 'var(--accent)' }}>pit</span>
                </Link>
                <div style={{ display: 'flex', gap: 16 }}>
                    <Link to="/explorer" style={{ fontSize: 14, color: 'var(--ink-muted)', fontWeight: 500 }}>Explorer</Link>
                    <Link to="/signup" style={{ background: 'var(--ink)', color: '#fff', padding: '8px 18px', borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600 }}>
                        Commencer
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ background: 'var(--ink)', padding: '80px 5% 100px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,82,31,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(232,82,31,0.15)', color: 'var(--accent)', padding: '5px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 24 }}>
                        ✦ The Team
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(36px, 5vw, 68px)', letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.0, marginBottom: 24, maxWidth: 700 }}>
                        Built by people who believe in sharing.
                    </h1>
                    <p style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 560 }}>
                        Swappit est né d'un projet universitaire au Cameroun, d'une observation simple : trop d'objets utiles sont gaspillés parce qu'il est difficile de trouver le bon échange.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section style={{ padding: '80px 5%', background: '#fff' }}>
                <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {[
                            { icon: '🌍', title: 'Notre Mission', text: "Réduire le gaspillage et aider les gens à accéder à ce dont ils ont besoin grâce à des échanges équitables et transparents." },
                            { icon: '⚖️', title: 'Nos Valeurs', text: "L'équité avant tout. Chaque échange sur Swappit est évalué pour son équilibre, car un commerce honnête crée une vraie confiance." },
                            { icon: '🚀', title: 'Notre Vision', text: "Partir du Cameroun, grandir à travers l'Afrique. Un continent où des millions d'objets utiles restent inutilisés — nous changeons ça." },
                        ].map(v => (
                            <div key={v.title} style={{ padding: '28px 24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', transition: 'transform var(--transition), box-shadow var(--transition)' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginBottom: 10 }}>{v.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>{v.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section style={{ padding: '80px 5%', background: 'var(--surface)' }}>
                <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
                    <div style={{ marginBottom: 52 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                            Meet the builders
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px, 3vw, 42px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                            The people behind Swappit
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {TEAM.map((member, i) => (
                            <TeamCard key={member.id} member={member} delay={i * 60} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ padding: '80px 5%', background: 'var(--ink)' }}>
                <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
                        {[
                            { value: '8+', label: 'Articles sur la plateforme' },
                            { value: '3', label: 'Utilisateurs beta actifs' },
                            { value: '100%', label: 'Gratuit, sans frais' },
                            { value: '♥', label: 'Made in Cameroon' },
                        ].map(s => (
                            <div key={s.label}>
                                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(32px, 4vw, 52px)', color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 5%', background: '#fff', textAlign: 'center' }}>
                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 3vw, 38px)', letterSpacing: '-0.02em', marginBottom: 16 }}>
                        Ready to join us?
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 32 }}>
                        Crée ton compte et commence à troquer. Sans frais, sans tracas.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/signup" style={{ padding: '12px 32px', borderRadius: 'var(--radius-pill)', background: 'var(--ink)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, transition: 'background var(--transition)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
                        >Start Swapping →</Link>
                        <Link to="/" style={{ padding: '12px 28px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--border)', color: 'var(--ink-muted)', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15 }}>
                            ← Retour
                        </Link>
                    </div>
                </div>
            </section>

            <footer style={{ padding: '28px 5%', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>swap<span style={{ color: 'var(--accent)' }}>pit</span></span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>© 2026 Swappit · Made with ♥ in Cameroon</span>
                </div>
            </footer>
        </div>
    );
}

function TeamCard({ member, delay }) {
    return (
        <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'transform var(--transition), box-shadow var(--transition)', animation: `fadeUp 0.5s ease ${delay}ms both` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{ height: 6, background: member.color }} />
            <div style={{ padding: 24 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: member.color + '18', border: `2px solid ${member.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>{member.emoji}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 4, color: 'var(--ink)' }}>{member.name}</h3>
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: member.color + '12', color: member.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>{member.role}</div>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65 }}>{member.bio}</p>
            </div>
        </div>
    );
}

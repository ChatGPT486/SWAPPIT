import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useEffect, useState } from 'react';

const WORDS = ['phones', 'clothes', 'books', 'gadgets', 'cameras', 'furniture'];

export default function Landing() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [wordIdx, setWordIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % WORDS.length);
        setVisible(true);
      }, 320);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    // Rester sur la landing, l'état va se mettre à jour
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(246,247,249,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 'var(--max-w)', margin: '0 auto',
          padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
            swap<span style={{ color: 'var(--accent)' }}>pit</span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/about" style={{ padding: '6px 14px', fontSize: 14, fontWeight: 500, color: 'var(--ink-muted)', borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
            >About</Link>

            {currentUser ? (
              /* ── UTILISATEUR CONNECTÉ : affiche son nom + boutons app ── */
              <>
                <span style={{
                  fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500,
                  padding: '6px 12px', background: 'var(--surface)',
                  borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)',
                }}>
                  👤 @{currentUser.username}
                </span>
                <Link to="/explorer" style={btnPrimary}>
                  Ouvrir l'app →
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid var(--border)', background: 'transparent',
                    color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
              </>
            ) : (
              /* ── NON CONNECTÉ : affiche Sign in + Get started ── */
              <>
                <Link to="/signin" style={btnOutline} className="hide-mobile">Sign in</Link>
                <Link to="/signup" style={btnPrimary}>Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: 'clamp(100px, 12vh, 140px) 5% clamp(64px, 8vh, 100px)',
        background: 'linear-gradient(160deg, #f6f7f9 0%, #eef0f5 60%, #fdf1eb 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,82,31,0.07) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-3%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,82,31,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 'clamp(32px, 6vw, 80px)', flexWrap: 'wrap' }}>

          {/* Texte gauche */}
          <div style={{ flex: '1 1 320px', maxWidth: 580, animation: 'fadeUp 0.6s ease' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(232,82,31,0.08)', color: 'var(--accent)',
              padding: '5px 14px', borderRadius: 'var(--radius-pill)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
              Made in Cameroon · For Everyone
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(38px, 5.5vw, 72px)',
              letterSpacing: '-0.035em', lineHeight: 1.0,
              color: 'var(--ink)', marginBottom: 28,
            }}>
              Don't sell your<br />
              <span style={{
                color: 'var(--accent)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.32s ease',
                display: 'inline-block',
                minWidth: '4ch',
              }}>{WORDS[wordIdx]}</span>
              <br />— <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>swap</em> them.
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: 1.75,
              color: 'var(--ink-muted)', maxWidth: 460, marginBottom: 40,
            }}>
              Swappit connecte les personnes qui ont des objets dont elles n'ont plus besoin avec celles qui en ont besoin. Échangez équitablement, réduisez le gaspillage.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
              {currentUser ? (
                /* Utilisateur connecté → CTA vers l'app */
                <>
                  <Link to="/explorer" style={{
                    ...btnPrimary, fontSize: 15, padding: '13px 34px',
                    boxShadow: '0 6px 24px rgba(232,82,31,0.3)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--ink)'; }}
                  >
                    Explorer la vitrine →
                  </Link>
                  <Link to="/publier" style={{ ...btnOutline, fontSize: 15, padding: '13px 28px' }}>
                    + Publier un article
                  </Link>
                </>
              ) : (
                /* Visiteur → CTA vers inscription */
                <>
                  <Link to="/signup" style={{
                    ...btnPrimary, fontSize: 15, padding: '13px 34px',
                    boxShadow: '0 6px 24px rgba(232,82,31,0.3)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--ink)'; }}
                  >
                    Start Swapping →
                  </Link>
                  <a href="#how" style={{ ...btnOutline, fontSize: 15, padding: '13px 28px' }}>
                    How it works
                  </a>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'clamp(20px, 4vw, 44px)', flexWrap: 'wrap' }}>
              {[['100% Free', 'No fees, ever'], ['Fair Value', 'Equity checker'], ['Local First', 'Trade nearby']].map(([t, s]) => (
                <div key={t}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cartes flottantes droite */}
          <div style={{ flex: '1 1 280px', maxWidth: 400, height: 420, position: 'relative', animation: 'fadeUp 0.8s ease 0.15s both' }} className="hide-mobile">
            <FloatCard top="0%" left="4%"    rotate="-3deg"   z={1} emoji="📱" title="iPhone 13 Pro"    value="180,000" user="Armel K."   city="Douala" />
            <FloatCard top="12%" right="0%"  rotate="2.5deg"  z={2} featured emoji="👟" title="Nike Air Max"  value="55,000"  user="Diane M."   city="Yaoundé" />
            <FloatCard bottom="0%" left="14%" rotate="-1.5deg" z={3} emoji="📚" title="Book Collection" value="25,000"  user="Patrick N." city="Bafoussam" />
            <div style={{ position: 'absolute', top: '43%', left: '43%', zIndex: 10, width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 6px 24px rgba(232,82,31,0.4)' }}>
              ⇌
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: 'clamp(64px, 8vw, 100px) 5%', background: '#fff' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px, 3vw, 42px)', letterSpacing: '-0.02em', marginBottom: 52, maxWidth: 480 }}>
            Four steps to your first swap
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {[
              { n: '01', icon: '📸', t: 'Post your item',     d: 'Photo, description, valeur en FCFA — et c\'est en ligne.' },
              { n: '02', icon: '🔎', t: 'Explore the market', d: 'Parcours les articles par catégorie, état ou valeur.' },
              { n: '03', icon: '🤝', t: 'Propose a swap',     d: 'Tu aimes un article ? Propose l\'un des tiens en échange.' },
              { n: '04', icon: '✅', t: 'Deal done',           d: 'Les deux parties acceptent → contacts partagés → échange réel.' },
            ].map((s, i) => (
              <div key={i} style={{ padding: 'clamp(20px, 3vw, 28px)', borderLeft: i > 0 ? '1px dashed var(--border-strong)' : 'none', background: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--border-strong)', letterSpacing: '0.08em', marginBottom: 16 }}>{s.n}</div>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{s.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 5%', background: 'var(--ink)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(232,82,31,0.7)', marginBottom: 14 }}>
            Our Innovation
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px, 3vw, 42px)', letterSpacing: '-0.02em', color: '#fff', marginBottom: 52 }}>
            Smart features that make swapping better
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {[
              { icon: '💡', t: 'Smart Suggestions',  d: 'La plateforme trouve automatiquement les meilleurs matchs pour tes articles.' },
              { icon: '🔗', t: 'Chain Exchanges',     d: 'A échange avec B, B avec C — au-delà des échanges directs.' },
              { icon: '⚖️', t: 'Fairness Indicator',  d: 'Chaque proposition affiche Équitable, Acceptable ou Déséquilibré.' },
              { icon: '⭐', t: 'Trust Stars',          d: 'Après chaque troc, notez-vous mutuellement pour construire votre réputation.' },
            ].map(f => (
              <div key={f.t} style={{ padding: 'clamp(20px, 3vw, 28px)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.18s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ fontSize: 34, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 10 }}>{f.t}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ padding: 'clamp(64px, 8vw, 120px) 5%', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '5px 16px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 28 }}>
            ✦ Join the movement
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px, 3vw, 42px)', letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 18 }}>
            {currentUser ? `Prêt à troquer, @${currentUser.username} ?` : 'Ready to start swapping?'}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--ink-muted)', lineHeight: 1.75, marginBottom: 44 }}>
            {currentUser
              ? 'Tu es déjà connecté. Explore la vitrine ou publie ton premier article !'
              : 'Crée ton compte gratuit en moins de deux minutes. Publie, explore, et fais ton premier troc aujourd\'hui.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {currentUser ? (
              <>
                <Link to="/explorer" style={{ ...btnPrimary, fontSize: 15, padding: '13px 36px', boxShadow: '0 6px 24px rgba(232,82,31,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
                >Explorer la vitrine →</Link>
                <Link to="/myspace" style={{ ...btnOutline, fontSize: 15, padding: '13px 28px' }}>Mon Espace</Link>
              </>
            ) : (
              <>
                <Link to="/signup" style={{ ...btnPrimary, fontSize: 15, padding: '13px 36px', boxShadow: '0 6px 24px rgba(232,82,31,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
                >Create Free Account</Link>
                <Link to="/signin" style={{ ...btnOutline, fontSize: 15, padding: '13px 28px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}
                >I have an account</Link>
              </>
            )}
          </div>
          {!currentUser && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 18 }}>No credit card. No fees. Ever.</p>}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '28px 5%', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
            swap<span style={{ color: 'var(--accent)' }}>pit</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>© 2026 Swappit · Made with ♥ in Cameroon</span>
          <div style={{ display: 'flex', gap: 22 }}>
            {['About', 'Privacy', 'Contact'].map(l => (
              <Link key={l} to={l === 'About' ? '/about' : '#'} style={{ fontSize: 13, color: 'var(--ink-muted)', transition: 'color 0.18s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
              >{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Composants locaux ────────────────────────────────────────────────────────
function FloatCard({ emoji, title, value, user, city, top, bottom, left, right, rotate, z, featured }) {
  return (
    <div style={{
      position: 'absolute', width: 188,
      background: '#fff', borderRadius: 18, padding: '14px 14px 12px',
      border: featured ? '1.5px solid rgba(232,82,31,0.2)' : '1px solid var(--border)',
      boxShadow: featured ? '0 20px 56px rgba(232,82,31,0.14), 0 4px 16px rgba(0,0,0,0.06)' : 'var(--shadow-md)',
      transform: `rotate(${rotate})`,
      zIndex: z, top, bottom, left, right,
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, marginBottom: 3, color: 'var(--ink)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>{value} FCFA</div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 }}>👤 {user}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 }}>📍 {city}</span>
      </div>
    </div>
  );
}

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center',
  padding: '9px 20px', borderRadius: 'var(--radius-pill)',
  background: 'var(--ink)', color: '#fff',
  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
  textDecoration: 'none', transition: 'all 0.2s ease',
};
const btnOutline = {
  display: 'inline-flex', alignItems: 'center',
  padding: '9px 18px', borderRadius: 'var(--radius-pill)',
  background: 'transparent', color: 'var(--ink-muted)',
  fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14,
  border: '1.5px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s ease',
};

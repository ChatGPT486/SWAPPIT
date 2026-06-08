import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

export default function Signin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // loginUser appelle maintenant /api/signin/ qui retourne { access, refresh, user }
            const data = await loginUser({ username, password });

            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/explorer');
        } catch (err) {
            setLoading(false);
            if (err.response?.data) {
                setError(err.response.data.error || err.response.data.detail || "Identifiants invalides.");
            } else {
                setError("Impossible de contacter le serveur backend. Vérifiez que Django tourne.");
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)' }}>
            {/* Panneau gauche */}
            <div className="hide-mobile" style={{
                flex: '0 0 42%', background: 'var(--ink)', color: '#fff',
                padding: '48px', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>💥 swappit.</div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                        Rentre dans le cercle du troc d'objets.
                    </h1>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.6 }}>
                        Connecte-toi pour gérer tes annonces, valider tes propositions d'échanges et suivre tes transactions.
                    </p>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>© 2026 Swappit App.</div>
            </div>

            {/* Panneau droite */}
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ width: '100%', maxWidth: 400 }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>Bon retour ! 👋</h2>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 15, marginBottom: 32 }}>Saisis tes identifiants pour accéder à ton espace.</p>

                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Field label="Nom d'utilisateur" type="text" value={username} onChange={e => setUsername(e.target.value)} />
                        <Field label="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} />

                        <button type="submit" disabled={loading} style={{
                            padding: '14px', borderRadius: 10, marginTop: 8,
                            background: loading ? 'var(--border)' : 'var(--ink)',
                            color: loading ? 'var(--ink-muted)' : '#fff',
                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                            cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                            transition: 'background var(--transition)',
                        }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--ink)'; }}
                        >
                            {loading ? 'Connexion en cours…' : 'Se connecter →'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-muted)', marginTop: 24 }}>
                        Tu n'as pas de compte ?{' '}
                        <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Crée-en un ici</Link>
                    </p>
                </div>
            </div>
        </div>
    );
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
    );
}

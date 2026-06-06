import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createItem, getTokenUserId } from '../services/api';

// CORRECTION : Les catégories correspondent EXACTEMENT aux choix du backend Django
const CATEGORIES = [
    { value: 'Electronics', label: 'Électronique / Informatique' },
    { value: 'Clothing', label: 'Mode / Vêtements' },
    { value: 'Furniture', label: 'Meubles' },
    { value: 'Books', label: 'Livres' },
    { value: 'Music', label: 'Musique' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Other', label: 'Autre' },
];

// CORRECTION : Les conditions correspondent EXACTEMENT aux choix du backend Django
const CONDITIONS = [
    { value: 'NEW', label: 'Neuf' },
    { value: 'LIKE_NEW', label: 'Très bon état' },
    { value: 'USED', label: 'Utilisé' },
];

const EMOJIS = ['📱', '👟', '📚', '🎵', '💻', '🎮', '👗', '🛋️', '📦', '🎸'];

const CreateItem = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Other');
    const [condition, setCondition] = useState('USED');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [value, setValue] = useState('');
    const [emoji, setEmoji] = useState('📦');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError("Le nom de l'article est obligatoire.");
            return;
        }

        setLoading(true);

        // Récupération de l'ID utilisateur depuis le JWT
        const ownerId = getTokenUserId();
        if (!ownerId) {
            setError("Session expirée. Veuillez vous reconnecter.");
            navigate('/signin');
            return;
        }

        try {
            const payload = {
                title: title.trim(),
                category,
                condition,
                description: description.trim(),
                image: image.trim() || null,
                value: value ? parseInt(value, 10) : 0,
                emoji,
                owner_id: ownerId,
            };

            await createItem(payload);
            navigate('/myspace', { replace: true });
        } catch (err) {
            console.error("Erreur publication :", err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Erreur lors de la mise en circulation. Vérifiez votre connexion.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 560, borderRadius: 24, border: '1px solid var(--border)', padding: '40px 36px', boxShadow: 'var(--shadow-sm)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <Link to="/explorer" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>← Retour</Link>
                    <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11, fontWeight: 700 }}>Nouveau Troc</span>
                </div>

                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                    Qu'est-ce que tu proposes ? 📦
                </h1>
                <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 32 }}>
                    Remplis les détails pour trouver le match parfait.
                </p>

                {error && (
                    <div style={{ padding: 12, background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 12, fontSize: 14, fontWeight: 500, marginBottom: 20 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

                    {/* NOM */}
                    <FieldWrapper label="Nom de l'article *">
                        <input
                            type="text"
                            placeholder="Ex: iPhone 13, Nike Air Max..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={inputStyle}
                        />
                    </FieldWrapper>

                    {/* EMOJI */}
                    <FieldWrapper label="Icône">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {EMOJIS.map(e => (
                                <button
                                    key={e} type="button"
                                    onClick={() => setEmoji(e)}
                                    style={{
                                        width: 40, height: 40, fontSize: 20, borderRadius: 10, cursor: 'pointer',
                                        border: emoji === e ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                                        background: emoji === e ? 'var(--accent-soft)' : '#fff',
                                    }}
                                >{e}</button>
                            ))}
                        </div>
                    </FieldWrapper>

                    {/* CATÉGORIE */}
                    <FieldWrapper label="Catégorie">
                        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </FieldWrapper>

                    {/* ÉTAT */}
                    <FieldWrapper label="État de l'objet">
                        <div style={{ display: 'flex', gap: 10 }}>
                            {CONDITIONS.map(c => (
                                <button
                                    key={c.value} type="button"
                                    onClick={() => setCondition(c.value)}
                                    style={{
                                        flex: 1, height: 40, borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                        border: condition === c.value ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                                        background: condition === c.value ? 'var(--accent-soft)' : '#fff',
                                        color: condition === c.value ? 'var(--accent)' : 'var(--ink)',
                                    }}
                                >{c.label}</button>
                            ))}
                        </div>
                    </FieldWrapper>

                    {/* VALEUR ESTIMÉE */}
                    <FieldWrapper label="Valeur estimée (FCFA)">
                        <input
                            type="number"
                            placeholder="Ex: 50000"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            min="0"
                            style={inputStyle}
                        />
                    </FieldWrapper>

                    {/* URL PHOTO */}
                    <FieldWrapper label="URL de la photo (lien web)">
                        <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={image}
                            onChange={e => setImage(e.target.value)}
                            style={inputStyle}
                        />
                        {image && (
                            <img
                                src={image}
                                alt="Aperçu"
                                style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                                onError={e => e.target.style.display = 'none'}
                            />
                        )}
                    </FieldWrapper>

                    {/* DESCRIPTION */}
                    <FieldWrapper label="Description">
                        <textarea
                            placeholder="Décris l'état, ce que tu recherches en échange..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            style={{ ...inputStyle, resize: 'vertical', height: 'auto', padding: '12px 16px' }}
                        />
                    </FieldWrapper>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', height: 52, background: loading ? 'var(--border)' : 'var(--ink)',
                            color: loading ? 'var(--ink-muted)' : '#fff', border: 'none',
                            borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-display)', transition: 'background var(--transition)', marginTop: 8,
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
                        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--ink)'; }}
                    >
                        {loading ? 'Mise en circulation...' : 'Mettre en circulation →'}
                    </button>
                </form>
            </div>
        </div>
    );
};

function FieldWrapper({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle = {
    width: '100%', height: 48, padding: '0 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', background: '#fff',
    fontSize: 14, color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
};

export default CreateItem;

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getItemById, getCurrentUser } from '../services/api';

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const currentUser = getCurrentUser();

    useEffect(() => {
        const fetchItemDetails = async () => {
            try {
                setLoading(true);
                const sanitizedId = String(id).replace(/[^0-9]/g, '');
                if (!sanitizedId) throw new Error("ID invalide.");
                const data = await getItemById(sanitizedId);
                setItem(data);
            } catch (err) {
                console.error("Erreur chargement article :", err);
                setError("Impossible de charger les détails de cet article.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchItemDetails();
    }, [id]);

    const handleProposeTroc = () => {
        if (!currentUser) {
            navigate('/signin');
            return;
        }
        // Redirige vers la page de proposition de troc avec l'article cible
        navigate(`/proposer-troc/${item.id}`, { state: { targetItem: item } });
    };

    const isOwner = currentUser && item && (
        currentUser.id === item.user ||
        currentUser.username === item.user_details?.username
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--surface)', fontSize: 16, fontWeight: 500, color: 'var(--ink-muted)' }}>
                Chargement...
            </div>
        );
    }

    if (error || !item) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 20, background: 'var(--surface)' }}>
                <span style={{ fontSize: 48 }}>⚠️</span>
                <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: 18 }}>{error || "Article introuvable"}</p>
                <Link to="/explorer" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Retour à l'exploration</Link>
            </div>
        );
    }

    // Formatage de la valeur — le backend utilise `value`, pas `price`
    const displayValue = item.value && item.value > 0
        ? `${Number(item.value).toLocaleString('fr-CM')} FCFA`
        : "À débattre";

    const conditionLabel = {
        'NEW': 'Neuf',
        'LIKE_NEW': 'Très bon état',
        'USED': 'Utilisé',
    }[item.condition] || item.condition || "Non spécifié";

    return (
        <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 900, borderRadius: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'row', overflow: 'hidden', gap: 0 }}>

                {/* Photo */}
                <div style={{ flex: '0 0 45%', background: '#f1f3f5', minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<span style="font-size:80px">${item.emoji || '📦'}</span>`;
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 80 }}>{item.emoji || '📦'}</span>
                    )}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 36 }}>
                    <div>
                        <Link to="/explorer" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 20 }}>
                            ← Retour à l'exploration
                        </Link>

                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.category || "Autre"}
                        </span>

                        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink)', marginTop: 8, marginBottom: 12, letterSpacing: '-0.02em' }}>
                            {item.title || "Sans titre"}
                        </h1>

                        <div style={{ display: 'inline-block', padding: '5px 12px', background: 'var(--surface)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', border: '1px solid var(--border)', marginBottom: 20 }}>
                            État : {conditionLabel}
                        </div>

                        <p style={{ color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.65, marginBottom: 28 }}>
                            {item.description || "Aucune description fournie."}
                        </p>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 24 }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--ink-muted)', fontSize: 14, fontWeight: 500 }}>Valeur estimée :</span>
                                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                                    {displayValue}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--ink-muted)', fontSize: 14, fontWeight: 500 }}>Publié par :</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                                    @{item.owner__username || item.user_details?.username || "Utilisateur"}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--ink-muted)', fontSize: 14, fontWeight: 500 }}>Publié le :</span>
                                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {isOwner ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ padding: '12px 16px', background: 'var(--green-soft)', color: 'var(--green)', borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                                ✓ C'est votre article
                            </div>
                            <Link to="/myspace" style={{
                                display: 'block', textAlign: 'center', padding: '13px',
                                background: 'var(--ink)', color: '#fff', borderRadius: 14,
                                fontSize: 15, fontWeight: 600, textDecoration: 'none'
                            }}>
                                Gérer dans Mon Espace →
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={handleProposeTroc}
                            style={{
                                width: '100%', height: 54, background: 'var(--ink)', color: '#fff',
                                border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'var(--font-display)',
                                transition: 'background var(--transition)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
                        >
                            🤝 Proposer un troc
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;

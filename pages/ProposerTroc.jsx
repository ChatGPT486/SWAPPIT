import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { getItemById, getMySpaceData, proposeSwap, getCurrentUser } from '../services/api';

/**
 * Page : Proposer un troc
 * URL : /proposer-troc/:targetItemId
 * State optionnel : { targetItem } (passé depuis ItemDetail pour éviter un fetch)
 */
const ProposerTroc = () => {
    const { targetItemId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const currentUser = getCurrentUser();

    const [targetItem, setTargetItem] = useState(location.state?.targetItem || null);
    const [myItems, setMyItems] = useState([]);
    const [selectedMyItem, setSelectedMyItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/signin');
            return;
        }
        loadData();
    }, [targetItemId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemData, mySpaceData] = await Promise.all([
                targetItem ? Promise.resolve(targetItem) : getItemById(targetItemId),
                getMySpaceData()
            ]);

            setTargetItem(itemData);

            // Filtrer pour ne montrer que les articles de l'utilisateur connecté
            const availableItems = (mySpaceData.items || []).filter(
                item => item.id !== itemData.id
            );
            setMyItems(availableItems);
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les données nécessaires.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedMyItem) {
            setError("Sélectionne l'article que tu veux proposer en échange.");
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            await proposeSwap({
                my_item: selectedMyItem.id,
                their_item: targetItem.id,
                receiver: targetItem.user, // ID du propriétaire de l'article cible
            });
            setSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.error || "Erreur lors de l'envoi de la proposition.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Calcul de la fairness en temps réel
    const getFairnessInfo = () => {
        if (!selectedMyItem || !targetItem) return null;
        const myVal = selectedMyItem.value || 0;
        const theirVal = targetItem.value || 0;

        if (myVal === 0 && theirVal === 0) return { label: '⚖️ Équitable (valeurs non définies)', color: 'var(--ink-muted)', bg: 'var(--surface)' };

        if (myVal === 0 || theirVal === 0) return { label: '⚠️ Déséquilibré (une valeur manque)', color: 'var(--orange)', bg: 'var(--orange-soft)' };

        const ratio = Math.max(myVal, theirVal) / Math.min(myVal, theirVal);
        if (ratio <= 1.2) return { label: '✅ Échange équitable', color: 'var(--green)', bg: 'var(--green-soft)' };
        if (ratio <= 2.0) return { label: '⚠️ Légèrement déséquilibré', color: 'var(--orange)', bg: 'var(--orange-soft)' };
        return { label: '🔴 Échange inéquitable', color: 'var(--red)', bg: 'var(--red-soft)' };
    };

    const fairness = getFairnessInfo();

    if (!currentUser) return null;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <span style={{ color: 'var(--ink-muted)', fontSize: 16 }}>Chargement...</span>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <div style={{ background: '#fff', borderRadius: 24, border: '1px solid var(--border)', padding: '60px 48px', textAlign: 'center', maxWidth: 440 }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🤝</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 12, color: 'var(--ink)' }}>
                        Proposition envoyée !
                    </h2>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
                        Ta proposition de troc a été envoyée à{' '}
                        <strong>@{targetItem?.owner__username || targetItem?.user_details?.username || 'l\'utilisateur'}</strong>.
                        Tu seras notifié dès qu'il répond.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Link to="/myspace" style={{
                            display: 'block', padding: '13px 24px', background: 'var(--ink)', color: '#fff',
                            borderRadius: 12, fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)',
                            textDecoration: 'none', textAlign: 'center',
                        }}>
                            Voir mes trocs →
                        </Link>
                        <Link to="/explorer" style={{
                            display: 'block', padding: '12px 24px', border: '1.5px solid var(--border)',
                            color: 'var(--ink-muted)', borderRadius: 12, fontWeight: 500, fontSize: 14,
                            textDecoration: 'none', textAlign: 'center',
                        }}>
                            Continuer à explorer
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '40px 20px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <Link to={`/item/${targetItemId}`} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>
                        ← Retour à l'article
                    </Link>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--ink)', marginTop: 16, letterSpacing: '-0.02em' }}>
                        Proposer un troc 🤝
                    </h1>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 15, marginTop: 6 }}>
                        Choisis l'un de tes articles à offrir en échange.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                    {/* Colonne gauche : article cible */}
                    <div>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                            Tu veux obtenir
                        </h2>
                        <ItemCard item={targetItem} selected={false} selectable={false} />
                    </div>

                    {/* Colonne droite : mes articles */}
                    <div>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                            Tu proposes en échange
                        </h2>

                        {myItems.length === 0 ? (
                            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 32, textAlign: 'center' }}>
                                <span style={{ fontSize: 40 }}>📦</span>
                                <p style={{ marginTop: 12, color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6 }}>
                                    Tu n'as aucun article à proposer.
                                </p>
                                <Link to="/publier" style={{
                                    display: 'inline-block', marginTop: 16, padding: '10px 20px',
                                    background: 'var(--accent)', color: '#fff', borderRadius: 10,
                                    fontWeight: 600, fontSize: 14, textDecoration: 'none',
                                }}>
                                    Publier un article
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {myItems.map(item => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        selected={selectedMyItem?.id === item.id}
                                        selectable
                                        onClick={() => setSelectedMyItem(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Barre fairness + submit */}
                <div style={{ marginTop: 32, background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>

                    {/* Indicateur fairness */}
                    {fairness && (
                        <div style={{
                            padding: '10px 16px', borderRadius: 10, marginBottom: 20,
                            background: fairness.bg, color: fairness.color,
                            fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span>{fairness.label}</span>
                            {selectedMyItem && targetItem && (
                                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>
                                    {(selectedMyItem.value || 0).toLocaleString('fr-CM')} FCFA ↔ {(targetItem.value || 0).toLocaleString('fr-CM')} FCFA
                                </span>
                            )}
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !selectedMyItem}
                            style={{
                                flex: 1, height: 52, background: (!selectedMyItem || submitting) ? 'var(--border)' : 'var(--ink)',
                                color: (!selectedMyItem || submitting) ? 'var(--ink-muted)' : '#fff',
                                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                                cursor: (!selectedMyItem || submitting) ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--font-display)', transition: 'background var(--transition)',
                            }}
                            onMouseEnter={e => { if (selectedMyItem && !submitting) e.currentTarget.style.background = 'var(--accent)'; }}
                            onMouseLeave={e => { if (selectedMyItem && !submitting) e.currentTarget.style.background = 'var(--ink)'; }}
                        >
                            {submitting ? 'Envoi en cours...' : '🤝 Envoyer la proposition'}
                        </button>
                        <Link to="/explorer" style={{
                            height: 52, padding: '0 24px', display: 'flex', alignItems: 'center',
                            border: '1.5px solid var(--border)', borderRadius: 12, color: 'var(--ink-muted)',
                            fontWeight: 500, fontSize: 14, textDecoration: 'none',
                        }}>
                            Annuler
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Carte d'article réutilisable
function ItemCard({ item, selected, selectable, onClick }) {
    const conditionLabel = { 'NEW': 'Neuf', 'LIKE_NEW': 'Très bon état', 'USED': 'Utilisé' }[item?.condition] || item?.condition;

    return (
        <div
            onClick={selectable ? onClick : undefined}
            style={{
                background: '#fff', borderRadius: 14,
                border: selected ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                overflow: 'hidden', cursor: selectable ? 'pointer' : 'default',
                transition: 'border-color var(--transition), box-shadow var(--transition)',
                boxShadow: selected ? '0 0 0 3px var(--accent-soft)' : 'none',
                display: 'flex', alignItems: 'center', gap: 0,
            }}
        >
            {/* Image */}
            <div style={{ width: 90, height: 90, flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {item?.image ? (
                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:32px">${item.emoji || '📦'}</span>`; }} />
                ) : (
                    <span style={{ fontSize: 32 }}>{item?.emoji || '📦'}</span>
                )}
            </div>

            {/* Infos */}
            <div style={{ padding: '12px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {item?.category}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                    {item?.title}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{conditionLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {item?.value ? `${Number(item.value).toLocaleString('fr-CM')} FCFA` : 'Prix à débattre'}
                    </span>
                </div>
            </div>

            {selectable && (
                <div style={{ paddingRight: 16 }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: selected ? 'none' : '2px solid var(--border)',
                        background: selected ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {selected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProposerTroc;

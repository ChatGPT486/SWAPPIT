import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMySpaceData, respondToSwap } from '../services/api';
import Navbar from '../components/Navbar';

const MySpace = () => {
  const navigate = useNavigate();
  const [myItems, setMyItems] = useState([]);
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [completedSwaps, setCompletedSwaps] = useState([]);
  const [activeTab, setActiveTab] = useState('articles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const data = await getMySpaceData();
        if (data && typeof data === 'object') {
          setMyItems(data.items || []);
          setPendingSwaps(data.transactions_pending || []);
          setCompletedSwaps(data.transactions_completed || []);
        }
      } catch (err) {
        console.error("Erreur Mon Espace :", err);
        if (err.response?.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
        } else {
          setError("Impossible de charger vos données.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();
  }, []);

  const handleRespondSwap = async (swapId, action) => {
    try {
      await respondToSwap(swapId, action);
      // Rafraîchir les données
      const data = await getMySpaceData();
      setPendingSwaps(data.transactions_pending || []);
      setCompletedSwaps(data.transactions_completed || []);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la réponse.");
    }
  };

  const renderCardMedia = (item) => {
    const src = item?.image || item?.photo;
    const isWeb = src && (src.startsWith('http://') || src.startsWith('https://'));
    if (!isWeb) return <span style={{ fontSize: 54 }}>{item?.emoji || '📦'}</span>;
    return (
      <img src={src} alt={item?.title || 'Article'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:54px">${item?.emoji || '📦'}</span>`; }}
      />
    );
  };

  const tabStyle = (tab) => ({
    padding: '12px 24px', background: 'none', border: 'none',
    borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
    color: activeTab === tab ? 'var(--accent)' : 'var(--ink-muted)',
    fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s ease',
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', fontSize: 16, fontWeight: 600 }}>
        Chargement de votre espace Swappit...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingBottom: 60 }}>
      {/* Navbar partagée avec logout */}
      <Navbar />

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}>
            Mon Espace Personnel 🚀
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>
            Gérez vos annonces et suivez vos propositions d'échanges.
          </p>
        </div>

        {error && (
          <div style={{ padding: 16, background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 12, marginBottom: 30, fontWeight: 500, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 16, borderBottom: '2px solid var(--border)', marginBottom: 32 }}>
          <button style={tabStyle('articles')} onClick={() => setActiveTab('articles')}>
            Mes Articles ({myItems.length})
          </button>
          <button style={tabStyle('pending')} onClick={() => setActiveTab('pending')}>
            Trocs en attente ({pendingSwaps.length})
          </button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
            Historique ({completedSwaps.length})
          </button>
        </div>

        {/* ── Onglet : Mes articles ── */}
        {activeTab === 'articles' && (
          <div>
            {myItems.length === 0 ? (
              <EmptyState icon="📦" title="Aucun objet publié" text="Mets un article en circulation pour commencer à troquer !">
                <Link to="/publier" style={accentBtn}>Créer une annonce</Link>
              </EmptyState>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {myItems.map((item, index) => (
                  <div key={item?.id || index}
                    onClick={() => item?.id && navigate(`/item/${item.id}`)}
                    style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ height: 180, background: '#f6f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderCardMedia(item)}
                    </div>
                    <div style={{ padding: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>{item?.category || 'Article'}</span>
                        <h3 style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginTop: 4, marginBottom: 8 }}>{item?.title || 'Sans titre'}</h3>
                        <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item?.description || 'Aucune description.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 16 }}>
                        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>● En ligne</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Gérer →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet : Trocs en attente ── */}
        {activeTab === 'pending' && (
          <div>
            {pendingSwaps.length === 0 ? (
              <EmptyState icon="🤝" title="Aucun troc en attente" text="Les propositions d'échanges reçues ou envoyées s'afficheront ici." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pendingSwaps.map((swap, index) => (
                  <SwapCard key={swap?.id || index} swap={swap} onRespond={handleRespondSwap} showActions />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet : Historique ── */}
        {activeTab === 'history' && (
          <div>
            {completedSwaps.length === 0 ? (
              <EmptyState icon="📋" title="Aucun historique" text="Les échanges finalisés (acceptés ou refusés) apparaîtront ici." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {completedSwaps.map((swap, index) => (
                  <SwapCard key={swap?.id || index} swap={swap} showActions={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sous-composants ──────────────────────────────────────────────────────────

function SwapCard({ swap, onRespond, showActions }) {
  const myItem    = swap?.my_item_details || swap?.my_item_detail;
  const theirItem = swap?.their_item_details || swap?.their_item_detail;

  const statusColors = {
    pending:  { bg: '#fff9db', color: '#f08c00', label: '⏳ En attente' },
    accepted: { bg: 'var(--green-soft)', color: 'var(--green)', label: '✅ Accepté' },
    rejected: { bg: 'var(--red-soft)',   color: 'var(--red)',   label: '❌ Refusé' },
  };
  const s = statusColors[swap?.status] || statusColors.pending;

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

        {/* Article proposé */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
          <MiniThumb item={myItem} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>Tu proposes</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{myItem?.title || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>@{swap?.sender_username || '?'}</div>
          </div>
        </div>

        <div style={{ fontSize: 24, color: 'var(--ink-muted)', flexShrink: 0 }}>⇌</div>

        {/* Article demandé */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
          <MiniThumb item={theirItem} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>Contre</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{theirItem?.title || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>@{swap?.receiver_username || '?'}</div>
          </div>
        </div>

        {/* Statut + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
            {s.label}
          </span>

          {showActions && swap?.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onRespond(swap.id, 'accepted')} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--green)', color: '#fff', fontSize: 12, fontWeight: 700,
              }}>
                ✓ Accepter
              </button>
              <button onClick={() => onRespond(swap.id, 'rejected')} style={{
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border)', cursor: 'pointer',
                background: '#fff', color: 'var(--red)', fontSize: 12, fontWeight: 700,
              }}>
                ✕ Refuser
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniThumb({ item }) {
  const src = item?.image;
  const isWeb = src && (src.startsWith('http://') || src.startsWith('https://'));
  return (
    <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1f3f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {isWeb
        ? <img src={src} alt={item?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:24px">${item?.emoji || '📦'}</span>`; }} />
        : <span style={{ fontSize: 24 }}>{item?.emoji || '📦'}</span>
      }
    </div>
  );
}

function EmptyState({ icon, title, text, children }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <h3 style={{ fontWeight: 700, fontSize: 18, marginTop: 16, color: 'var(--ink)' }}>{title}</h3>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginTop: 8, marginBottom: children ? 20 : 0 }}>{text}</p>
      {children}
    </div>
  );
}

const accentBtn = {
  display: 'inline-block',
  background: 'var(--accent)', color: '#fff',
  padding: '10px 20px', borderRadius: 40,
  fontSize: 14, fontWeight: 600, textDecoration: 'none',
};

export default MySpace;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItems } from '../services/api';
import Navbar from '../components/Navbar';

const Explorer = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = [
    { id: 'Tous',        label: 'Tous' },
    { id: 'Electronics', label: 'Électronique' },
    { id: 'Clothing',    label: 'Mode' },
    { id: 'Furniture',   label: 'Meubles' },
    { id: 'Books',       label: 'Livres' },
    { id: 'Music',       label: 'Musique' },
    { id: 'Sports',      label: 'Sports' },
    { id: 'Other',       label: 'Autre' },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getItems();
        const arr = Array.isArray(data) ? data : (data?.items || data?.results || []);
        setItems(arr);
        setFilteredItems(arr);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les articles.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const safe = Array.isArray(items) ? items : [];
    setFilteredItems(safe.filter(item => {
      if (!item) return false;
      const matchCat  = selectedCategory === 'Tous' || item.category === selectedCategory;
      const matchText = (item.title?.toLowerCase().includes(search.toLowerCase())) ||
                        (item.description?.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchText;
    }));
  }, [items, selectedCategory, search]);

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', fontSize: 18, fontWeight: 600 }}>
        Chargement de la vitrine Swappit...
      </div>
    );
  }

  const safeItems = Array.isArray(filteredItems) ? filteredItems : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingBottom: 60 }}>
      {/* Navbar partagée avec logout */}
      <Navbar />

      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '40px 24px' }}>

        {/* Titre + Recherche */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}>
              Explorez la vitrine des trocs 📦
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>
              Trouvez ce dont vous avez besoin et proposez un échange équitable.
            </p>
          </div>

          {/* Barre de recherche */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--ink-muted)', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un objet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 42px',
                borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)',
                background: '#fff', fontSize: 14, fontWeight: 500, outline: 'none', color: 'var(--ink)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Filtres catégorie */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, marginBottom: 30 }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{
              padding: '10px 20px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
              border: selectedCategory === cat.id ? 'none' : '1.5px solid var(--border)',
              background: selectedCategory === cat.id ? 'var(--ink)' : '#fff',
              color: selectedCategory === cat.id ? '#fff' : 'var(--ink)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s ease',
            }}>
              {cat.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: 16, background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 12, marginBottom: 30, fontWeight: 500, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Grille d'articles */}
        {safeItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 16, color: 'var(--ink)' }}>
              Aucun objet disponible
            </h3>
            <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginTop: 8 }}>Aucun article ne correspond à vos critères.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {safeItems.map((item, index) => (
              <div key={item?.id || index}
                onClick={() => item?.id && navigate(`/item/${item.id}`)}
                style={{
                  background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
                  overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: 180, background: 'linear-gradient(135deg, #f6f7f9 0%, #eef1f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {renderCardMedia(item)}
                </div>
                <div style={{ padding: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                        {categories.find(c => c.id === item?.category)?.label || item?.category || 'Autre'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', background: '#f1f3f5', padding: '2px 8px', borderRadius: 6 }}>
                        {item?.value ? `${Number(item.value).toLocaleString('fr-CM')} FCFA` : 'À débattre'}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
                      {item?.title || 'Sans titre'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
                      {item?.description || 'Aucune description.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      Par <strong>@{item?.owner__username || item?.user_details?.username || 'Anonyme'}</strong>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Voir l'objet →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;

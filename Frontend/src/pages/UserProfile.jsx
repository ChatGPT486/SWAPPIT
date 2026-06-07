/**
 * UserProfile.jsx — Public profile page for any user
 *
 * Route: /user/:id
 * Shows: avatar, name, star rating, bio, all their available items, and reviews.
 * Anyone logged in can view this page (like a YouTube channel page).
 * You can click "Propose Swap" on any of their items directly.
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import StarRating from '../components/StarRating'
import SwapModal from '../components/SwapModal'
import Toast from '../components/Toast'
import { api } from '../config/api'

export default function UserProfile() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { currentUser, getFairness, getUserReviews } = useApp()

  const [user,       setUser]       = useState(null)
  const [userItems,  setUserItems]  = useState([])
  const [reviews,    setReviews]    = useState([])
  const [swapTarget, setSwapTarget] = useState(null)
  const [toast,      setToast]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('items')

  const isOwnProfile = currentUser?.id === parseInt(id)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getUser(id),
      api.getItems({ exclude_own: false }),
      getUserReviews(id),
    ])
      .then(([userData, itemsData, reviewsData]) => {
        // Normalize user
        const u = {
          ...userData,
          firstName:   userData.first_name  || userData.firstName  || '',
          lastName:    userData.last_name   || userData.lastName   || '',
          reviewCount: userData.review_count || userData.reviewCount || 0,
          swapCount:   userData.swap_count   || userData.swapCount   || 0,
          trustLabel:  userData.trust_label  || userData.trustLabel  || 'New',
          photo:       userData.photo || userData.avatar || null,
        }
        setUser(u)

        // Filter to only this user's available items
        const allItems = Array.isArray(itemsData) ? itemsData : (itemsData?.results || [])
        const theirItems = allItems.filter(item => {
          const ownerId = item.owner?.id ?? item.owner_id
          return ownerId === parseInt(id) && item.available !== false
        })
        setUserItems(theirItems)
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      })
      .catch(() => navigate('/explorer'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)', fontSize: 15 }}>Loading profile…</div>
        </div>
      </div>
    </div>
  )

  if (!user) return null

  const firstName   = user.firstName || user.first_name || ''
  const lastName    = user.lastName  || user.last_name  || ''
  const initials    = `${firstName[0] || '?'}${lastName[0] || ''}`.toUpperCase()
  const trustColors = { 'Top Swapper': '#059669', 'Trusted': '#0891b2', 'Active': '#d97706', 'New': '#7c7b82' }
  const trustColor  = trustColors[user.trustLabel] || '#7c7b82'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />

      {/* ── Hero banner ── */}
      <div style={{ background: 'var(--ink)', padding: 'clamp(32px,5vw,56px) 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(rgba(245,244,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,244,240,1) 1px,transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'clamp(16px,4vw,32px)', flexWrap: 'wrap', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
            background: 'var(--lime)', color: 'var(--ink)',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', border: '4px solid rgba(200,242,48,0.3)',
            boxShadow: '0 0 0 4px rgba(200,242,48,0.1)',
          }}>
            {user.photo
              ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {firstName} {lastName}
              </h1>
              <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: trustColor + '20', color: trustColor, border: `1px solid ${trustColor}40`, fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {user.trustLabel}
              </span>
              {isOwnProfile && (
                <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(200,242,48,0.15)', color: 'var(--lime)', border: '1px solid rgba(200,242,48,0.3)', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  This is you
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <StarRating value={Number(user.stars) || 0} size={15} />
              <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.5)' }}>
                {Number(user.stars) > 0
                  ? `${Number(user.stars).toFixed(1)} · ${user.reviewCount} review${user.reviewCount !== 1 ? 's' : ''}`
                  : 'No reviews yet'}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.3)' }}>·</span>
              <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.5)' }}>
                🔁 {user.swapCount} swap{user.swapCount !== 1 ? 's' : ''} completed
              </span>
              <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.3)' }}>·</span>
              <span style={{ fontSize: 13, color: 'rgba(245,244,240,0.5)' }}>
                📦 {userItems.length} item{userItems.length !== 1 ? 's' : ''} available
              </span>
            </div>
            {user.bio && (
              <p style={{ fontSize: 14, color: 'rgba(245,244,240,0.5)', lineHeight: 1.7, maxWidth: 500 }}>{user.bio}</p>
            )}
          </div>

          {/* Action buttons */}
          {isOwnProfile ? (
            <Link to="/my-space" style={{ padding: '11px 22px', borderRadius: 'var(--radius-pill)', background: 'var(--lime)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              Edit Profile →
            </Link>
          ) : (
            <Link to="/explorer" style={{ padding: '11px 22px', borderRadius: 'var(--radius-pill)', border: '1.5px solid rgba(245,244,240,0.2)', color: 'rgba(245,244,240,0.6)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, flexShrink: 0, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,244,240,0.2)'; e.currentTarget.style.color = 'rgba(245,244,240,0.6)' }}
            >← Back to Explorer</Link>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 5%', display: 'flex', gap: 4 }}>
          {[
            { id: 'items',   label: `Items (${userItems.length})`,  icon: '📦' },
            { id: 'reviews', label: `Reviews (${reviews.length})`,  icon: '⭐' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '14px 20px', borderRadius: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              background: 'transparent', color: activeTab === t.id ? 'var(--ink)' : 'var(--muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--ink)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', border: 'none',
              transition: 'all 0.2s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '32px 5%' }}>

        {/* Items tab */}
        {activeTab === 'items' && (
          <>
            {userItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
                  {isOwnProfile ? 'You have no items yet' : `${firstName} has no items yet`}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
                  {isOwnProfile ? 'Add your first item to start swapping!' : 'Check back later — they may add items soon.'}
                </p>
                {isOwnProfile && (
                  <Link to="/my-space?tab=products" style={{ padding: '12px 28px', borderRadius: 'var(--radius-pill)', background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>
                    + Add First Item
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {userItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    showActions={!isOwnProfile}
                    onSwap={setSwapTarget}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>⭐</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>No reviews yet</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                  {isOwnProfile ? 'Complete a swap to earn your first review!' : `${firstName} hasn't received any reviews yet.`}
                </p>
              </div>
            ) : (
              <>
                {/* Average summary */}
                <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{Number(user.stars).toFixed(1)}</div>
                    <StarRating value={Number(user.stars)} size={18} />
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    {[5,4,3,2,1].map(s => {
                      const count = reviews.filter(r => r.stars === s).length
                      const pct   = reviews.length ? (count / reviews.length) * 100 : 0
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)', width: 14, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{s}</span>
                          <span style={{ fontSize: 11, color: '#f59e0b' }}>★</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#f59e0b', width: `${pct}%`, transition: 'width 0.5s var(--ease)' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--muted)', width: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Review cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {reviews.map(r => {
                    const author  = r.author && typeof r.author === 'object' ? r.author : {}
                    const aFirst  = author?.first_name || author?.firstName || ''
                    const aLast   = author?.last_name  || author?.lastName  || ''
                    const aPhoto  = author?.photo || author?.avatar || null
                    const aInit   = `${aFirst[0] || '?'}${aLast[0] || ''}`.toUpperCase()
                    return (
                      <div key={r.id} style={{ background: '#fff', borderRadius: 'var(--radius-sm)', padding: '16px 18px', border: '1px solid var(--border)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink)', color: 'var(--lime)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {aPhoto ? <img src={aPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : aInit}
                            </div>
                            <div>
                              <Link to={`/user/${author.id}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}
                              >{aFirst} {aLast}</Link>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                            </div>
                          </div>
                          <StarRating value={r.stars} size={14} />
                        </div>
                        {r.comment && (
                          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10, margin: 0 }}>
                            "{r.comment}"
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {swapTarget && (
        <SwapModal
          targetItem={swapTarget}
          onClose={() => setSwapTarget(null)}
          onSuccess={() => setToast({ message: 'Swap proposal sent!', type: 'success' })}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

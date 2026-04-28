import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import listsService from '../services/listsService'

const typeIcon  = { list: '🛒', meal: '🍽️', system: '🔔' }
const typeColor = { list: '#E8580C', meal: '#7F77DD', system: '#378ADD' }
const typeLabel = { list: 'Liste', meal: 'Repas', system: 'Système' }

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)  return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`
  return `Il y a ${Math.floor(diff/86400)}j`
}

export default function NotificationsPage() {
  const { group } = useAuth()
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!group?.id) return
    setLoading(true)
    try {
      const data = await listsService.getNotifications(group.id)
      setNotifs(data)
    } catch { } finally { setLoading(false) }
  }, [group?.id])

  useEffect(() => {
    refresh()
    // Poll every 10 seconds so group members see each other's actions
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  const markRead = async (id) => {
    try { await listsService.markRead(id); await refresh() } catch {}
  }

  const markAllRead = async () => {
    try { await listsService.markAllRead(group.id); await refresh() } catch {}
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div style={s.shell}>
      <Sidebar />
      <div style={s.bgWrap}>
        <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=90" alt="bg" style={s.bgImg} />
        <div style={s.bgOverlay} />
      </div>
      <div style={s.main}>
        <div style={s.topbar}>
          <span style={s.topbarTitle}>
            Notifications {group && <span style={{ color: '#E8580C', fontWeight: '400' }}>· {group.name}</span>}
          </span>
          {unread > 0 && (
            <button style={s.markBtn} onClick={markAllRead}>
              Tout marquer comme lu ({unread})
            </button>
          )}
        </div>
        <div style={s.content}>
          <div style={s.statsRow}>
            {[
              { label: 'Total',    value: notifs.length,                                    color: '#1a1a18' },
              { label: 'Non lues', value: unread,                                            color: '#E8580C' },
              { label: 'Listes',   value: notifs.filter(n => n.type === 'list').length,     color: '#1D9E75' },
              { label: 'Repas',    value: notifs.filter(n => n.type === 'meal').length,     color: '#7F77DD' },
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {!group && (
            <div style={s.infoBox}>
              <span>👥</span>
              <span>Rejoignez un groupe pour voir les notifications partagées</span>
            </div>
          )}

          {loading && notifs.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '40px' }}>Chargement...</div>
          )}

          {notifs.length === 0 && !loading && group && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🔔</div>
              <div style={s.emptyTitle}>Aucune notification</div>
              <div style={s.emptySub}>
                Les modifications de listes et planifications de repas dans {group.name} apparaîtront ici.
              </div>
            </div>
          )}

          {notifs.length > 0 && (
            <div style={s.list}>
              {notifs.map(n => (
                <div key={n.id}
                  style={{ ...s.notifCard, background: n.is_read ? '#fafaf8' : '#ffffff',
                    borderLeft: `3px solid ${n.is_read ? 'transparent' : typeColor[n.type] || typeColor.system}` }}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <div style={{ ...s.notifIconWrap,
                    background: (typeColor[n.type] || typeColor.system) + '15' }}>
                    <span style={{ fontSize: '20px' }}>{typeIcon[n.type] || typeIcon.system}</span>
                  </div>
                  <div style={s.notifBody}>
                    <div style={s.notifTop}>
                      <span style={{ ...s.typeBadge,
                        background: (typeColor[n.type] || typeColor.system) + '18',
                        color: typeColor[n.type] || typeColor.system }}>
                        {typeLabel[n.type] || 'Info'}
                      </span>
                      <span style={s.notifTime}>{timeAgo(n.created_at)}</span>
                    </div>
                    <div style={{ ...s.notifMsg, fontWeight: n.is_read ? '400' : '600' }}>
                      {n.message}
                    </div>
                  </div>
                  {!n.is_read && <div style={{ ...s.unreadDot, background: typeColor[n.type] || typeColor.system }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  shell:        { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' },
  bgWrap:       { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  bgImg:        { width: '100%', height: '100%', objectFit: 'cover' },
  bgOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.72) 0%, rgba(20,15,10,0.62) 100%)' },
  main:         { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 },
  topbar:       { height: '52px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(255,255,255,0.12)' },
  topbarTitle:  { fontSize: '15px', fontWeight: '600', color: '#ffffff' },
  markBtn:      { padding: '6px 14px', background: 'rgba(232,88,12,0.2)', color: '#E8580C', border: '0.5px solid rgba(232,88,12,0.4)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' },
  content:      { flex: 1, overflowY: 'auto', padding: '24px 28px' },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' },
  statCard:     { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  statVal:      { fontSize: '28px', fontWeight: '800', marginBottom: '4px' },
  statLabel:    { fontSize: '12px', color: 'rgba(255,255,255,0.6)' },
  infoBox:      { display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(232,88,12,0.15)', border: '0.5px solid rgba(232,88,12,0.35)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#E8580C' },
  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px' },
  emptyIcon:    { fontSize: '56px', marginBottom: '16px' },
  emptyTitle:   { fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' },
  emptySub:     { fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '420px', lineHeight: '1.6' },
  list:         { display: 'flex', flexDirection: 'column', gap: '10px' },
  notifCard:    { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '14px', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', cursor: 'pointer' },
  notifIconWrap:{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody:    { flex: 1 },
  notifTop:     { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  typeBadge:    { fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' },
  notifTime:    { fontSize: '11px', color: '#aaa89e' },
  notifMsg:     { fontSize: '13px', color: '#1a1a18', lineHeight: '1.5' },
  unreadDot:    { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
}

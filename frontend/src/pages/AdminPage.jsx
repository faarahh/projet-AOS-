import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

export default function AdminPage() {
  const navigate      = useNavigate()
  const { logout }    = useAuth()
  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast]               = useState(null)
  const [filter, setFilter]             = useState('all')
  const [activeSection, setActiveSection] = useState('users')

  const usersRef    = useRef(null)
  const servicesRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── Load users from auth-service ──────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await authService.adminListUsers()
      setUsers(data)
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── Deactivate user (soft delete) ─────────────────────────────────────────
  const deleteUser = async (id) => {
    try {
      await authService.adminDeleteUser(id)
      await refresh()
      setConfirmDelete(null)
      showToast('Utilisateur désactivé')
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur')
    }
  }

  // ── Toggle role ───────────────────────────────────────────────────────────
  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      await authService.adminUpdateUser(user.id, { role: newRole })
      await refresh()
      showToast(`Rôle modifié → ${newRole}`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur')
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const scrollTo = (ref, section) => {
    setActiveSection(section)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter)
  const admins        = users.filter(u => u.role === 'admin')
  const regularUsers  = users.filter(u => u.role === 'user')

  const NAV_ITEMS = [
    { key: 'users', label: 'Utilisateurs', ref: usersRef,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
    { key: 'services', label: 'Services', ref: servicesRef,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    },
  ]

  const SERVICES = [
    { name: 'Auth Service',  port: 5001, url: 'http://localhost:5001/health' },
    { name: 'Lists Service', port: 5002, url: 'http://localhost:5002/health' },
    { name: 'Meals Service', port: 5003, url: 'http://localhost:5003/health' },
    { name: 'Users Service', port: 5004, url: 'http://localhost:5004/health' },
  ]

  return (
    <div style={s.page}>
      {/* Sidebar nav */}
      <div style={s.nav}>
        <div style={s.navHeader}>
          <div style={s.navLogo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={s.navLogoText}>Admin</span>
        </div>
        <div style={s.navLinks}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} style={{ ...s.navLink, ...(activeSection === item.key ? s.navLinkActive : {}) }} onClick={() => scrollTo(item.ref, item.key)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <button style={s.logoutBtn} onClick={handleLogout}>Déconnexion</button>
      </div>

      {/* Main content */}
      <div style={s.main}>
        <div style={s.header}>
          <div>
            <div style={s.headerTitle}>Tableau de bord admin</div>
            <div style={s.headerSub}>Gestion des utilisateurs et des services</div>
          </div>
          <div style={s.statsRow}>
            {[
              { label: 'Total', value: users.length, color: '#E8580C' },
              { label: 'Admins', value: admins.length, color: '#7F77DD' },
              { label: 'Utilisateurs', value: regularUsers.length, color: '#1D9E75' },
            ].map(s2 => (
              <div key={s2.label} style={s.statCard}>
                <div style={{ ...s.statVal, color: s2.color }}>{s2.value}</div>
                <div style={s.statLabel}>{s2.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Users section */}
        <div ref={usersRef} style={s.section}>
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Utilisateurs</div>
            <div style={s.filterRow}>
              {['all', 'admin', 'user'].map(f => (
                <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Tous' : f === 'admin' ? 'Admins' : 'Utilisateurs'}
                </button>
              ))}
            </div>
          </div>

          {loading && <div style={s.loadingText}>Chargement...</div>}

          <div style={s.table}>
            <div style={s.tableHead}>
              <div style={{ ...s.th, flex: 2 }}>Nom</div>
              <div style={{ ...s.th, flex: 3 }}>Email</div>
              <div style={s.th}>Rôle</div>
              <div style={s.th}>Statut</div>
              <div style={s.th}>Actions</div>
            </div>
            {filteredUsers.map(u => (
              <div key={u.id} style={{ ...s.tableRow, opacity: u.is_active === false ? 0.5 : 1 }}>
                <div style={{ ...s.td, flex: 2 }}>
                  <div style={s.avatar}>{(u.name || u.email)[0].toUpperCase()}</div>
                  <span style={s.userName}>{u.name || '—'}</span>
                </div>
                <div style={{ ...s.td, flex: 3 }}>
                  <span style={s.email}>{u.email}</span>
                </div>
                <div style={s.td}>
                  <span style={{ ...s.roleBadge, ...(u.role === 'admin' ? s.badgeAdmin : s.badgeUser) }}>
                    {u.role}
                  </span>
                </div>
                <div style={s.td}>
                  <span style={{ fontSize: '11px', color: u.is_active === false ? '#A32D2D' : '#1D9E75' }}>
                    {u.is_active === false ? 'Inactif' : 'Actif'}
                  </span>
                </div>
                <div style={{ ...s.td, gap: '6px' }}>
                  <button style={s.actionBtn} onClick={() => toggleRole(u)} title="Changer le rôle">
                    ⇄
                  </button>
                  <button style={{ ...s.actionBtn, ...s.actionBtnDelete }} onClick={() => setConfirmDelete(u.id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services health section */}
        <div ref={servicesRef} style={s.section}>
          <div style={s.sectionTitle}>Services</div>
          <div style={s.servicesGrid}>
            {SERVICES.map(svc => (
              <div key={svc.name} style={s.serviceCard}>
                <div style={s.serviceCardTop}>
                  <div style={s.serviceName}>{svc.name}</div>
                  <span style={s.servicePort}>:{svc.port}</span>
                </div>
                <a href={svc.url} target="_blank" rel="noreferrer" style={s.serviceLink}>
                  Vérifier /health →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Désactiver cet utilisateur ?</div>
            <div style={s.modalSub}>L'utilisateur sera désactivé et ne pourra plus se connecter.</div>
            <div style={s.modalActions}>
              <button style={s.btnCancel} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button style={s.btnConfirm} onClick={() => deleteUser(confirmDelete)}>Désactiver</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

const s = {
  page: { display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f7f7f5' },
  nav: { width: '220px', minWidth: '220px', background: '#1a1a18', display: 'flex', flexDirection: 'column', padding: '24px 0' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px 24px' },
  navLogo: { width: '30px', height: '30px', background: '#E8580C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navLogoText: { color: '#fff', fontWeight: '700', fontSize: '15px' },
  navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' },
  navLink: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.55)', fontSize: '13px', cursor: 'pointer', textAlign: 'left' },
  navLinkActive: { background: 'rgba(255,255,255,0.1)', color: '#ffffff' },
  logoutBtn: { margin: '12px', padding: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' },
  main: { flex: 1, overflowY: 'auto', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' },
  headerSub: { fontSize: '13px', color: '#888780' },
  statsRow: { display: 'flex', gap: '12px' },
  statCard: { background: '#fff', border: '0.5px solid #e0ddd5', borderRadius: '12px', padding: '14px 20px', textAlign: 'center', minWidth: '80px' },
  statVal: { fontSize: '24px', fontWeight: '800', marginBottom: '2px' },
  statLabel: { fontSize: '11px', color: '#888780' },
  section: { background: '#fff', border: '0.5px solid #e0ddd5', borderRadius: '16px', padding: '24px', marginBottom: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '16px' },
  filterRow: { display: 'flex', gap: '6px' },
  filterBtn: { padding: '5px 14px', background: '#f5f5f0', border: '0.5px solid #e0ddd5', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', color: '#888780' },
  filterBtnActive: { background: '#1a1a18', color: '#fff', border: '0.5px solid #1a1a18' },
  loadingText: { color: '#888780', fontSize: '13px', textAlign: 'center', padding: '20px' },
  table: { display: 'flex', flexDirection: 'column', gap: '2px' },
  tableHead: { display: 'flex', padding: '8px 12px', gap: '12px' },
  th: { flex: 1, fontSize: '11px', fontWeight: '600', color: '#aaa89e', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '12px', gap: '12px', background: '#fafaf8', borderRadius: '10px' },
  td: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#f0ede6', border: '0.5px solid #e0ddd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#3d3d3a', flexShrink: 0 },
  userName: { fontSize: '13px', fontWeight: '500', color: '#1a1a18' },
  email: { fontSize: '12px', color: '#888780', fontFamily: 'monospace' },
  roleBadge: { fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' },
  badgeAdmin: { background: '#EEEDFE', color: '#3C3489' },
  badgeUser: { background: '#E1F5EE', color: '#085041' },
  actionBtn: { padding: '4px 10px', background: '#f5f5f0', border: '0.5px solid #e0ddd5', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#888780' },
  actionBtnDelete: { color: '#A32D2D', background: '#FCEBEB', border: '0.5px solid #F09595' },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  serviceCard: { background: '#fafaf8', border: '0.5px solid #e0ddd5', borderRadius: '12px', padding: '16px' },
  serviceCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  serviceName: { fontSize: '13px', fontWeight: '600', color: '#1a1a18' },
  servicePort: { fontSize: '11px', color: '#aaa89e', fontFamily: 'monospace' },
  serviceLink: { fontSize: '12px', color: '#E8580C', textDecoration: 'none' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '16px', padding: '28px', width: '380px' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' },
  modalSub: { fontSize: '13px', color: '#888780', marginBottom: '24px' },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  btnCancel: { padding: '10px 20px', background: '#f5f5f0', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#888780' },
  btnConfirm: { padding: '10px 20px', background: '#A32D2D', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', background: '#1D9E75', color: '#fff', fontSize: '13px', fontWeight: '500', padding: '12px 20px', borderRadius: '10px', zIndex: 300 },
}

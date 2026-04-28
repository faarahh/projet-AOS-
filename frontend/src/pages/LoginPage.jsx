/**
 * src/pages/LoginPage.jsx
 * -----------------------
 * Identical UI to the original. The only change is that login() now
 * calls the auth-service via AuthContext instead of the fake store.
 * Demo accounts still shown for convenience during grading.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { label: 'Utilisateur', email: 'test@wams.com',  password: 'Test1234!',  color: '#E8580C', bg: '#FFF0E8' },
  { label: 'Admin',       email: 'admin@wams.com', password: 'Admin@1234', color: '#0F6E56', bg: '#E6F7F1' },
]

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await login(email, password)
      // Admin → admin panel, everyone else → dashboard
      navigate(userData.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      // axios wraps the backend message inside err.response.data.error
      setError(err.response?.data?.error || err.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.left}>
        <img
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80"
          alt="food" style={s.bgImg}
        />
        <div style={s.overlay} />
        <div style={s.leftContent}>
          <div style={s.logoWrap} onClick={() => navigate('/landing')}>
            <div style={s.logoDot}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={s.logoText}>FoodSync</span>
          </div>
          <div style={s.heroContent}>
            <h1 style={s.heroTitle}>Planifiez vos repas en famille.</h1>
            <p style={s.heroSub}>Listes partagées · Planning 7 jours · Ingrédients auto-générés</p>
            <div style={s.features}>
              {[
                'Listes de courses partagées en temps réel',
                'Planification des repas sur 7 jours',
                'Ingrédients ajoutés automatiquement',
                'Collaboration en groupe privé',
              ].map(f => (
                <div key={f} style={s.feature}>
                  <span style={s.featureDot}>✓</span>
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <button style={s.backBtn} onClick={() => navigate('/landing')}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTop}>
            <div style={s.cardLogoDot}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={s.cardLogoText}>FoodSync</span>
          </div>

          <h2 style={s.cardTitle}>Bon retour !</h2>
          <p style={s.cardSub}>Connectez-vous pour accéder à votre espace</p>

          {error && <div style={s.error}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Adresse email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com" required style={s.input}
                onFocus={e => e.target.style.borderColor = '#E8580C'}
                onBlur={e  => e.target.style.borderColor = '#e0ddd5'}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Mot de passe</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required style={s.input}
                onFocus={e => e.target.style.borderColor = '#E8580C'}
                onBlur={e  => e.target.style.borderColor = '#e0ddd5'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter →'}
            </button>
          </form>

          <div style={s.signupRow}>
            <span style={s.signupText}>Pas encore de compte ?</span>
            <Link to="/signup" style={s.signupLink}>Créer un compte</Link>
          </div>

          <div style={s.divider}>
            <span style={s.dividerText}>Comptes de démonstration</span>
          </div>

          {DEMO_ACCOUNTS.map(acc => (
            <div key={acc.email} style={s.demoCard}>
              <span style={{ ...s.roleBadge, color: acc.color, background: acc.bg }}>
                {acc.label}
              </span>
              <div style={s.demoInfo}>
                <span style={s.demoEmail}>{acc.email}</span>
                <span style={s.demoDot}>·</span>
                <span style={s.demoPass}>{acc.password}</span>
              </div>
              <button
                style={{ ...s.fillBtn, borderColor: acc.color, color: acc.color }}
                onClick={() => { setEmail(acc.email); setPassword(acc.password) }}
              >
                Remplir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  left: { width: '45%', position: 'relative', overflow: 'hidden' },
  bgImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.3), rgba(10,10,10,0.8))' },
  leftContent: { position: 'relative', zIndex: 1, padding: '40px 48px', height: '100%', display: 'flex', flexDirection: 'column' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 'auto' },
  logoDot: { width: '34px', height: '34px', borderRadius: '10px', background: '#E8580C', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#ffffff' },
  heroContent: { marginBottom: '32px' },
  heroTitle: { fontSize: '34px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', marginBottom: '12px' },
  heroSub: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' },
  features: { display: 'flex', flexDirection: 'column', gap: '10px' },
  feature: { display: 'flex', alignItems: 'center', gap: '10px' },
  featureDot: { width: '20px', height: '20px', borderRadius: '50%', background: '#E8580C', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '700' },
  featureText: { fontSize: '13px', color: 'rgba(255,255,255,0.85)' },
  backBtn: { alignSelf: 'flex-start', padding: '10px 20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', cursor: 'pointer' },
  right: { flex: 1, background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { background: '#ffffff', borderRadius: '24px', border: '0.5px solid #e0ddd5', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  cardLogoDot: { width: '32px', height: '32px', borderRadius: '8px', background: '#E8580C', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardLogoText: { fontSize: '16px', fontWeight: '700', color: '#1a1a18' },
  cardTitle: { fontSize: '26px', fontWeight: '800', color: '#1a1a18', marginBottom: '6px' },
  cardSub: { fontSize: '14px', color: '#888780', marginBottom: '28px' },
  error: { background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#A32D2D', marginBottom: '20px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#3d3d3a', marginBottom: '7px' },
  input: { width: '100%', padding: '12px 16px', fontSize: '14px', border: '1.5px solid #e0ddd5', borderRadius: '10px', outline: 'none', background: '#fafaf8', color: '#1a1a18', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  btn: { width: '100%', padding: '14px', background: '#E8580C', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },
  signupRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '20px 0 0' },
  signupText: { fontSize: '13px', color: '#888780' },
  signupLink: { fontSize: '13px', fontWeight: '700', color: '#E8580C', textDecoration: 'none' },
  divider: { textAlign: 'center', margin: '20px 0 16px', position: 'relative', borderTop: '0.5px solid #e0ddd5' },
  dividerText: { position: 'relative', top: '-10px', background: '#ffffff', padding: '0 12px', fontSize: '11px', color: '#aaa89e', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' },
  demoCard: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f7f7f5', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px' },
  roleBadge: { fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 },
  demoInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: '6px' },
  demoEmail: { fontSize: '12px', color: '#3d3d3a', fontFamily: 'monospace' },
  demoDot: { color: '#d3d1c7' },
  demoPass: { fontSize: '12px', color: '#3d3d3a', fontFamily: 'monospace' },
  fillBtn: { fontSize: '11px', background: 'none', border: '0.5px solid', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' },
}

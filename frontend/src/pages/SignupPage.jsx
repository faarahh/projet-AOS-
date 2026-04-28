/**
 * src/pages/SignupPage.jsx
 * Identical UI. Only change: calls real auth-service via AuthContext.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    // Match the auth-service password rule: min 6 chars, 1 letter + 1 digit
    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password)) {
      setError('Le mot de passe doit contenir au moins 6 caractères, une lettre et un chiffre')
      return
    }

    setLoading(true)
    try {
      await signup(name, email, password)
      navigate('/')   // go straight to dashboard after registration
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.left}>
        <img src="https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=800&q=80" alt="food" style={s.bgImg} />
        <div style={s.overlay} />
        <div style={s.leftContent}>
          <div style={s.logoWrap} onClick={() => navigate('/landing')}>
            <div style={s.logoDot}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={s.logoText}>FoodSync</span>
          </div>
          <div style={s.heroContent}>
            <h1 style={s.heroTitle}>Rejoignez FoodSync</h1>
            <p style={s.heroSub}>Planifiez, partagez, savourez — ensemble.</p>
            <div style={s.features}>
              {['Listes de courses partagées', 'Planification 7 jours', 'Ingrédients auto-générés', 'Collaboration en groupe'].map(f => (
                <div key={f} style={s.feature}>
                  <span style={s.featureDot}>✓</span>
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTop}>
            <div style={s.cardLogoDot}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={s.cardLogoText}>FoodSync</span>
          </div>

          <h2 style={s.title}>Créer un compte</h2>
          <p style={s.sub}>Commencez à planifier vos repas gratuitement</p>

          {error && <div style={s.error}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Nom complet</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ahmed Benali" required style={s.input}
                onFocus={e => e.target.style.borderColor = '#E8580C'} onBlur={e => e.target.style.borderColor = '#e0ddd5'} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Adresse email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required style={s.input}
                onFocus={e => e.target.style.borderColor = '#E8580C'} onBlur={e => e.target.style.borderColor = '#e0ddd5'} />
            </div>
            <div style={s.twoCol}>
              <div style={s.field}>
                <label style={s.label}>Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 cars, 1 chiffre" required style={s.input}
                  onFocus={e => e.target.style.borderColor = '#E8580C'} onBlur={e => e.target.style.borderColor = '#e0ddd5'} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirmer</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répéter" required style={s.input}
                  onFocus={e => e.target.style.borderColor = '#E8580C'} onBlur={e => e.target.style.borderColor = '#e0ddd5'} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Création...' : 'Créer mon compte →'}
            </button>
          </form>

          <p style={s.loginLink}>
            Déjà un compte ? <Link to="/login" style={s.link}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  left: { width: '45%', position: 'relative', overflow: 'hidden' },
  bgImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.4), rgba(10,10,10,0.75))' },
  leftContent: { position: 'relative', zIndex: 1, padding: '40px 48px', height: '100%', display: 'flex', flexDirection: 'column' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 'auto' },
  logoDot: { width: '34px', height: '34px', borderRadius: '10px', background: '#E8580C', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#ffffff' },
  heroContent: { marginBottom: '60px' },
  heroTitle: { fontSize: '38px', fontWeight: '800', color: '#ffffff', lineHeight: '1.15', marginBottom: '14px' },
  heroSub: { fontSize: '16px', color: 'rgba(255,255,255,0.75)', marginBottom: '32px' },
  features: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feature: { display: 'flex', alignItems: 'center', gap: '10px' },
  featureDot: { width: '20px', height: '20px', borderRadius: '50%', background: '#E8580C', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '700' },
  featureText: { fontSize: '14px', color: 'rgba(255,255,255,0.85)' },
  right: { flex: 1, background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { background: '#ffffff', borderRadius: '24px', border: '0.5px solid #e0ddd5', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  cardLogoDot: { width: '30px', height: '30px', borderRadius: '8px', background: '#E8580C', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardLogoText: { fontSize: '15px', fontWeight: '700', color: '#1a1a18' },
  title: { fontSize: '26px', fontWeight: '800', color: '#1a1a18', marginBottom: '6px' },
  sub: { fontSize: '14px', color: '#888780', marginBottom: '28px' },
  error: { background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#A32D2D', marginBottom: '20px' },
  field: { marginBottom: '14px', flex: 1 },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#3d3d3a', marginBottom: '6px' },
  input: { width: '100%', padding: '12px 14px', fontSize: '14px', border: '1.5px solid #e0ddd5', borderRadius: '10px', outline: 'none', background: '#fafaf8', color: '#1a1a18', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  twoCol: { display: 'flex', gap: '12px' },
  btn: { width: '100%', padding: '14px', background: '#E8580C', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '6px' },
  loginLink: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#888780' },
  link: { color: '#E8580C', fontWeight: '600', textDecoration: 'none' },
}

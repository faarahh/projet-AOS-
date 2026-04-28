import { useNavigate } from 'react-router-dom'

const MEALS = [
  { title: 'Tajine Poulet', time: '35 min', diff: 'Facile', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', tag: 'Maghrébin' },
  { title: 'Pasta Bolognaise', time: '25 min', diff: 'Facile', img: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80', tag: 'Italien' },
  { title: 'Poulet Rôti', time: '50 min', diff: 'Moyen',img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', tag: 'Classique' },
  { title: 'Couscous Famille', time: '60 min', diff: 'Moyen', img: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&q=80', tag: 'Maghrébin' },
  { title: 'Salade César', time: '15 min', diff: 'Facile', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', tag: 'Léger' },
  { title: 'Pizza Maison', time: '45 min', diff: 'Moyen', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', tag: 'Italien' },
]

const STEPS = [
  { num: '01', title: 'Choisissez vos repas', desc: 'Parcourez nos recettes et planifiez votre semaine en quelques clics.' },
  { num: '02', title: 'Liste auto-générée', desc: 'Vos listes de courses sont créées automatiquement selon vos repas.' },
  { num: '03', title: 'Collaborez', desc: 'Partagez avec votre famille ou colocataires en temps réel.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <div style={s.navLogoDot}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={s.navLogoText}>FoodSync</span>
        </div>
        <div style={s.navLinks}>
  <span 
    style={s.navLink} 
    onClick={() => document.getElementById('recettes').scrollIntoView({ behavior: 'smooth' })}
  >
    Recettes
  </span>

  <span 
    style={s.navLink} 
    onClick={() => document.getElementById('steps').scrollIntoView({ behavior: 'smooth' })}
  >
    Comment ça marche
  </span>
          <button style={s.navBtnOutline} onClick={() => navigate('/login')}>Se connecter</button>
          <button style={s.navBtnFill} onClick={() => navigate('/login')}>Commencer →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroLeft}>
          <div style={s.heroBadge}>🍽️ Planification intelligente</div>
          <h1 style={s.heroTitle}>
            Planifiez vos repas.<br/>
            <span style={s.heroOrange}>Simplifiez</span> vos courses.
          </h1>
          <p style={s.heroSub}>
            FoodSync vous aide à organiser vos repas de la semaine, générer vos listes de courses automatiquement et collaborer avec toute votre famille.
          </p>
          <div style={s.heroBtns}>
            <button style={s.heroBtnMain} onClick={() => navigate('/login')}>
              Commencer gratuitement →
            </button>
            <button style={s.heroBtnSec} onClick={() => navigate('/demo')}>
              Voir une démo
            </button>
          </div>
          <div style={s.heroStats}>
            {[
              { val: '500+', label: 'Recettes disponibles' },
              { val: '4', label: 'Collaborateurs max' },
              { val: '100%', label: 'Gratuit' },
            ].map(s2 => (
              <div key={s2.label} style={s.heroStat}>
                <div style={s.heroStatVal}>{s2.val}</div>
                <div style={s.heroStatLabel}>{s2.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={s.heroRight}>
          <div style={s.heroImgGrid}>
            <img src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80" style={s.heroImgMain} alt="repas" />
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80" style={s.heroImgSmall1} alt="salade" />
            <img src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300&q=80" style={s.heroImgSmall2} alt="pasta" />
          </div>
        </div>
      </section>

      {/* RECETTES — accessible sans login mais limité */}
      <section id="recettes" style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Recettes de la semaine</h2>
          <p style={s.sectionSub}>Découvrez nos suggestions — connectez-vous pour planifier</p>
        </div>
        <div style={s.mealsGrid}>
          {MEALS.map((meal, i) => (
            <div key={i} style={s.mealCard} onClick={() => navigate('/login')}>
              <div style={s.mealImgWrap}>
                <img src={meal.img} alt={meal.title} style={s.mealImg} />
                <span style={s.mealTag}>{meal.tag}</span>
              </div>
              <div style={s.mealInfo}>
                <h3 style={s.mealTitle}>{meal.title}</h3>
                <div style={s.mealMeta}>
                  <span style={s.mealTime}>⏱ {meal.time}</span>
                  <span style={s.mealDiff}>{meal.diff}</span>
                </div>
                <button style={s.mealBtn}>
                  🔒 Planifier ce repas
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="steps" style={{ ...s.section, background: '#FFF8F3' }}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Comment ça marche ?</h2>
          <p style={s.sectionSub}>Simple, rapide et collaboratif</p>
        </div>
        <div style={s.stepsGrid}>
          {STEPS.map(step => (
            <div key={step.num} style={s.stepCard}>
              <div style={s.stepNum}>{step.num}</div>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s.cta}>
        <h2 style={s.ctaTitle}>Prêt à simplifier vos repas ?</h2>
        <p style={s.ctaSub}>Rejoignez FoodSync et planifiez vos repas de la semaine en quelques minutes.</p>
        <button style={s.ctaBtn} onClick={() => navigate('/login')}>
          Commencer maintenant →
        </button>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <div style={s.navLogoDot}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18' }}>FoodSync</span>
        </div>
        <p style={s.footerText}>Architecture microservices · JWT · RabbitMQ · Consul · Traefik · Docker</p>
        <p style={s.footerText}>Projet WAMS 2025 — Groupe 4</p>
      </footer>

    </div>
  )
}

const s = {
  page: { fontFamily: 'system-ui, sans-serif', background: '#ffffff', minHeight: '100vh' },

  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 60px', borderBottom: '0.5px solid #f0ede6', position: 'sticky', top: 0, background: '#ffffff', zIndex: 100 },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLogoDot: { width: '32px', height: '32px', borderRadius: '8px', background: '#E8580C', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navLogoText: { fontSize: '18px', fontWeight: '700', color: '#1a1a18' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '24px' },
  navLink: { fontSize: '14px', color: '#5f5e5a', cursor: 'pointer' },
  navBtnOutline: { padding: '8px 20px', fontSize: '14px', background: 'none', border: '1.5px solid #e0ddd5', borderRadius: '8px', cursor: 'pointer', color: '#1a1a18' },
  navBtnFill: { padding: '8px 20px', fontSize: '14px', background: '#E8580C', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ffffff', fontWeight: '600' },

  hero: { display: 'flex', alignItems: 'center', gap: '60px', padding: '80px 60px', minHeight: '85vh' },
  heroLeft: { flex: 1 },
  heroBadge: { display: 'inline-block', background: '#FFF0E8', color: '#E8580C', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '20px', marginBottom: '24px', border: '1px solid #FFDCC8' },
  heroTitle: { fontSize: '52px', fontWeight: '800', color: '#1a1a18', lineHeight: '1.1', marginBottom: '20px', letterSpacing: '-0.02em' },
  heroOrange: { color: '#E8580C' },
  heroSub: { fontSize: '17px', color: '#5f5e5a', lineHeight: '1.7', marginBottom: '36px', maxWidth: '480px' },
  heroBtns: { display: 'flex', gap: '12px', marginBottom: '48px' },
  heroBtnMain: { padding: '14px 28px', fontSize: '15px', fontWeight: '700', background: '#E8580C', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  heroBtnSec: { padding: '14px 28px', fontSize: '15px', background: 'none', border: '1.5px solid #e0ddd5', borderRadius: '10px', cursor: 'pointer', color: '#1a1a18' },
  heroStats: { display: 'flex', gap: '32px' },
  heroStat: { display: 'flex', flexDirection: 'column', gap: '4px' },
  heroStatVal: { fontSize: '24px', fontWeight: '800', color: '#E8580C' },
  heroStatLabel: { fontSize: '12px', color: '#aaa89e' },
  heroRight: { flex: 1, display: 'flex', justifyContent: 'center' },
  heroImgGrid: { position: 'relative', width: '480px', height: '420px' },
  heroImgMain: { width: '320px', height: '320px', objectFit: 'cover', borderRadius: '20px', position: 'absolute', top: 0, left: 0 },
  heroImgSmall1: { width: '160px', height: '160px', objectFit: 'cover', borderRadius: '16px', position: 'absolute', top: 0, right: 0 },
  heroImgSmall2: { width: '200px', height: '160px', objectFit: 'cover', borderRadius: '16px', position: 'absolute', bottom: 0, right: 20 },

  section: { padding: '80px 60px' },
  sectionHeader: { textAlign: 'center', marginBottom: '48px' },
  sectionTitle: { fontSize: '36px', fontWeight: '800', color: '#1a1a18', marginBottom: '12px' },
  sectionSub: { fontSize: '16px', color: '#aaa89e' },

  mealsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  mealCard: { borderRadius: '16px', overflow: 'hidden', border: '0.5px solid #f0ede6', cursor: 'pointer', transition: 'transform 0.2s', background: '#ffffff' },
  mealImgWrap: { position: 'relative', height: '200px', overflow: 'hidden' },
  mealImg: { width: '100%', height: '100%', objectFit: 'cover' },
  mealTag: { position: 'absolute', top: '12px', left: '12px', background: '#E8580C', color: '#ffffff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' },
  mealInfo: { padding: '16px' },
  mealTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' },
  mealMeta: { display: 'flex', gap: '12px', marginBottom: '14px' },
  mealTime: { fontSize: '13px', color: '#aaa89e' },
  mealDiff: { fontSize: '13px', color: '#1D9E75', fontWeight: '600' },
  mealBtn: { width: '100%', padding: '10px', background: '#FFF0E8', color: '#E8580C', border: '1px solid #FFDCC8', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' },
  stepCard: { padding: '32px', background: '#ffffff', borderRadius: '16px', border: '0.5px solid #f0ede6' },
  stepNum: { fontSize: '48px', fontWeight: '900', color: '#E8580C', opacity: 0.15, marginBottom: '16px' },
  stepTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' },
  stepDesc: { fontSize: '14px', color: '#5f5e5a', lineHeight: '1.7' },

  cta: { padding: '80px 60px', background: '#E8580C', textAlign: 'center' },
  ctaTitle: { fontSize: '40px', fontWeight: '800', color: '#ffffff', marginBottom: '16px' },
  ctaSub: { fontSize: '17px', color: 'rgba(255,255,255,0.85)', marginBottom: '36px' },
  ctaBtn: { padding: '16px 36px', fontSize: '16px', fontWeight: '700', background: '#ffffff', color: '#E8580C', border: 'none', borderRadius: '12px', cursor: 'pointer' },

  footer: { padding: '40px 60px', borderTop: '0.5px solid #f0ede6', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  footerLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  footerText: { fontSize: '13px', color: '#aaa89e' },
}
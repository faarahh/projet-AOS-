import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DemoPage() {
  const navigate = useNavigate()
  const [showLock, setShowLock] = useState(false)

  const handleBlocked = () => setShowLock(true)

  return (
    <div style={s.shell}>

      {/* BACKGROUND */}
      <div style={s.bgWrap}>
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=90"
          style={s.bgImg}
        />
        <div style={s.bgOverlay} />
      </div>

      {/* MAIN */}
      <div style={s.main}>

        {/* TOPBAR */}
        <motion.div
          style={s.topbar}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div style={s.logo}>
            🍽️ FoodSync Demo
            <span style={s.badge}>DEMO MODE</span>
          </div>

          <button style={s.loginBtn} onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </motion.div>

        {/* CONTENT */}
        <div style={s.content}>

          {/* HERO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={s.hero}
          >
            <h1 style={s.title}>Expérimentez FoodSync</h1>
            <p style={s.subtitle}>
              Planifiez vos repas, générez vos listes et collaborez…
              mais certaines actions sont verrouillées 🔒
            </p>
          </motion.div>

          {/* GRID */}
          <div style={s.grid}>

            {[
              { title: "📅 Planification repas", items: ["Lundi - Couscous", "Mardi - Pasta"] },
              { title: "🛒 Liste de courses", items: ["✓ Tomates", "✓ Poulet"] },
              { title: "📊 Dashboard", items: ["Repas : 5", "Listes : 2"] },
            ].map((card, i) => (
              <motion.div
                key={i}
                style={s.card}
                onClick={handleBlocked}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={s.cardTitle}>{card.title}</div>

                {card.items.map((it, idx) => (
                  <div key={idx} style={s.fakeItem}>{it}</div>
                ))}

                <button style={s.actionBtn} onClick={handleBlocked}>
                  + Action verrouillée
                </button>
              </motion.div>
            ))}

          </div>
        </div>
      </div>

      {/* MODAL PREMIUM */}
      <AnimatePresence>
        {showLock && (
          <motion.div
            style={s.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLock(false)}
          >
            <motion.div
              style={s.modal}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >

              <div style={s.lockIcon}>🔒</div>

              <h2 style={s.modalTitle}>Fonctionnalité réservée</h2>

              <p style={s.modalText}>
                Rejoignez FoodSync pour débloquer l’expérience complète
              </p>

              <motion.button
                style={s.ctaBtn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
              >
                Rejoindre maintenant →
              </motion.button>

              <button
                style={s.closeBtn}
                onClick={() => setShowLock(false)}
              >
                Fermer
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const s = {

  shell: {
    height: '100vh',
    fontFamily: 'system-ui',
    position: 'relative',
    overflow: 'hidden'
  },

  bgWrap: {
    position: 'fixed',
    inset: 0,
    zIndex: 0
  },

  bgImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.05)'
  },

  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(2px)'
  },

  main: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },

  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '18px 40px',
    color: '#fff',
    backdropFilter: 'blur(14px)',
    background: 'rgba(255,255,255,0.06)'
  },

  logo: {
    fontWeight: '700',
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },

  badge: {
    fontSize: '10px',
    background: 'rgba(232,88,12,0.2)',
    padding: '3px 8px',
    borderRadius: '999px',
    color: '#E8580C'
  },

  loginBtn: {
    background: '#E8580C',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600'
  },

  content: {
    padding: '40px'
  },

  hero: {
    marginBottom: '30px'
  },

  title: {
    color: '#fff',
    fontSize: '38px',
    marginBottom: '8px'
  },

  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    maxWidth: '500px'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: '20px'
  },

  card: {
    background: 'rgba(255,255,255,0.08)',
    padding: '20px',
    borderRadius: '16px',
    color: '#fff',
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    transition: '0.3s'
  },

  cardTitle: {
    fontWeight: '700',
    marginBottom: '10px'
  },

  fakeItem: {
    fontSize: '13px',
    marginBottom: '6px',
    color: 'rgba(255,255,255,0.75)'
  },

  actionBtn: {
    marginTop: '12px',
    background: 'rgba(232,88,12,0.9)',
    border: 'none',
    padding: '8px',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
    width: '100%'
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },

  modal: {
    background: 'rgba(255,255,255,0.95)',
    padding: '30px',
    borderRadius: '18px',
    textAlign: 'center',
    width: '360px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },

  lockIcon: {
    fontSize: '42px'
  },

  modalTitle: {
    margin: '10px 0'
  },

  modalText: {
    fontSize: '14px',
    color: '#555'
  },

  ctaBtn: {
    background: '#E8580C',
    color: '#fff',
    border: 'none',
    padding: '12px',
    width: '100%',
    borderRadius: '10px',
    marginTop: '15px',
    cursor: 'pointer',
    fontWeight: '600'
  },

  closeBtn: {
    marginTop: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#777'
  }
}
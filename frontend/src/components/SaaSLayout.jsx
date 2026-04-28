export default function SaaSLayout({ title, action, children }) {
  return (
    <div style={s.shell}>

      <div style={s.bg} />

      <div style={s.main}>

        {/* TOPBAR */}
        <div style={s.topbar}>
          <h2 style={s.title}>{title}</h2>
          {action}
        </div>

        {/* CONTENT */}
        <div style={s.content}>
          {children}
        </div>

      </div>
    </div>
  )
}

const s = {
  shell: {
    height: '100vh',
    position: 'relative',
    fontFamily: 'system-ui',
    overflow: 'hidden'
  },

  bg: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)'
  },

  main: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },

  topbar: {
    height: '60px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)'
  },

  title: {
    color: '#fff',
    fontWeight: '700'
  },

  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  }
}
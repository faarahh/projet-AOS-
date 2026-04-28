export default function Topbar({ titre, btnLabel, onBtnClick }) {
  return (
    <div style={s.topbar}>
      <span style={s.titre}>{titre}</span>
      {btnLabel && (
        <button onClick={onBtnClick} style={s.btn}>+ {btnLabel}</button>
      )}
    </div>
  )
}

const s = {
  topbar: {
    height: '52px', minHeight: '52px',
    borderBottom: '0.5px solid #e0ddd5',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', background: '#ffffff',
  },
  titre: { fontSize: '15px', fontWeight: '500', color: '#1a1a18' },
  btn: {
    background: '#1D9E75', color: '#E1F5EE',
    border: 'none', borderRadius: '8px',
    padding: '7px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  },
}
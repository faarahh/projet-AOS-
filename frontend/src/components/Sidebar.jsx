import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useCallback } from 'react'
import groupsService from '../services/groupsService'

export default function Sidebar() {
  const { user, group, setActiveGroup, logout } = useAuth()
  const navigate = useNavigate()

  const [showPanel,     setShowPanel]     = useState(false)
  const [panelTab,      setPanelTab]      = useState('my-groups')
  const [myGroups,      setMyGroups]      = useState([])
  const [groupName,     setGroupName]     = useState('')
  const [joinCode,      setJoinCode]      = useState('')
  const [previewGroup,  setPreviewGroup]  = useState(null)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading,       setLoading]       = useState(false)

  const initiales = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const isOwner   = group && user && group.owner_id === user.id

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const loadGroups = useCallback(async () => {
    try { const g = await groupsService.getMyGroups(); setMyGroups(g) }
    catch { setMyGroups([]) }
  }, [])

  const openPanel = async (tab = 'my-groups') => {
    setPanelTab(tab); setShowPanel(true)
    setGroupName(''); setJoinCode(''); setError(''); setSuccess(''); setPreviewGroup(null)
    setLoading(true); await loadGroups(); setLoading(false)
  }

  const handleSwitch = (grp) => { setActiveGroup(grp); showSuccess(`Groupe : ${grp.name}`) }

  const handleCreate = async (e) => {
    e.preventDefault(); if (!groupName.trim()) return; setError('')
    try {
      const g = await groupsService.createGroup(groupName.trim())
      setActiveGroup(g); await loadGroups(); setGroupName('')
      showSuccess(`"${g.name}" créé ! Code : ${g.code}`); setPanelTab('my-groups')
    } catch (err) { setError(err.response?.data?.error || err.message) }
  }

  const handleJoin = async (e) => {
    e.preventDefault(); if (!joinCode.trim()) return; setError('')
    try {
      const g = await groupsService.joinGroup(joinCode.trim())
      setActiveGroup(g); await loadGroups(); setJoinCode(''); setPreviewGroup(null)
      showSuccess(`Rejoint "${g.name}" !`); setPanelTab('my-groups')
    } catch (err) { setError(err.response?.data?.error || err.message) }
  }

  const handleLeave = async () => {
    try { await groupsService.leaveGroup(group.id); setActiveGroup(null); await loadGroups(); showSuccess('Groupe quitté') }
    catch (err) { setError(err.response?.data?.error || err.message) }
  }

  const handleDelete = async () => {
    try { await groupsService.deleteGroup(group.id); setActiveGroup(null); await loadGroups(); setConfirmDelete(false); showSuccess('Groupe supprimé') }
    catch (err) { setError(err.response?.data?.error || err.message); setConfirmDelete(false) }
  }

  const handleCodeChange = async (val) => {
    const code = val.toUpperCase(); setJoinCode(code); setPreviewGroup(null)
    if (code.length >= 5) { try { setPreviewGroup(await groupsService.getGroupByCode(code)) } catch { } }
  }

  const NAV = [
    { to:'/',              label:'Dashboard',  exact:true,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg> },
    { to:'/listes',        label:'Listes',     exact:false,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { to:'/repas',         label:'Repas',      exact:false,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 010 8h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { to:'/notifications', label:'Notifs',     exact:false,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  ]

  return (
    <>
      <div style={s.bar}>
        <div style={s.logo} onClick={() => navigate('/')}>
          <div style={s.dot}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <span style={s.brand}>FoodSync</span>
        </div>

        <nav style={s.nav}>
          {NAV.map(l => (
            <NavLink key={l.to} to={l.to} end={l.exact} style={({isActive}) => ({...s.link,...(isActive?s.linkOn:{})})}>
              {({isActive}) => (<><span style={{...s.icon,color:isActive?'#E8580C':'rgba(255,255,255,0.45)'}}>{l.icon}</span><span>{l.label}</span>{isActive&&<div style={s.bar2}/>}</>)}
            </NavLink>
          ))}
        </nav>

        <div style={s.right}>
          <button style={{...s.grpBtn,...(group?s.grpOn:s.grpOff)}} onClick={()=>openPanel()}>
            <span>👥</span>
            <div style={{flex:1,minWidth:0}}>
              {group?<><div style={s.grpName}>{group.name}</div><div style={s.grpCode}>{group.code}</div></>:<div style={s.grpEmpty}>Mes groupes</div>}
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{color:'rgba(255,255,255,0.4)',flexShrink:0}}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          <div style={s.user}>
            <div style={s.avatar}>{initiales}</div>
            <div><div style={s.uname}>{user?.name?.split(' ')[0]}</div><div style={s.urole}>{user?.role==='admin'?'⭐ Admin':'👤 User'}</div></div>
            <button style={s.logout} onClick={()=>{logout();navigate('/landing')}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      {showPanel && (
        <div style={s.overlay} onClick={()=>setShowPanel(false)}>
          <div style={s.panel} onClick={e=>e.stopPropagation()}>
            <div style={s.ph}><span style={s.pt}>👥 Mes groupes</span><button style={s.pc} onClick={()=>setShowPanel(false)}>✕</button></div>
            {success&&<div style={s.ok}>✅ {success}</div>}
            {error&&<div style={s.err}>⚠ {error}</div>}
            <div style={s.tabs}>
              {[{k:'my-groups',l:'🏠 Mes groupes'},{k:'create',l:'➕ Créer'},{k:'join',l:'🔗 Rejoindre'}].map(t=>(
                <button key={t.k} style={{...s.tab,...(panelTab===t.k?s.tabOn:{})}} onClick={()=>{setPanelTab(t.k);setError('')}}>{t.l}</button>
              ))}
            </div>

            {panelTab==='my-groups'&&(
              <div>
                {loading&&<p style={{color:'#888780',fontSize:'13px',textAlign:'center'}}>Chargement...</p>}
                {group&&(
                  <div style={s.activeCard}>
                    <div style={{display:'flex',gap:'10px',alignItems:'flex-start',marginBottom:'10px'}}>
                      <span style={{fontSize:'26px'}}>👥</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'15px',fontWeight:'800',color:'#1a1a18',marginBottom:'3px'}}>{group.name}</div>
                        <div style={{fontSize:'12px',color:'#888780'}}>Code : <strong style={{color:'#E8580C'}}>{group.code}</strong></div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginTop:'6px'}}>
                          {(group.members||[]).map(m=><span key={m.user_id} style={s.chip}>{(m.user_name||m.user_email)?.split(' ')[0]}</span>)}
                        </div>
                      </div>
                      <span style={s.activeBadge}>Actif</span>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      {!isOwner&&<button style={s.leaveBtn} onClick={handleLeave}>Quitter</button>}
                      {isOwner&&<button style={s.delBtn} onClick={()=>setConfirmDelete(true)}>Supprimer</button>}
                    </div>
                  </div>
                )}
                {myGroups.filter(g=>g.id!==group?.id).map(g=>(
                  <div key={g.id} style={s.otherCard}>
                    <span style={{fontSize:'20px'}}>👥</span>
                    <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#1a1a18'}}>{g.name}</div><div style={{fontSize:'11px',color:'#aaa89e'}}>{g.member_count} membres · {g.code}</div></div>
                    <button style={s.switchBtn} onClick={()=>handleSwitch(g)}>Activer →</button>
                  </div>
                ))}
                {!loading&&myGroups.length===0&&<p style={{color:'#888780',fontSize:'13px',textAlign:'center',padding:'16px'}}>Aucun groupe — créez-en un !</p>}
                <div style={{display:'flex',gap:'8px',marginTop:'16px',paddingTop:'16px',borderTop:'0.5px solid #f0ede6'}}>
                  <button style={s.newBtn} onClick={()=>setPanelTab('create')}>➕ Créer</button>
                  <button style={s.joinBtn} onClick={()=>setPanelTab('join')}>🔗 Rejoindre</button>
                </div>
              </div>
            )}

            {panelTab==='create'&&(
              <form onSubmit={handleCreate}>
                <label style={s.lbl}>Nom du groupe</label>
                <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ex: Famille Benali..." required style={s.inp} autoFocus
                  onFocus={e=>e.target.style.borderColor='#E8580C'} onBlur={e=>e.target.style.borderColor='#e0ddd5'}/>
                <button type="submit" style={s.submit}>🏠 Créer le groupe →</button>
              </form>
            )}

            {panelTab==='join'&&(
              <form onSubmit={handleJoin}>
                <label style={s.lbl}>Code d'invitation</label>
                <input value={joinCode} onChange={e=>handleCodeChange(e.target.value)} placeholder="EX: FAM001" required
                  style={{...s.inp,textTransform:'uppercase',letterSpacing:'0.2em',fontSize:'20px',fontWeight:'800',textAlign:'center'}}
                  onFocus={e=>e.target.style.borderColor='#E8580C'} onBlur={e=>e.target.style.borderColor='#e0ddd5'}/>
                {previewGroup&&<div style={s.preview}><span style={{fontSize:'22px'}}>✅</span><div><div style={{fontSize:'14px',fontWeight:'700',color:'#0F6E56'}}>{previewGroup.name}</div><div style={{fontSize:'12px',color:'#1D9E75'}}>{previewGroup.member_count} membres</div></div></div>}
                {joinCode.length>3&&!previewGroup&&<div style={s.notFound}>❌ Code non trouvé</div>}
                <button type="submit" disabled={!joinCode} style={{...s.submit,opacity:joinCode?1:0.5}}>🔗 Rejoindre →</button>
              </form>
            )}
          </div>
        </div>
      )}

      {confirmDelete&&(
        <div style={s.overlay} onClick={()=>setConfirmDelete(false)}>
          <div style={{...s.panel,width:'340px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'36px',marginBottom:'12px'}}>⚠️</div>
            <div style={{fontSize:'17px',fontWeight:'800',color:'#1a1a18',marginBottom:'8px'}}>Supprimer "{group?.name}" ?</div>
            <div style={{fontSize:'13px',color:'#5f5e5a',lineHeight:'1.6',marginBottom:'20px'}}>Action irréversible. Tous les membres perdront l'accès.</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button style={s.delBtn} onClick={handleDelete}>Supprimer</button>
              <button style={{...s.switchBtn,flex:1}} onClick={()=>setConfirmDelete(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  bar:{height:'60px',minHeight:'60px',width:'100%',background:'#1a1a18',display:'flex',alignItems:'center',padding:'0 20px',gap:'8px',borderBottom:'0.5px solid rgba(255,255,255,0.06)',fontFamily:'system-ui,sans-serif',zIndex:100,boxSizing:'border-box',flexShrink:0},
  logo:{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',marginRight:'12px',flexShrink:0},
  dot:{width:'30px',height:'30px',borderRadius:'8px',background:'#E8580C',display:'flex',alignItems:'center',justifyContent:'center'},
  brand:{fontSize:'16px',fontWeight:'700',color:'#ffffff'},
  nav:{display:'flex',alignItems:'center',gap:'2px',flex:1,justifyContent:'center'},
  link:{display:'flex',alignItems:'center',gap:'7px',padding:'8px 12px',borderRadius:'10px',cursor:'pointer',textDecoration:'none',color:'rgba(255,255,255,0.45)',fontSize:'13px',fontWeight:'500',position:'relative'},
  linkOn:{color:'#ffffff',background:'rgba(255,255,255,0.06)'},
  icon:{display:'flex'},
  bar2:{position:'absolute',bottom:'-14px',left:'50%',transform:'translateX(-50%)',width:'20px',height:'2px',background:'#E8580C',borderRadius:'2px'},
  right:{display:'flex',alignItems:'center',gap:'8px',marginLeft:'auto',flexShrink:0},
  grpBtn:{display:'flex',alignItems:'center',gap:'8px',borderRadius:'10px',padding:'6px 12px',cursor:'pointer',border:'none',maxWidth:'200px'},
  grpOn:{background:'rgba(232,88,12,0.12)',border:'0.5px solid rgba(232,88,12,0.35)'},
  grpOff:{background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.15)'},
  grpName:{fontSize:'12px',fontWeight:'700',color:'#E8580C',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},
  grpCode:{fontSize:'10px',color:'rgba(255,255,255,0.3)'},
  grpEmpty:{fontSize:'12px',color:'rgba(255,255,255,0.55)',fontWeight:'500'},
  user:{display:'flex',alignItems:'center',gap:'8px'},
  avatar:{width:'32px',height:'32px',borderRadius:'50%',background:'#E8580C',color:'#ffffff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',flexShrink:0},
  uname:{fontSize:'12px',fontWeight:'600',color:'#ffffff',lineHeight:'1.2'},
  urole:{fontSize:'10px',color:'rgba(255,255,255,0.35)'},
  logout:{background:'none',border:'none',cursor:'pointer',padding:'6px',display:'flex'},
  overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,fontFamily:'system-ui,sans-serif'},
  panel:{background:'#ffffff',borderRadius:'20px',border:'0.5px solid #e0ddd5',padding:'28px',width:'460px',maxHeight:'85vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'},
  ph:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'},
  pt:{fontSize:'18px',fontWeight:'800',color:'#1a1a18'},
  pc:{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'#aaa89e'},
  ok:{background:'#E6F7F1',border:'0.5px solid #9FE1CB',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#0F6E56',marginBottom:'14px',fontWeight:'600'},
  err:{background:'#FCEBEB',border:'0.5px solid #F09595',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#A32D2D',marginBottom:'14px'},
  tabs:{display:'flex',gap:'4px',background:'#f5f5f0',borderRadius:'10px',padding:'4px',marginBottom:'20px'},
  tab:{flex:1,padding:'8px 6px',fontSize:'12px',fontWeight:'500',border:'none',borderRadius:'8px',cursor:'pointer',background:'none',color:'#888780',whiteSpace:'nowrap'},
  tabOn:{background:'#ffffff',color:'#1a1a18',fontWeight:'700'},
  activeCard:{background:'#FFF8F5',border:'1.5px solid #E8580C',borderRadius:'14px',padding:'16px',marginBottom:'14px'},
  chip:{fontSize:'11px',background:'#ffffff',border:'0.5px solid #FFDCC8',borderRadius:'20px',padding:'2px 8px',color:'#E8580C',fontWeight:'600'},
  activeBadge:{fontSize:'10px',fontWeight:'700',background:'#E8580C',color:'#fff',padding:'3px 10px',borderRadius:'20px',flexShrink:0,height:'fit-content'},
  leaveBtn:{padding:'7px 14px',background:'#FEF3E2',border:'0.5px solid #F59E0B',borderRadius:'8px',color:'#B45309',fontSize:'12px',fontWeight:'600',cursor:'pointer'},
  delBtn:{flex:1,padding:'7px 14px',background:'#FCEBEB',border:'0.5px solid #F09595',borderRadius:'8px',color:'#A32D2D',fontSize:'12px',fontWeight:'600',cursor:'pointer'},
  otherCard:{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'#fafaf8',border:'0.5px solid #e0ddd5',borderRadius:'10px',marginBottom:'8px'},
  switchBtn:{flex:1,fontSize:'12px',fontWeight:'600',color:'#E8580C',background:'#FFF0E8',border:'0.5px solid #FFDCC8',borderRadius:'8px',padding:'6px 12px',cursor:'pointer'},
  newBtn:{flex:1,padding:'10px',background:'#E8580C',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'600',cursor:'pointer'},
  joinBtn:{flex:1,padding:'10px',background:'none',color:'#E8580C',border:'1px solid #E8580C',borderRadius:'8px',fontSize:'12px',fontWeight:'600',cursor:'pointer'},
  lbl:{display:'block',fontSize:'13px',fontWeight:'600',color:'#3d3d3a',marginBottom:'8px'},
  inp:{width:'100%',padding:'12px 14px',fontSize:'14px',border:'1.5px solid #e0ddd5',borderRadius:'10px',outline:'none',background:'#fafaf8',color:'#1a1a18',boxSizing:'border-box',marginBottom:'12px',fontFamily:'system-ui,sans-serif'},
  submit:{width:'100%',padding:'12px',background:'#E8580C',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:'pointer'},
  preview:{display:'flex',gap:'10px',alignItems:'flex-start',background:'#E6F7F1',border:'1px solid #9FE1CB',borderRadius:'10px',padding:'12px',marginBottom:'10px'},
  notFound:{background:'#FCEBEB',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',color:'#A32D2D',marginBottom:'10px'},
}

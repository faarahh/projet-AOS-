import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import groupsService from '../services/groupsService'

export default function GroupePage() {
  const { user, group, setActiveGroup, refreshGroups, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]                 = useState('mine')
  const [myGroups, setMyGroups]       = useState([])
  const [groupName, setGroupName]     = useState('')
  const [joinCode, setJoinCode]       = useState('')
  const [preview, setPreview]         = useState(null)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [pageLoad, setPageLoad]       = useState(true)

  useEffect(() => { refreshGroups().then(g => { setMyGroups(g); setPageLoad(false) }) }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); if (!groupName.trim()) return
    setLoading(true); setError('')
    try { const g = await groupsService.createGroup(groupName.trim()); setActiveGroup(g); navigate('/') }
    catch (err) { setError(err.response?.data?.error || err.message) }
    finally { setLoading(false) }
  }

  const handleCodeChange = async (val) => {
    const code = val.toUpperCase(); setJoinCode(code); setPreview(null)
    if (code.length >= 5) { try { setPreview(await groupsService.getGroupByCode(code)) } catch {} }
  }

  const handleJoin = async (e) => {
    e.preventDefault(); if (!joinCode.trim()) return
    setLoading(true); setError('')
    try { const g = await groupsService.joinGroup(joinCode.trim()); setActiveGroup(g); navigate('/') }
    catch (err) { setError(err.response?.data?.error || err.message) }
    finally { setLoading(false) }
  }

  const handleLeave = async (grp) => {
    if (!window.confirm(`Quitter "${grp.name}" ?`)) return
    try { await groupsService.leaveGroup(grp.id); const g = await refreshGroups(); setMyGroups(g); if (group?.id === grp.id) setActiveGroup(null) }
    catch (err) { setError(err.response?.data?.error || err.message) }
  }

  return (
    <div style={s.page}>
      <div style={s.bg}><img src="https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=1200&q=80" alt="food" style={s.bgImg}/><div style={s.ov}/></div>
      <div style={s.content}>
        <div style={s.header}>
          <div style={s.logo}><div style={s.ld}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><span style={s.lt}>FoodSync</span></div>
          <div style={{display:'flex',gap:'8px'}}>
            {group&&<button style={s.back} onClick={()=>navigate('/')}>← Dashboard</button>}
            <button style={s.logoutBtn} onClick={()=>{logout();navigate('/landing')}}>Déconnexion</button>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.welcome}>
            <div style={s.av}>{user?.name?.charAt(0)}</div>
            <div><h2 style={s.wt}>Bienvenue, {user?.name?.split(' ')[0]} !</h2><p style={s.ws}>Créez ou rejoignez un groupe pour collaborer</p></div>
          </div>

          <div style={s.tabs}>
            {[{k:'mine',l:'Mes groupes'},{k:'create',l:'Créer'},{k:'join',l:'Rejoindre'}].map(t=>(
              <button key={t.k} style={{...s.tab,...(tab===t.k?s.tabOn:{})}} onClick={()=>{setTab(t.k);setError('')}}>{t.l}</button>
            ))}
          </div>

          {error&&<div style={s.err}>⚠ {error}</div>}

          {tab==='mine'&&(
            <div>
              {pageLoad&&<div style={s.empty}>Chargement...</div>}
              {!pageLoad&&myGroups.length===0&&<div style={s.empty}>Aucun groupe — <span style={{color:'#E8580C',cursor:'pointer'}} onClick={()=>setTab('create')}>créez-en un →</span></div>}
              {myGroups.map(g=>(
                <div key={g.id} style={{...s.row,...(group?.id===g.id?s.rowActive:{})}}>
                  <div style={s.gav}>{g.name[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:'700',color:'#1a1a18',marginBottom:'2px'}}>{g.name}</div>
                    <div style={{fontSize:'12px',color:'#888780'}}>Code: <strong style={{color:'#E8580C'}}>{g.code}</strong> · {g.member_count} membre{g.member_count>1?'s':''}{g.owner_id===user?.id&&<span style={s.ob}> Propriétaire</span>}</div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button style={s.swBtn} onClick={()=>{setActiveGroup(g);navigate('/')}}>{group?.id===g.id?'✓ Actif':'Activer'}</button>
                    {g.owner_id!==user?.id&&<button style={s.lvBtn} onClick={()=>handleLeave(g)}>Quitter</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='create'&&(
            <form onSubmit={handleCreate}>
              <label style={s.lbl}>Nom du groupe</label>
              <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ex: Famille Benali, Coloc..." required style={s.inp} onFocus={e=>e.target.style.borderColor='#E8580C'} onBlur={e=>e.target.style.borderColor='#e0ddd5'}/>
              <div style={{fontSize:'12px',color:'#aaa89e',marginBottom:'16px',fontStyle:'italic'}}>Un code unique sera généré automatiquement</div>
              <button type="submit" disabled={loading} style={{...s.btn,opacity:loading?.7:1}}>{loading?'Création...':'Créer mon groupe →'}</button>
            </form>
          )}

          {tab==='join'&&(
            <form onSubmit={handleJoin}>
              <label style={s.lbl}>Code d'invitation</label>
              <input value={joinCode} onChange={e=>handleCodeChange(e.target.value)} placeholder="Ex: FAM001" required style={{...s.inp,textTransform:'uppercase',letterSpacing:'0.15em',fontSize:'20px',fontWeight:'800',textAlign:'center'}} onFocus={e=>e.target.style.borderColor='#E8580C'} onBlur={e=>e.target.style.borderColor=preview?'#1D9E75':'#e0ddd5'}/>
              {preview&&<div style={s.pv}><div style={{fontSize:'22px'}}>✅</div><div><div style={{fontSize:'15px',fontWeight:'700',color:'#0F6E56',marginBottom:'4px'}}>{preview.name}</div><div style={{fontSize:'12px',color:'#1D9E75'}}>{preview.member_count} membres</div><div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginTop:'6px'}}>{(preview.members||[]).map(m=><span key={m.user_id} style={s.mc}>{(m.user_name||m.user_email)?.split(' ')[0]}</span>)}</div></div></div>}
              <button type="submit" disabled={loading||!joinCode} style={{...s.btn,opacity:(loading||!joinCode)?.7:1}}>{loading?'Connexion...':'Rejoindre ce groupe →'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page:{minHeight:'100vh',position:'relative',fontFamily:'system-ui,sans-serif'},
  bg:{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:0},bgImg:{width:'100%',height:'100%',objectFit:'cover'},
  ov:{position:'absolute',top:0,left:0,right:0,bottom:0,background:'rgba(10,10,10,0.65)'},
  content:{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',minHeight:'100vh',padding:'0 24px 60px'},
  header:{width:'100%',maxWidth:'560px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'24px 0'},
  logo:{display:'flex',alignItems:'center',gap:'10px'},
  ld:{width:'34px',height:'34px',borderRadius:'10px',background:'#E8580C',display:'flex',alignItems:'center',justifyContent:'center'},
  lt:{fontSize:'18px',fontWeight:'700',color:'#ffffff'},
  back:{padding:'8px 16px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'rgba(255,255,255,0.8)',fontSize:'13px',cursor:'pointer'},
  logoutBtn:{padding:'8px 16px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'8px',color:'rgba(255,255,255,0.7)',fontSize:'13px',cursor:'pointer'},
  card:{background:'#ffffff',borderRadius:'24px',border:'0.5px solid #e0ddd5',padding:'36px',width:'100%',maxWidth:'540px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'},
  welcome:{display:'flex',alignItems:'center',gap:'16px',marginBottom:'24px',paddingBottom:'20px',borderBottom:'0.5px solid #f0ede6'},
  av:{width:'52px',height:'52px',borderRadius:'50%',background:'#E8580C',color:'#ffffff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:'700',flexShrink:0},
  wt:{fontSize:'20px',fontWeight:'800',color:'#1a1a18',marginBottom:'4px'},
  ws:{fontSize:'13px',color:'#888780'},
  tabs:{display:'flex',gap:'4px',background:'#f5f5f0',borderRadius:'12px',padding:'4px',marginBottom:'20px'},
  tab:{flex:1,padding:'10px',fontSize:'13px',fontWeight:'500',border:'none',borderRadius:'10px',cursor:'pointer',background:'none',color:'#888780'},
  tabOn:{background:'#ffffff',color:'#1a1a18',fontWeight:'700'},
  err:{background:'#FCEBEB',border:'0.5px solid #F09595',borderRadius:'10px',padding:'12px 16px',fontSize:'13px',color:'#A32D2D',marginBottom:'16px'},
  empty:{color:'#888780',fontSize:'14px',textAlign:'center',padding:'24px 0',lineHeight:2},
  row:{display:'flex',alignItems:'center',gap:'12px',padding:'14px',borderRadius:'12px',border:'0.5px solid #e0ddd5',marginBottom:'10px',background:'#fafaf8'},
  rowActive:{border:'1.5px solid #E8580C',background:'#FFF8F5'},
  gav:{width:'40px',height:'40px',borderRadius:'50%',background:'#f0ede6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'700',color:'#3d3d3a',flexShrink:0},
  ob:{marginLeft:'4px',fontSize:'10px',background:'#EEEDFE',color:'#3C3489',padding:'1px 6px',borderRadius:'10px',fontWeight:'600'},
  swBtn:{padding:'6px 14px',background:'#E8580C',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'600',cursor:'pointer'},
  lvBtn:{padding:'6px 14px',background:'#FCEBEB',color:'#A32D2D',border:'none',borderRadius:'8px',fontSize:'12px',cursor:'pointer'},
  lbl:{display:'block',fontSize:'13px',fontWeight:'600',color:'#3d3d3a',marginBottom:'8px'},
  inp:{width:'100%',padding:'14px 16px',fontSize:'15px',border:'1.5px solid #e0ddd5',borderRadius:'10px',outline:'none',background:'#fafaf8',color:'#1a1a18',boxSizing:'border-box',marginBottom:'12px'},
  btn:{width:'100%',padding:'14px',background:'#E8580C',color:'#ffffff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor:'pointer'},
  pv:{display:'flex',gap:'12px',background:'#E6F7F1',border:'1px solid #9FE1CB',borderRadius:'12px',padding:'14px',marginBottom:'12px',alignItems:'flex-start'},
  mc:{fontSize:'11px',background:'#ffffff',border:'0.5px solid #9FE1CB',borderRadius:'20px',padding:'3px 10px',color:'#0F6E56',fontWeight:'600'},
}

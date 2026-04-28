import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import listsService  from '../services/listsService'
import mealsService  from '../services/mealsService'
import groupsService from '../services/groupsService'

const TODAY   = new Date().toISOString().split('T')[0]
const MOMENTS = [
  { key: 'breakfast', label: 'Petit-déjeuner', heure: '07:30', color: '#EF9F27' },
  { key: 'lunch',     label: 'Déjeuner',       heure: '12:30', color: '#E8580C' },
  { key: 'dinner',    label: 'Dîner',          heure: '19:30', color: '#7F77DD' },
]
const BG = ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90']

export default function Dashboard() {
  const { user, group } = useAuth()
  const navigate = useNavigate()
  const [listes,  setListes]  = useState([])
  const [plans,   setPlans]   = useState([])
  const [members, setMembers] = useState([])
  const [heure,   setHeure]   = useState(new Date())

  useEffect(() => { const t = setInterval(() => setHeure(new Date()), 1000); return () => clearInterval(t) }, [])

  const loadData = useCallback(async () => {
    try { const [l, p] = await Promise.all([listsService.getLists(), mealsService.getMealPlans()]); setListes(l); setPlans(p) } catch {}
    if (group?.id) { try { const g = await groupsService.getGroup(group.id); setMembers(g.members || []) } catch { setMembers([]) } }
  }, [group?.id])

  useEffect(() => { loadData() }, [loadData])

  const getMoment = () => { const h = heure.getHours(); if (h < 12) return 'Bonjour'; if (h < 18) return 'Bon après-midi'; return 'Bonsoir' }

  const pm = {}; plans.forEach(p => { pm[p.date+'-'+p.meal_type] = p })
  const repasToday = MOMENTS.map(m => ({ ...m, meal: pm[TODAY+'-'+m.key] || null }))
  const totalItems  = listes.reduce((a,l) => a+(l.items?.length||0), 0)
  const totalCoches = listes.reduce((a,l) => a+(l.items?.filter(i=>i.checked).length||0), 0)

  return (
    <div style={s.shell}>
      <Sidebar />
      <div style={s.bgWrap}><img src={BG[0]} alt="bg" style={s.bgImg}/><div style={s.bgOv}/></div>
      <div style={s.main}>
        <div style={s.topbar}>
          <span style={s.ttl}>Tableau de bord</span>
          <div style={{display:'flex',gap:'8px'}}>
            <button style={s.tbtn} onClick={() => navigate('/listes')}>+ Nouvelle liste</button>
            <button style={{...s.tbtn,background:'#E8580C',borderColor:'#E8580C'}} onClick={() => navigate('/repas')}>+ Planifier repas</button>
          </div>
        </div>
        <div style={s.content}>
          <h1 style={s.hero}>{getMoment()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={s.sub}>{heure.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})} · {heure.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</p>
          {group && <div style={s.pill}><span>👥</span><span style={{fontSize:'13px',fontWeight:'700',color:'#E8580C'}}>{group.name}</span><span style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.1)',padding:'1px 8px',borderRadius:'10px'}}>{group.code}</span><span style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{members.length} membres</span></div>}

          <div style={s.stats}>
            {[{l:'Listes',v:listes.length,c:'#E8580C'},{l:'Articles',v:totalItems,s:`${totalCoches} cochés`,c:'#1D9E75'},{l:'Repas planifiés',v:plans.length,c:'#7F77DD'},{l:'Membres',v:members.length,c:'#EF9F27'}].map(st=>(
              <div key={st.l} style={s.sc}><div style={{...s.sb,background:st.c}}/><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'8px 0 4px'}}><span style={{color:st.c,fontSize:'18px'}}>◉</span><span style={{fontSize:'28px',fontWeight:'800',color:st.c}}>{st.v}</span></div><div style={{fontSize:'12px',fontWeight:'600',color:'rgba(255,255,255,0.9)'}}>{st.l}</div>{st.s&&<div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{st.s}</div>}</div>
            ))}
          </div>

          <div style={s.two}>
            <div style={s.gc}>
              <div style={s.ch}><span style={s.ct}>🍽️ Repas du jour</span><button style={s.cl} onClick={()=>navigate('/repas')}>Voir →</button></div>
              {repasToday.map(r=>(
                <div key={r.key} style={s.rr}>
                  <div style={{...s.rd,background:r.color}}/><div style={s.rh}>{r.heure}</div>
                  <div style={{flex:1}}><div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'2px'}}>{r.label}</div>
                    {r.meal?<div style={{fontSize:'13px',fontWeight:'700',color:'#ffffff'}}>{r.meal.recipe_title||r.meal.recipe?.title}</div>:<div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>Non planifié — <span style={{color:'#E8580C',cursor:'pointer'}} onClick={()=>navigate('/repas')}>Ajouter</span></div>}
                  </div>
                  {r.meal&&<span style={{color:r.color,fontWeight:'700'}}>✓</span>}
                </div>
              ))}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div style={s.gc}>
                <div style={s.ch}><span style={s.ct}>🛒 Listes récentes</span><button style={s.cl} onClick={()=>navigate('/listes')}>Voir tout →</button></div>
                {listes.slice(0,3).map(l=>{const items=l.items||[];const pct=items.length>0?(items.filter(i=>i.checked).length/items.length)*100:0;return(
                  <div key={l.id} style={s.lc}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'13px',fontWeight:'700',color:'#ffffff'}}>{l.title}</span><span style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{items.length} art.</span></div><div style={{height:'3px',background:'rgba(255,255,255,0.15)',borderRadius:'10px',overflow:'hidden'}}><div style={{height:'100%',background:'#1D9E75',borderRadius:'10px',width:`${pct}%`,transition:'width 0.3s'}}/></div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',marginTop:'4px'}}>{Math.round(pct)}%</div></div>
                )})}
                {listes.length===0&&<div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',padding:'8px 0'}}>Aucune liste — <span style={{color:'#E8580C',cursor:'pointer'}} onClick={()=>navigate('/listes')}>créer</span></div>}
              </div>

              {group&&members.length>0&&(
                <div style={s.gc}>
                  <div style={s.ch}><span style={s.ct}>👥 {group.name}</span></div>
                  {members.map(m=>(
                    <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#E8580C',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',flexShrink:0}}>{(m.user_name||m.user_email||'?')[0].toUpperCase()}</div>
                      <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'600',color:'#ffffff'}}>{m.user_name||m.user_email}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>{m.user_email}</div></div>
                      {m.user_id===group.owner_id&&<span style={{fontSize:'13px'}}>👑</span>}
                    </div>
                  ))}
                  <div style={{background:'rgba(232,88,12,0.15)',border:'0.5px solid rgba(232,88,12,0.3)',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'rgba(255,255,255,0.7)'}}>Code : <strong style={{color:'#E8580C'}}>{group.code}</strong></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  shell:{display:'flex',flexDirection:'column',height:'100vh',fontFamily:'system-ui,sans-serif',position:'relative',overflow:'hidden'},
  bgWrap:{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:0},bgImg:{width:'100%',height:'100%',objectFit:'cover'},
  bgOv:{position:'absolute',top:0,left:0,right:0,bottom:0,background:'linear-gradient(135deg,rgba(10,10,10,.75) 0%,rgba(20,15,10,.65) 100%)'},
  main:{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',zIndex:1},
  topbar:{height:'52px',minHeight:'52px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',background:'rgba(255,255,255,0.08)',backdropFilter:'blur(12px)',borderBottom:'0.5px solid rgba(255,255,255,0.12)'},
  ttl:{fontSize:'15px',fontWeight:'600',color:'#ffffff'},
  tbtn:{padding:'8px 16px',fontSize:'13px',fontWeight:'600',background:'rgba(255,255,255,0.15)',color:'#ffffff',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:'8px',cursor:'pointer'},
  content:{flex:1,overflowY:'auto',padding:'24px 28px'},
  hero:{fontSize:'32px',fontWeight:'800',color:'#ffffff',marginBottom:'6px'},
  sub:{fontSize:'14px',color:'rgba(255,255,255,0.65)',marginBottom:'14px'},
  pill:{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(232,88,12,0.2)',border:'0.5px solid rgba(232,88,12,0.5)',borderRadius:'20px',padding:'6px 14px',marginBottom:'20px'},
  stats:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'},
  sc:{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'16px',padding:'16px',position:'relative',overflow:'hidden'},
  sb:{position:'absolute',top:0,left:0,right:0,height:'3px'},
  two:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'},
  gc:{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(16px)',border:'0.5px solid rgba(255,255,255,0.18)',borderRadius:'16px',padding:'18px'},
  ch:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'},
  ct:{fontSize:'14px',fontWeight:'700',color:'#ffffff'},
  cl:{fontSize:'12px',color:'#E8580C',background:'none',border:'none',cursor:'pointer',fontWeight:'600'},
  rr:{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:'0.5px solid rgba(255,255,255,0.08)'},
  rd:{width:'8px',height:'8px',borderRadius:'50%',flexShrink:0},
  rh:{fontSize:'12px',color:'rgba(255,255,255,0.5)',minWidth:'38px',fontWeight:'600'},
  lc:{background:'rgba(255,255,255,0.08)',borderRadius:'10px',padding:'12px',marginBottom:'8px'},
}

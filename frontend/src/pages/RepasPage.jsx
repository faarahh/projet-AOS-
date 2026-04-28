import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import mealsService from '../services/mealsService'

const JOURS   = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const MOMENTS = [
  { key: 'breakfast', label: 'Petit-déj',  color: '#EF9F27' },
  { key: 'lunch',     label: 'Déjeuner',   color: '#E8580C' },
  { key: 'dinner',    label: 'Dîner',      color: '#7F77DD' },
]
const getWeekDates = () => {
  const today = new Date(), day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  return JOURS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate()+i); return d.toISOString().split('T')[0] })
}
const WEEK_DATES = getWeekDates()
const TODAY = new Date().toISOString().split('T')[0]

const MEAL_PHOTOS = {
  'Poulet rôti':      'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=200&q=80',
  'Pasta Bolognaise': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200&q=80',
  'Couscous':         'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=200&q=80',
  'Tajine poulet':    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80',
  'Salade César':     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
}

export default function RepasPage() {
  const { group } = useAuth()
  const [plans,   setPlans]   = useState([])
  const [recipes, setRecipes] = useState([])
  const [modal,   setModal]   = useState(null)
  const [tab,     setTab]     = useState('choose')
  const [sel,     setSel]     = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newIngs,  setNewIngs]  = useState('')
  const [toast,   setToast]   = useState(null)
  const [loading, setLoading] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([
        mealsService.getRecipes(group?.id),
        mealsService.getMealPlans(group?.id),
      ])
      setRecipes(r); setPlans(p)
    } catch { } finally { setLoading(false) }
  }, [group?.id])

  useEffect(() => { refresh() }, [refresh])

  const planningMap = {}
  plans.forEach(p => { planningMap[`${p.date}-${p.meal_type}`] = p })

  const planifier = async () => {
    if (!sel) return
    try {
      await mealsService.planMeal({
        date:      modal.date,
        meal_type: modal.moment,
        recipe_id: sel.id,
        group_id:  group?.id,
      })
      await refresh(); setModal(null)
      showToast(`"${sel.title}" planifié !`)
    } catch (err) { showToast(err.response?.data?.error || 'Erreur') }
  }

  const supprimerPlan = async (planId) => {
    try { await mealsService.deleteMealPlan(planId); await refresh() }
    catch (err) { showToast(err.response?.data?.error || 'Erreur') }
  }

  const creerRecette = async () => {
    if (!newTitle.trim()) return
    const ingredients = newIngs.split('\n').filter(Boolean).map(line => {
      const p = line.split(',')
      return { name: p[0]?.trim() || line, quantity: parseFloat(p[1]) || 1, unit: p[2]?.trim() || 'unit' }
    })
    try {
      await mealsService.createRecipe({ title: newTitle.trim(), ingredients }, group?.id)
      await refresh(); setTab('choose'); setNewTitle(''); setNewIngs('')
      showToast(`Recette "${newTitle}" créée !`)
    } catch (err) { showToast(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div style={s.shell}>
      <Sidebar />
      <div style={s.bgWrap}>
        <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1600&q=90" alt="bg" style={s.bgImg} />
        <div style={s.bgOverlay} />
      </div>
      <div style={s.main}>
        <div style={s.topbar}>
          <span style={s.topbarTitle}>
            Planning des repas {group && <span style={s.groupTag}>· {group.name}</span>}
          </span>
          {loading && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Chargement...</span>}
        </div>
        <div style={s.content}>
          <div style={s.weekGrid}>
            {WEEK_DATES.map((date, dayIdx) => (
              <div key={date} style={{ ...s.dayCol, ...(date === TODAY ? s.todayCol : {}) }}>
                <div style={s.dayHeader}>
                  <div style={s.dayName}>{JOURS[dayIdx]}</div>
                  <div style={{ ...s.dayDate, ...(date === TODAY ? s.todayDate : {}) }}>{date.slice(8)}</div>
                </div>
                {MOMENTS.map(m => {
                  const plan = planningMap[`${date}-${m.key}`]
                  return (
                    <div key={m.key} style={s.slot} onClick={() => !plan && setModal({ date, moment: m.key })}>
                      <div style={{ ...s.momentLabel, color: m.color }}>{m.label}</div>
                      {plan ? (
                        <div style={{ ...s.mealCard, borderLeft: `3px solid ${m.color}` }}>
                          {MEAL_PHOTOS[plan.recipe_title] && (
                            <img src={MEAL_PHOTOS[plan.recipe_title]} alt="" style={s.mealPhoto} />
                          )}
                          <div style={s.mealTitle}>{plan.recipe_title}</div>
                          <button style={s.deleteSlotBtn} onClick={e => { e.stopPropagation(); supprimerPlan(plan.id) }}>✕</button>
                        </div>
                      ) : (
                        <div style={s.emptySlot}>+ Ajouter</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div style={s.modalOverlay} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>
                {JOURS[WEEK_DATES.indexOf(modal.date)]} — {MOMENTS.find(m => m.key === modal.moment)?.label}
              </div>
              <button style={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={s.tabRow}>
              {[{ k:'choose', l:'Choisir' }, { k:'new', l:'Créer recette' }].map(t => (
                <button key={t.k} style={{ ...s.tabBtn, ...(tab === t.k ? s.tabBtnActive : {}) }}
                  onClick={() => setTab(t.k)}>{t.l}</button>
              ))}
            </div>
            {tab === 'choose' && (
              <div style={s.recipeList}>
                {recipes.length === 0 && (
                  <div style={{ color: '#aaa89e', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                    Aucune recette — créez-en une !
                  </div>
                )}
                {recipes.map(r => (
                  <div key={r.id}
                    style={{ ...s.recipeRow, ...(sel?.id === r.id ? s.recipeRowSel : {}) }}
                    onClick={() => setSel(r)}>
                    {MEAL_PHOTOS[r.title] && <img src={MEAL_PHOTOS[r.title]} alt="" style={s.recipeThumb} />}
                    <div>
                      <div style={s.recipeTitle}>{r.title}</div>
                      <div style={s.recipeSub}>{r.ingredients?.length || 0} ingrédients</div>
                    </div>
                  </div>
                ))}
                <button style={{ ...s.confirmBtn, opacity: sel ? 1 : 0.5 }}
                  disabled={!sel} onClick={planifier}>Planifier ce repas</button>
              </div>
            )}
            {tab === 'new' && (
              <div style={s.newRecipeForm}>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Nom de la recette" style={s.formInput} />
                <textarea value={newIngs} onChange={e => setNewIngs(e.target.value)}
                  placeholder={"Un ingrédient par ligne:\nTomates, 500, g\nOignons, 2, unit"}
                  style={{ ...s.formInput, height: '100px', resize: 'vertical' }} />
                <div style={{ fontSize: '11px', color: '#aaa89e', marginBottom: '8px' }}>
                  Format: Nom, quantité, unité
                </div>
                <button style={s.confirmBtn} onClick={creerRecette}>Créer la recette</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

const s = {
  shell: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' },
  bgWrap: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  bgImg: { width: '100%', height: '100%', objectFit: 'cover' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.75) 0%, rgba(20,15,10,0.65) 100%)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 },
  topbar: { height: '52px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(255,255,255,0.12)' },
  topbarTitle: { fontSize: '15px', fontWeight: '600', color: '#ffffff' },
  groupTag: { color: '#E8580C', fontWeight: '400' },
  content: { flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '20px 28px' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: '8px', minWidth: '900px' },
  dayCol: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '0.5px solid rgba(255,255,255,0.15)', overflow: 'hidden' },
  todayCol: { border: '1.5px solid rgba(232,88,12,0.6)', background: 'rgba(232,88,12,0.08)' },
  dayHeader: { padding: '10px 12px 8px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' },
  dayName: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  dayDate: { fontSize: '20px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 },
  todayDate: { color: '#E8580C' },
  slot: { padding: '8px 10px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', cursor: 'pointer' },
  momentLabel: { fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  mealCard: { background: 'rgba(255,255,255,0.92)', borderRadius: '8px', padding: '8px', position: 'relative' },
  mealPhoto: { width: '100%', height: '50px', objectFit: 'cover', borderRadius: '6px', marginBottom: '5px' },
  mealTitle: { fontSize: '11px', fontWeight: '600', color: '#1a1a18', lineHeight: 1.3 },
  deleteSlotBtn: { position: 'absolute', top: '4px', right: '4px', background: 'rgba(163,45,45,0.15)', border: 'none', borderRadius: '4px', color: '#A32D2D', fontSize: '9px', cursor: 'pointer', padding: '2px 5px' },
  emptySlot: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0', borderRadius: '6px', border: '0.5px dashed rgba(255,255,255,0.2)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBox: { background: '#ffffff', borderRadius: '20px', width: '420px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '0.5px solid #f0ede6' },
  modalTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a18' },
  modalClose: { background: '#f5f5f0', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#888780' },
  tabRow: { display: 'flex', gap: '4px', padding: '12px 16px', borderBottom: '0.5px solid #f0ede6' },
  tabBtn: { flex: 1, padding: '8px', fontSize: '12px', fontWeight: '500', background: '#f5f5f0', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#888780' },
  tabBtnActive: { background: '#E8580C', color: '#ffffff' },
  recipeList: { overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  recipeRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1.5px solid #f0ede6', borderRadius: '10px', cursor: 'pointer' },
  recipeRowSel: { border: '1.5px solid #E8580C', background: '#FFF5F0' },
  recipeThumb: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
  recipeTitle: { fontSize: '13px', fontWeight: '600', color: '#1a1a18' },
  recipeSub: { fontSize: '11px', color: '#aaa89e' },
  confirmBtn: { marginTop: '12px', width: '100%', padding: '12px', background: '#E8580C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  newRecipeForm: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  formInput: { width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid #e0ddd5', borderRadius: '8px', outline: 'none', background: '#fafaf8', color: '#1a1a18', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', background: '#1D9E75', color: '#fff', fontSize: '13px', fontWeight: '500', padding: '12px 20px', borderRadius: '10px', zIndex: 300 },
}

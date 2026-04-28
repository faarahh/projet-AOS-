import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import listsService  from '../services/listsService'
import mealsService  from '../services/mealsService'

// ── Week dates helper ─────────────────────────────────────────────────────────
const getWeekDates = () => {
  const today = new Date(), day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}
const WEEK_DATES = getWeekDates()

const MEAL_LABELS = { breakfast: 'Petit-déj', lunch: 'Déjeuner', dinner: 'Dîner' }

export default function ListesPage() {
  const { user, group } = useAuth()

  // ── Lists state ───────────────────────────────────────────────────────────
  const [listes,        setListes]       = useState([])
  const [nouvelleListe, setNouvelleListe] = useState('')
  const [showInput,     setShowInput]    = useState(false)
  const [newItems,      setNewItems]     = useState({})
  const [expandedList,  setExpandedList] = useState(null)
  const [loading,       setLoading]      = useState(false)
  const [toast,         setToast]        = useState(null)

  // ── Meal-plan modal state ─────────────────────────────────────────────────
  const [showMealModal, setShowMealModal]   = useState(false)
  const [weekPlans,     setWeekPlans]       = useState([])   // flat plan list
  const [generating,    setGenerating]      = useState(false)
  const [plansLoading,  setPlansLoading]    = useState(false)
  const [listTitle,     setListTitle]       = useState('')
  const [preview,       setPreview]         = useState(null)  // { title, ingredients[] }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch lists ───────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listsService.getLists(group?.id)
      const full = await Promise.all(data.map(l => listsService.getList(l.id, group?.id)))
      setListes(full)
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur de chargement', 'error')
    } finally { setLoading(false) }
  }, [group?.id])

  useEffect(() => { refresh() }, [refresh])

  // ── Open meal modal: fetch this week's plans ──────────────────────────────
  const openMealModal = async () => {
    setShowMealModal(true)
    setPreview(null)
    setListTitle(`Courses semaine du ${WEEK_DATES[0]}`)
    setPlansLoading(true)
    try {
      const plans = await mealsService.getMealPlans(group?.id)
      // Filter to this week only
      const thisWeek = plans.filter(p => WEEK_DATES.includes(p.date))
      setWeekPlans(thisWeek)
    } catch {
      setWeekPlans([])
    } finally { setPlansLoading(false) }
  }

  // ── Preview ingredients from selected plans ───────────────────────────────
  const previewIngredients = async (selectedPlans) => {
    if (selectedPlans.length === 0) { setPreview(null); return }
    setGenerating(true)
    try {
      const recipeIds = [...new Set(selectedPlans.map(p => p.recipe_id))]
      const result = await mealsService.generateShoppingList(recipeIds)
      setPreview({ ingredients: result.ingredients })
    } catch {
      setPreview(null)
    } finally { setGenerating(false) }
  }

  // ── Selected plans (checkboxes in modal) ──────────────────────────────────
  const [selectedPlanIds, setSelectedPlanIds] = useState(new Set())

  const togglePlan = (planId) => {
    setSelectedPlanIds(prev => {
      const next = new Set(prev)
      next.has(planId) ? next.delete(planId) : next.add(planId)
      // Trigger preview update
      const selected = weekPlans.filter(p => next.has(p.id))
      previewIngredients(selected)
      return next
    })
  }

  const selectAll = () => {
    const all = new Set(weekPlans.map(p => p.id))
    setSelectedPlanIds(all)
    previewIngredients(weekPlans)
  }

  // ── Create the shopping list from ingredients ─────────────────────────────
  const createFromMeals = async () => {
    if (!preview || preview.ingredients.length === 0) return
    if (!listTitle.trim()) return

    setGenerating(true)
    try {
      // 1. Create the list
      const newList = await listsService.createList(listTitle.trim(), group?.id)

      // 2. Add every ingredient as an item
      await Promise.all(
        preview.ingredients.map(ing =>
          listsService.addItem(newList.id,
            { name: ing.name, quantity: ing.quantity, unit: ing.unit },
            group?.id
          )
        )
      )

      await refresh()
      setShowMealModal(false)
      setSelectedPlanIds(new Set())
      setPreview(null)
      showToast(`Liste "${listTitle}" créée avec ${preview.ingredients.length} articles !`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la création', 'error')
    } finally { setGenerating(false) }
  }

  // ── Standard list operations ──────────────────────────────────────────────
  const creerListe = async () => {
    if (!nouvelleListe.trim()) return
    try {
      await listsService.createList(nouvelleListe.trim(), group?.id)
      setNouvelleListe(''); setShowInput(false)
      await refresh()
      showToast(`Liste "${nouvelleListe}" créée !`)
    } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error') }
  }

  const supprimerListe = async (id, title) => {
    try {
      await listsService.deleteList(id); await refresh()
      showToast(`Liste "${title}" supprimée`, 'error')
    } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error') }
  }

  const ajouterItem = async (listeId) => {
    const text = newItems[listeId]
    if (!text?.trim()) return
    try {
      await listsService.addItem(listeId, { name: text.trim() }, group?.id)
      setNewItems(p => ({ ...p, [listeId]: '' }))
      await refresh()
      showToast(`"${text}" ajouté`)
    } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error') }
  }

  const toggleItem = async (listeId, item) => {
    try {
      await listsService.updateItem(listeId, item.id, { checked: !item.checked }, group?.id)
      await refresh()
    } catch { showToast('Erreur', 'error') }
  }

  const supprimerItem = async (listeId, itemId, name) => {
    try {
      await listsService.deleteItem(listeId, itemId, group?.id); await refresh()
      showToast(`"${name}" supprimé`, 'error')
    } catch { showToast('Erreur', 'error') }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalItems  = listes.reduce((a, l) => a + (l.items?.length || 0), 0)
  const totalCoches = listes.reduce((a, l) => a + (l.items?.filter(i => i.checked).length || 0), 0)
  const ownedLists  = listes.filter(l => l.is_owner)
  const sharedLists = listes.filter(l => !l.is_owner)

  // ── List card renderer ────────────────────────────────────────────────────
  const renderCard = (l) => {
    const items   = l.items || []
    const checked = items.filter(i => i.checked).length
    const pct     = items.length > 0 ? (checked / items.length) * 100 : 0
    const isExp   = expandedList === l.id
    return (
      <div key={l.id} style={{ ...sc.listeCard, borderLeft: !l.is_owner ? '3px solid #E8580C' : 'none' }}>
        <div style={sc.listeHeader}>
          <div style={sc.listeLeft}>
            <div style={sc.listeName}>{l.title}</div>
            <div style={sc.listeMeta}>
              {!l.is_owner
                ? <span style={sc.badgeShared}>Partagée avec le groupe</span>
                : <span style={sc.badgeMine}>Ma liste</span>}
            </div>
          </div>
          <div style={sc.listeActions}>
            <button style={sc.expandBtn} onClick={() => setExpandedList(isExp ? null : l.id)}>
              {isExp ? '▲' : '▼'}
            </button>
            {l.is_owner && (
              <button style={sc.deleteBtn} onClick={() => supprimerListe(l.id, l.title)}>✕</button>
            )}
          </div>
        </div>

        <div style={sc.progressWrap}>
          <div style={{ ...sc.progressBar, width: `${pct}%`, background: l.is_owner ? '#1D9E75' : '#E8580C' }} />
        </div>
        <div style={sc.progressLabel}>
          {checked}/{items.length} articles cochés
          {pct === 100 && items.length > 0 && <span style={{ color: '#1D9E75', fontWeight: '600' }}> ✓ Complète !</span>}
        </div>

        <div style={sc.itemsList}>
          {items.slice(0, isExp ? undefined : 4).map(item => (
            <div key={item.id} style={sc.itemRow}>
              <button
                style={{ ...sc.checkbox, ...(item.checked ? sc.checkboxChecked : {}) }}
                onClick={() => toggleItem(l.id, item)}>
                {item.checked ? '✓' : ''}
              </button>
              <span style={{ ...sc.itemText, textDecoration: item.checked ? 'line-through' : 'none',
                color: item.checked ? '#c4c2b8' : '#1a1a18' }}>
                {item.name}
              </span>
              {item.quantity && (
                <span style={sc.itemQty}>{item.quantity} {item.unit !== 'unit' ? item.unit : ''}</span>
              )}
              {isExp && (
                <button style={sc.deleteItemBtn}
                  onClick={() => supprimerItem(l.id, item.id, item.name)}>✕</button>
              )}
            </div>
          ))}
          {!isExp && items.length > 4 && (
            <div style={sc.moreItems} onClick={() => setExpandedList(l.id)}>+{items.length - 4} autres</div>
          )}
          {items.length === 0 && <div style={sc.emptyItems}>Aucun article</div>}
        </div>

        {isExp && (
          <div style={sc.addItemRow}>
            <input value={newItems[l.id] || ''}
              onChange={e => setNewItems(p => ({ ...p, [l.id]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && ajouterItem(l.id)}
              placeholder="Ajouter un article..." style={sc.itemInput} />
            <button onClick={() => ajouterItem(l.id)} style={sc.addBtn2}>+</button>
          </div>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.shell}>
      <Sidebar />
      <div style={s.bgWrap}>
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=90" alt="bg" style={s.bgImg} />
        <div style={s.bgOverlay} />
      </div>

      <div style={s.main}>
        <div style={s.topbar}>
          <span style={s.topbarTitle}>
            Listes de courses {group && <span style={s.groupTag}>· {group.name}</span>}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* ← NEW BUTTON */}
            <button style={s.mealBtn} onClick={openMealModal}>
              🍽️ Générer depuis les repas
            </button>
            <button style={s.addBtn} onClick={() => setShowInput(true)}>+ Nouvelle liste</button>
          </div>
        </div>

        <div style={s.content}>
          <div style={s.statsRow}>
            {[
              { label: 'Listes du groupe', value: listes.length,     color: '#E8580C', icon: '☰' },
              { label: 'Mes listes',        value: ownedLists.length, color: '#7F77DD', icon: '◉' },
              { label: 'Articles total',    value: totalItems,        color: '#1D9E75', icon: '◈' },
              { label: 'Articles cochés',   value: totalCoches,       color: '#EF9F27', icon: '✓' },
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <div style={{ ...s.statAccent, background: stat.color }} />
                <div style={s.statTop}>
                  <span style={{ color: stat.color, fontSize: '18px' }}>{stat.icon}</span>
                  <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
                </div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {!group && (
            <div style={s.noGroupBanner}>
              Rejoignez un groupe pour partager vos listes avec d'autres membres
            </div>
          )}

          {loading && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              Chargement...
            </div>
          )}

          {showInput && (
            <div style={s.newListCard}>
              <div style={s.newListTitle}>
                Nouvelle liste {group ? `— partagée avec ${group.name}` : ''}
              </div>
              <div style={s.newListRow}>
                <input value={nouvelleListe}
                  onChange={e => setNouvelleListe(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && creerListe()}
                  placeholder="Ex: Courses du weekend..." style={s.newListInput} autoFocus />
                <button onClick={creerListe} style={s.btnCreate}>Créer</button>
                <button onClick={() => { setShowInput(false); setNouvelleListe('') }}
                  style={s.btnCancelSmall}>✕</button>
              </div>
            </div>
          )}

          {listes.length > 0 && (
            <div style={s.grid}>{listes.map(l => renderCard(l))}</div>
          )}

          {!loading && listes.length === 0 && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🛒</div>
              <div style={s.emptyTitle}>Aucune liste</div>
              <div style={s.emptySub}>
                Créez une liste manuellement ou générez-en une depuis vos repas planifiés
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={s.emptyBtn} onClick={() => setShowInput(true)}>+ Créer une liste</button>
                <button style={{ ...s.emptyBtn, background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
                  onClick={openMealModal}>🍽️ Depuis les repas</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Meal plan modal ─────────────────────────────────────────────── */}
      {showMealModal && (
        <div style={s.overlay} onClick={() => setShowMealModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>🍽️ Générer depuis les repas</div>
                <div style={s.modalSub}>Sélectionnez les repas de la semaine pour créer la liste d'ingrédients</div>
              </div>
              <button style={s.modalClose} onClick={() => setShowMealModal(false)}>✕</button>
            </div>

            {/* List title input */}
            <div style={s.modalSection}>
              <label style={s.fieldLabel}>Nom de la liste à créer</label>
              <input value={listTitle} onChange={e => setListTitle(e.target.value)}
                style={s.fieldInput} placeholder="Ex: Courses semaine..." />
            </div>

            {/* Meal plan checkboxes */}
            <div style={s.modalSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={s.fieldLabel}>Repas de la semaine</label>
                {weekPlans.length > 0 && (
                  <button style={s.selectAllBtn} onClick={selectAll}>Tout sélectionner</button>
                )}
              </div>

              {plansLoading && (
                <div style={{ color: '#aaa89e', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                  Chargement des repas...
                </div>
              )}

              {!plansLoading && weekPlans.length === 0 && (
                <div style={s.noPlans}>
                  <span style={{ fontSize: '28px' }}>📅</span>
                  <div>Aucun repas planifié cette semaine</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Planifiez des repas dans la page Repas d'abord
                  </div>
                </div>
              )}

              <div style={s.planList}>
                {weekPlans.map(plan => {
                  const selected = selectedPlanIds.has(plan.id)
                  return (
                    <div key={plan.id}
                      style={{ ...s.planRow, ...(selected ? s.planRowSel : {}) }}
                      onClick={() => togglePlan(plan.id)}>
                      <div style={{ ...s.planCheck, ...(selected ? s.planCheckSel : {}) }}>
                        {selected && '✓'}
                      </div>
                      <div style={s.planInfo}>
                        <div style={s.planRecipe}>{plan.recipe_title}</div>
                        <div style={s.planMeta}>
                          <span style={s.planDate}>{plan.date}</span>
                          <span style={s.planDot}>·</span>
                          <span style={s.planMeal}>{MEAL_LABELS[plan.meal_type] || plan.meal_type}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '18px' }}>
                        {{ breakfast: '🌅', lunch: '☀️', dinner: '🌙' }[plan.meal_type]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ingredients preview */}
            {generating && (
              <div style={{ color: '#aaa89e', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
                Calcul des ingrédients...
              </div>
            )}

            {preview && preview.ingredients.length > 0 && (
              <div style={s.modalSection}>
                <label style={s.fieldLabel}>
                  Ingrédients à ajouter ({preview.ingredients.length})
                </label>
                <div style={s.ingredientGrid}>
                  {preview.ingredients.map((ing, i) => (
                    <div key={i} style={s.ingPill}>
                      <span style={s.ingName}>{ing.name}</span>
                      <span style={s.ingQty}>{ing.quantity} {ing.unit !== 'unit' ? ing.unit : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={s.modalFooter}>
              <button style={s.btnCancel} onClick={() => setShowMealModal(false)}>Annuler</button>
              <button
                style={{ ...s.btnGenerate,
                  opacity: (preview && preview.ingredients.length > 0 && listTitle.trim() && !generating) ? 1 : 0.5 }}
                disabled={!preview || preview.ingredients.length === 0 || !listTitle.trim() || generating}
                onClick={createFromMeals}>
                {generating ? 'Création...' : `✓ Créer la liste (${preview?.ingredients.length || 0} articles)`}
              </button>
            </div>

          </div>
        </div>
      )}

      {toast && (
        <div style={{ ...s.toast, background: toast.type === 'error' ? '#A32D2D' : '#1D9E75' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const s = {
  shell: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' },
  bgWrap: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  bgImg: { width: '100%', height: '100%', objectFit: 'cover' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.72) 0%, rgba(20,15,10,0.62) 100%)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 },
  topbar: { height: '52px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(255,255,255,0.12)' },
  topbarTitle: { fontSize: '15px', fontWeight: '600', color: '#ffffff' },
  groupTag: { color: '#E8580C', fontWeight: '400' },
  mealBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  addBtn: { padding: '8px 18px', background: '#E8580C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  content: { flex: 1, overflowY: 'auto', padding: '24px 28px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' },
  statCard: { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px', position: 'relative', overflow: 'hidden' },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px' },
  statTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', marginBottom: '4px' },
  statVal: { fontSize: '26px', fontWeight: '800' },
  statLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.7)' },
  noGroupBanner: { background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' },
  newListCard: { background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(232,88,12,0.5)', borderRadius: '14px', padding: '18px', marginBottom: '20px' },
  newListTitle: { fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '10px' },
  newListRow: { display: 'flex', gap: '8px' },
  newListInput: { flex: 1, padding: '10px 14px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', outline: 'none', background: 'rgba(255,255,255,0.1)', color: '#ffffff' },
  btnCreate: { padding: '10px 20px', background: '#E8580C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnCancelSmall: { padding: '10px 14px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '56px', marginBottom: '16px' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' },
  emptyBtn: { padding: '12px 24px', background: '#E8580C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', color: '#fff', fontSize: '13px', fontWeight: '500', padding: '12px 20px', borderRadius: '10px', zIndex: 300 },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 24px 0' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#1a1a18', marginBottom: '4px' },
  modalSub: { fontSize: '13px', color: '#888780' },
  modalClose: { background: '#f5f5f0', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#888780', flexShrink: 0, marginLeft: '12px' },
  modalSection: { padding: '20px 24px 0' },
  fieldLabel: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#3d3d3a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' },
  fieldInput: { width: '100%', padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e0ddd5', borderRadius: '10px', outline: 'none', background: '#fafaf8', color: '#1a1a18', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' },
  selectAllBtn: { fontSize: '12px', color: '#E8580C', background: 'none', border: '0.5px solid #E8580C', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' },
  noPlans: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '24px', color: '#aaa89e', fontSize: '13px', textAlign: 'center', background: '#fafaf8', borderRadius: '12px' },
  planList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' },
  planRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '1.5px solid #f0ede6', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s' },
  planRowSel: { border: '1.5px solid #E8580C', background: '#FFF8F5' },
  planCheck: { width: '22px', height: '22px', borderRadius: '6px', border: '1.5px solid #e0ddd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', flexShrink: 0 },
  planCheckSel: { background: '#E8580C', border: '1.5px solid #E8580C' },
  planInfo: { flex: 1 },
  planRecipe: { fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '3px' },
  planMeta: { display: 'flex', alignItems: 'center', gap: '6px' },
  planDate: { fontSize: '11px', color: '#888780' },
  planDot: { fontSize: '11px', color: '#d3d1c7' },
  planMeal: { fontSize: '11px', color: '#888780' },
  ingredientGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '4px 0' },
  ingPill: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f5f0', border: '0.5px solid #e0ddd5', borderRadius: '20px', padding: '5px 12px' },
  ingName: { fontSize: '12px', fontWeight: '600', color: '#1a1a18' },
  ingQty: { fontSize: '11px', color: '#888780' },
  modalFooter: { display: 'flex', gap: '10px', padding: '20px 24px 24px', borderTop: '0.5px solid #f0ede6', marginTop: '20px' },
  btnCancel: { padding: '12px 20px', background: 'none', border: '0.5px solid #e0ddd5', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', color: '#888780' },
  btnGenerate: { flex: 1, padding: '12px', background: '#E8580C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
}
const sc = {
  listeCard: { background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' },
  listeHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' },
  listeLeft: { flex: 1 },
  listeName: { fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' },
  listeMeta: { display: 'flex', alignItems: 'center', gap: '8px' },
  badgeShared: { fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#FFF0E8', color: '#E8580C' },
  badgeMine: { fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#E6F7F1', color: '#0F6E56' },
  listeActions: { display: 'flex', gap: '4px' },
  expandBtn: { fontSize: '11px', color: '#aaa89e', background: '#f5f5f0', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' },
  deleteBtn: { fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' },
  progressWrap: { height: '4px', background: '#f0ede6', borderRadius: '10px', marginBottom: '6px', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: '10px', transition: 'width 0.3s' },
  progressLabel: { fontSize: '11px', color: '#aaa89e', marginBottom: '12px' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  checkbox: { width: '20px', height: '20px', borderRadius: '6px', border: '1.5px solid #e0ddd5', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 },
  checkboxChecked: { background: '#E8580C', border: '1.5px solid #E8580C' },
  itemText: { fontSize: '13px', flex: 1 },
  itemQty: { fontSize: '11px', color: '#aaa89e', background: '#f5f5f0', padding: '2px 6px', borderRadius: '6px' },
  deleteItemBtn: { fontSize: '10px', color: '#c4c2b8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' },
  moreItems: { fontSize: '12px', color: '#E8580C', cursor: 'pointer', fontStyle: 'italic' },
  emptyItems: { fontSize: '12px', color: '#c4c2b8', fontStyle: 'italic' },
  addItemRow: { display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '0.5px solid #f0ede6' },
  itemInput: { flex: 1, padding: '9px 14px', fontSize: '13px', border: '1.5px solid #e0ddd5', borderRadius: '8px', outline: 'none', background: '#fafaf8', color: '#1a1a18' },
  addBtn2: { width: '38px', height: '38px', background: '#E8580C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
}

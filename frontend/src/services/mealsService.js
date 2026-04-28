import api, { SERVICES } from './api'

const BASE = `${SERVICES.meals}/api`

const mealsService = {
  getRecipes: async (groupId) => {
    const url = groupId ? `${BASE}/recipes?group_id=${groupId}` : `${BASE}/recipes`
    const { data } = await api.get(url)
    return data
  },

  createRecipe: async (payload, groupId) => {
    const { data } = await api.post(`${BASE}/recipes`, { ...payload, group_id: groupId || null })
    return data
  },

  getMealPlans: async (groupId) => {
    const url = groupId ? `${BASE}/meal-plans?group_id=${groupId}` : `${BASE}/meal-plans`
    const { data } = await api.get(url)
    return data
  },

  planMeal: async ({ date, meal_type, recipe_id, group_id }) => {
    const { data } = await api.post(`${BASE}/meal-plans`,
      { date, meal_type, recipe_id, group_id: group_id || null })
    return data
  },

  deleteMealPlan: async (planId) => {
    const { data } = await api.delete(`${BASE}/meal-plans/${planId}`)
    return data
  },

  generateShoppingList: async (recipeIds) => {
    const { data } = await api.post(`${BASE}/generate-shopping-list`, { recipe_ids: recipeIds })
    return data
  },
}

export default mealsService

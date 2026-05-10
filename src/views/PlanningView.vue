<script setup lang="ts">
import { computed, ref } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal.vue'
import { storeToRefs } from 'pinia'
import { usePlanningStore } from '@/stores/planningStore'
import { useUiStore } from '@/stores/uiStore'
import type { RecipeWithPrice } from '@/types/recipe'

const planningStore = usePlanningStore()
const { selectedRecipes, totalPrice, weekRange } = storeToRefs(planningStore)
const { isDone, isSelected, markAsDone, toggleRecipe, clearPlanning } = planningStore

const uiStore = useUiStore()
const { notify } = uiStore

const detailRecipe = ref<RecipeWithPrice | null>(null)

// 7-day strip for current week
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const weekDates = computed(() => {
  const today = new Date()
  const day = today.getDay() || 7
  const mon = new Date(today)
  mon.setDate(today.getDate() - day + 1)
  return DAYS.map((short, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return { short, date: d.getDate().toString(), month: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })
})

const totalCookTime = computed(() => {
  const mins = selectedRecipes.value.reduce((acc, r) => acc + (r.cookTime ?? 0), 0)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}min`
})

function openDetail(recipe: RecipeWithPrice): void { detailRecipe.value = recipe }

function handleRemove(recipe: RecipeWithPrice): void {
  toggleRecipe(recipe.id)
  notify(`"${recipe.title}" retiré du menu`)
}

function handleModalToggle(): void {
  if (!detailRecipe.value) return
  toggleRecipe(detailRecipe.value.id)
  detailRecipe.value = null
}

const CARD_TONES = ['', 'tomato', '', 'ochre', '', '', 'mute']
</script>

<template>
  <div class="planning fade-in" data-testid="planning-view">

    <!-- Header -->
    <div class="planning__header">
      <div>
        <h1 class="kb-h1">Menu <span class="roman">de la semaine.</span></h1>
        <p class="planning__sub">
          {{ selectedRecipes.length > 0
            ? `${selectedRecipes.length} plat${selectedRecipes.length > 1 ? 's' : ''} · ${totalCookTime} de cuisine · estimé ${totalPrice.toFixed(2)} €`
            : 'Aucun plat prévu pour cette semaine.' }}
        </p>
      </div>
      <div class="planning__actions">
        <button v-if="selectedRecipes.length" class="btn-ghost-line" @click="clearPlanning">
          <KuboIcon name="trash-2" :size="13" />Vider
        </button>
        <button class="btn-sage" @click="uiStore.navTo('catalog')">
          <KuboIcon name="plus" :size="13" />Ajouter
        </button>
      </div>
    </div>

    <!-- 7-day strip -->
    <div class="planning__week-strip">
      <div
        v-for="(d, i) in weekDates"
        :key="d.short"
        :class="['planning__day', { 'planning__day--filled': i < selectedRecipes.length }]"
      >
        <div class="planning__day-short">{{ d.short }}</div>
        <div class="planning__day-num">{{ d.date }}</div>
        <div class="planning__day-meta">{{ d.month }}</div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!selectedRecipes.length" class="planning__empty">
      <div class="planning__empty-icon">
        <KuboIcon name="calendar" :size="32" />
      </div>
      <h2 class="planning__empty-title">Menu vide cette semaine</h2>
      <p class="planning__empty-hint">Parcourez le catalogue et ajoutez des recettes pour composer votre menu.</p>
      <button class="btn-sage" style="margin-top: 8px;" @click="uiStore.navTo('catalog')">
        <KuboIcon name="search" :size="14" />Parcourir le catalogue
      </button>
    </div>

    <!-- Recipe bento grid -->
    <div v-else class="planning__grid" data-testid="planning-grid">
      <div
        v-for="(recipe, idx) in selectedRecipes"
        :key="recipe.id"
        :class="['planning__card', `planning__card--${CARD_TONES[idx % CARD_TONES.length] || 'default'}`]"
      >
        <div class="planning__card-header">
          <span class="planning__card-title">{{ recipe.title }}</span>
          <span class="planning__card-meta">{{ weekDates[idx]?.date ?? '' }} {{ weekDates[idx]?.month ?? '' }}</span>
        </div>

        <!-- Recipe info -->
        <div class="planning__card-body">
          <div class="planning__recipe-thumb">
            <KuboIcon name="utensils" :size="22" />
          </div>
          <div class="planning__recipe-info">
            <div class="planning__recipe-name">{{ recipe.title }}</div>
            <div class="planning__recipe-meta">
              <span>{{ recipe.cookTime ?? '?' }}M</span>
              <span>·</span>
              <span>{{ Math.round(recipe.prot * 4 + recipe.carb * 4 + recipe.fat * 9) || '?' }} KCAL</span>
            </div>
          </div>
          <div class="planning__card-actions">
            <button
              :class="['planning__action-btn', { 'planning__action-btn--done': isDone(recipe.id) }]"
              :title="isDone(recipe.id) ? 'Cuisinée' : 'Marquer cuisinée'"
              @click="markAsDone(recipe.id)"
            >
              <KuboIcon name="check" :size="12" />
            </button>
            <button
              class="planning__action-btn planning__action-btn--remove"
              title="Retirer"
              @click="handleRemove(recipe)"
            >
              <KuboIcon name="trash-2" :size="11" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <RecipeDetailModal
      :recipe="detailRecipe"
      :selected="detailRecipe ? isSelected(detailRecipe.id) : false"
      @close="detailRecipe = null"
      @toggle="handleModalToggle"
    />
  </div>
</template>

<style scoped>
.planning {
  padding: 30px 36px 40px;
}

.planning__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
}
.planning__sub {
  font-size: 14px;
  color: var(--kubo-text-muted);
  margin-top: 8px;
  line-height: 1.5;
}
.planning__actions {
  display: flex;
  gap: 10px;
}

/* Buttons */
.btn-sage {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--kubo-green);
  color: #fffdf7;
  border: none;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-base);
  transition: filter var(--transition-base);
}
.btn-sage:hover { filter: brightness(1.08); }

.btn-ghost-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  color: var(--kubo-text);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-base);
  transition: border-color var(--transition-base);
}
.btn-ghost-line:hover { border-color: var(--kubo-text-muted); }

/* Week strip */
.planning__week-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.planning__day {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-md);
  padding: 14px;
  text-align: center;
}
.planning__day--filled {
  background: var(--kubo-green);
  border-color: transparent;
  color: #fffdf7;
}
.planning__day-short {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: inherit;
  opacity: .65;
}
.planning__day-num {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 30px;
  letter-spacing: -1px;
  line-height: 1;
  margin-top: 4px;
}
.planning__day-meta {
  font-size: 11px;
  opacity: .65;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-weight: 600;
}

/* Empty */
.planning__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
}
.planning__empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-2xl);
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}
.planning__empty-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: -0.4px;
  color: var(--kubo-text);
}
.planning__empty-hint {
  font-size: 13.5px;
  color: var(--kubo-text-muted);
  max-width: 320px;
  line-height: 1.55;
}

/* Recipe grid */
.planning__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding-bottom: 40px;
}
@media (max-width: 900px) {
  .planning__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .planning__grid { grid-template-columns: 1fr; }
}

.planning__card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: var(--shadow-card);
}
.planning__card--tomato { background: var(--kubo-tomato-soft); border-color: transparent; }
.planning__card--ochre  { background: var(--kubo-ochre-soft);  border-color: transparent; }
.planning__card--mute   { background: var(--kubo-bg-2, var(--kubo-surface-mute)); border-color: transparent; }

.planning__card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.planning__card-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.4px;
  color: var(--kubo-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}
.planning__card-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--kubo-text-faint);
  font-weight: 600;
  flex-shrink: 0;
}

.planning__card-body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--kubo-border);
}
.planning__recipe-thumb {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--kubo-green-light);
  color: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.planning__recipe-info {
  flex: 1;
  min-width: 0;
}
.planning__recipe-name {
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--kubo-text);
}
.planning__recipe-meta {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--kubo-text-muted);
  font-weight: 600;
  letter-spacing: .05em;
}

.planning__card-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.planning__action-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  color: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}
.planning__action-btn--done {
  background: var(--kubo-green);
  border-color: var(--kubo-green);
  color: #fff;
}
.planning__action-btn--remove {
  color: var(--kubo-text-faint);
}
.planning__action-btn--remove:hover {
  background: var(--kubo-tomato-soft);
  border-color: var(--kubo-tomato);
  color: var(--kubo-tomato-deep);
}
</style>

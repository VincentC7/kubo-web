<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Chart,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import DashboardSeasonSection from '@/components/dashboard/DashboardSeasonSection.vue'
import { storeToRefs } from 'pinia'
import { usePlanningStore } from '@/stores/planningStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { useSeasonStore } from '@/stores/seasonStore'

const planningStore = usePlanningStore()
const { selectedRecipes, doneRecipes, nutritionTotals, totalPrice, avgPrice } =
  storeToRefs(planningStore)
const { isDone } = planningStore

const userStore = useUserStore()
const { mealsGoal, viewMode } = storeToRefs(userStore)
const { switchViewMode } = userStore

const uiStore = useUiStore()
const { navTo } = uiStore

const seasonStore = useSeasonStore()

const hasData = computed(() => selectedRecipes.value.length > 0)

// Charts
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
const budgetCanvas = ref<HTMLCanvasElement | null>(null)
let budgetChartInstance: Chart | null = null

const macroSum = computed(
  () =>
    (nutritionTotals.value?.prot ?? 0) +
      (nutritionTotals.value?.fat ?? 0) +
      (nutritionTotals.value?.carb ?? 0) || 1,
)
const protPct = computed(() => Math.round(((nutritionTotals.value?.prot ?? 0) / macroSum.value) * 100))
const fatPct  = computed(() => Math.round(((nutritionTotals.value?.fat  ?? 0) / macroSum.value) * 100))
const carbPct = computed(() => Math.round(((nutritionTotals.value?.carb ?? 0) / macroSum.value) * 100))

const dashProgress = computed(() => {
  if (!mealsGoal.value) return 0
  return Math.min(100, Math.round((doneRecipes.value.length / mealsGoal.value) * 100))
})

const avgKcal = computed(() => {
  if (!selectedRecipes.value.length) return 0
  // mock : sum prot*4 + carb*4 + fat*9 per recipe
  const total = selectedRecipes.value.reduce((acc, r) => acc + (r.prot * 4 + r.carb * 4 + r.fat * 9), 0)
  return Math.round(total / selectedRecipes.value.length)
})

const totalCookTime = computed(() => {
  const mins = selectedRecipes.value.reduce((acc, r) => acc + (r.cookTime ?? 0), 0)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { h, m }
})

Chart.register(DoughnutController, ArcElement, BarController, BarElement, CategoryScale, LinearScale, Tooltip)

let renderChartPending = false
async function renderChart() {
  if (renderChartPending) return
  renderChartPending = true
  await nextTick()
  renderChartPending = false
  if (!chartCanvas.value) return

  const rawData = [nutritionTotals.value?.prot ?? 0, nutritionTotals.value?.fat ?? 0, nutritionTotals.value?.carb ?? 0]
  const hasValues = rawData.some((v) => v > 0)
  const data = hasValues ? rawData : [1]
  const colors = hasValues ? ['var(--kubo-blue)', 'var(--kubo-tomato)', 'var(--kubo-green)'] : ['var(--kubo-border)']

  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
  chartInstance = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: hasValues ? ['Protéines', 'Lipides', 'Glucides'] : ['—'],
      datasets: [{ data, backgroundColor: colors, borderWidth: 0, borderRadius: hasValues ? 4 : 0, spacing: hasValues ? 3 : 0 }],
    },
    options: {
      cutout: '78%',
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: hasValues } },
    },
  })
}

function getBudgetData() {
  if (viewMode.value === 'week') return { labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'], data: [12, 18, 4, 7, 9, 5, 0] }
  if (viewMode.value === 'month') return { labels: ['S1', 'S2', 'S3', 'S4'], data: [85, 120, 95, 110] }
  return { labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], data: [450, 480, 520, 410, 390, 510, 600, 580, 420, 410, 380, 550] }
}

function renderBudgetChart() {
  if (!budgetCanvas.value) return
  if (budgetChartInstance) { budgetChartInstance.destroy(); budgetChartInstance = null }
  const { labels, data } = getBudgetData()
  budgetChartInstance = new Chart(budgetCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Budget (€)', data, backgroundColor: 'var(--kubo-green)', borderRadius: 6, barThickness: viewMode.value === 'year' ? 14 : 28 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { display: false },
        x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold', family: 'JetBrains Mono' }, color: 'var(--kubo-text-faint)' } },
      },
      plugins: { legend: { display: false } },
    },
  })
}

watch([selectedRecipes, nutritionTotals], renderChart, { deep: true })
watch(viewMode, renderBudgetChart)

onMounted(() => {
  chartInstance = null
  budgetChartInstance = null
  renderChart()
  renderBudgetChart()
  seasonStore.init()
})
onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
  budgetChartInstance?.destroy()
  budgetChartInstance = null
})
</script>

<template>
  <div class="dash fade-in" data-testid="dashboard-view">

    <!-- Header -->
    <div class="dash__header">
      <div>
        <h1 class="kb-h1">Synthèse <span class="roman">de la semaine.</span></h1>
        <p class="dash__sub">
          {{ hasData
            ? `${selectedRecipes.length} plat${selectedRecipes.length > 1 ? 's' : ''} au programme · ${doneRecipes.length} réalisé${doneRecipes.length > 1 ? 's' : ''}`
            : 'Commencez par ajouter des recettes à votre menu.' }}
        </p>
      </div>
      <div class="dash__header-actions">
        <button class="btn-ghost" @click="navTo('catalog')">
          <KuboIcon name="plus" :size="13" />Ajouter un plat
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!hasData" class="dash__empty">
      <div class="dash__empty-icon">
        <KuboIcon name="utensils" :size="48" />
      </div>
      <h2 class="dash__empty-title">Votre semaine est vide</h2>
      <p class="dash__empty-desc">Parcourez le catalogue pour planifier vos repas et voir les statistiques ici.</p>
      <button class="btn-sage" @click="navTo('catalog')">
        <KuboIcon name="search" :size="14" />Parcourir les recettes
      </button>
    </div>

    <!-- Bento grid -->
    <div v-else class="dash__bento">

      <!-- Total dépense — sauge -->
      <div class="bento-card bento-sage bento-col-5 bento-row-2">
        <div class="kb-eyebrow" style="color: rgba(255,253,247,.65)">Total dépense · semaine</div>
        <div class="bento-big-num">
          {{ totalPrice.toFixed(2) }}<span class="bento-big-unit">€</span>
        </div>
        <div style="font-size: 13px; opacity: .9; line-height: 1.5; margin-top: 8px;">
          Moyenne <b>{{ avgPrice.toFixed(2) }} €</b> / repas · {{ selectedRecipes.length }} plat{{ selectedRecipes.length > 1 ? 's' : '' }}
        </div>
        <div style="margin-top: auto;">
          <div class="bento-progress-track">
            <div class="bento-progress-fill" :style="{ width: dashProgress + '%' }" />
          </div>
          <div class="bento-progress-labels">
            <span>{{ doneRecipes.length }} / {{ mealsGoal }} cuisinés</span>
            <span style="font-family: var(--font-mono); font-size: 10px;">{{ dashProgress }}%</span>
          </div>
        </div>
      </div>

      <!-- Nutrition donut -->
      <div class="bento-card bento-col-4 bento-row-2">
        <div class="kb-eyebrow" style="color: var(--kubo-green)">Nutrition</div>
        <div class="dash__donut-body">
          <div class="dash__donut-wrap">
            <canvas ref="chartCanvas" width="130" height="130" />
          </div>
          <div class="dash__macro-list">
            <div class="dash__macro-row">
              <span class="dash__macro-dot" style="background: var(--kubo-blue)" />
              <span class="dash__macro-label">Protéines</span>
              <span class="dash__macro-val">{{ protPct }}<small>%</small></span>
            </div>
            <div class="dash__macro-row">
              <span class="dash__macro-dot" style="background: var(--kubo-tomato)" />
              <span class="dash__macro-label">Lipides</span>
              <span class="dash__macro-val">{{ fatPct }}<small>%</small></span>
            </div>
            <div class="dash__macro-row">
              <span class="dash__macro-dot" style="background: var(--kubo-green)" />
              <span class="dash__macro-label">Glucides</span>
              <span class="dash__macro-val">{{ carbPct }}<small>%</small></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Calories moy — tomate -->
      <div class="bento-card bento-tomato bento-col-3">
        <div class="kb-eyebrow" style="color: var(--kubo-tomato-deep)">Calories moy.</div>
        <div class="bento-kpi">{{ avgKcal > 0 ? avgKcal : '—' }}<span class="bento-kpi-unit">kcal</span></div>
      </div>

      <!-- Temps cuisine -->
      <div class="bento-card bento-col-3">
        <div class="kb-eyebrow">Temps cuisine</div>
        <div class="bento-kpi">
          {{ totalCookTime.h > 0 ? totalCookTime.h + 'h' : '' }}{{ totalCookTime.m > 0 ? totalCookTime.m : (totalCookTime.h === 0 ? '—' : '') }}<span v-if="totalCookTime.m > 0 || totalCookTime.h > 0" class="bento-kpi-unit">min</span>
        </div>
      </div>

      <!-- À la carte cette semaine -->
      <div class="bento-card bento-col-7 bento-row-2">
        <div class="dash__section-header">
          <span class="dash__section-title">À la carte cette semaine</span>
          <span class="tag-sage">{{ selectedRecipes.length }} plat{{ selectedRecipes.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="dash__recipes-grid">
          <div
            v-for="recipe in selectedRecipes.slice(0, 5)"
            :key="recipe.id"
            :class="['dash__recipe-item', { 'dash__recipe-item--done': isDone(recipe.id) }]"
            @click="navTo('planning')"
          >
            <div class="dash__recipe-thumb">
              <KuboIcon name="utensils" :size="20" />
            </div>
            <div class="dash__recipe-name">{{ recipe.title }}</div>
            <div class="dash__recipe-meta">{{ recipe.cookTime ?? '?' }}M</div>
          </div>
        </div>
      </div>

      <!-- Évolution budget -->
      <div class="bento-card bento-col-5 bento-row-2">
        <div class="dash__section-header">
          <span class="dash__section-title">Évolution du budget</span>
          <div class="dash__view-tabs">
            <button
              v-for="m in ['week', 'month', 'year']"
              :key="m"
              :class="['dash__view-tab', { 'dash__view-tab--on': viewMode === m }]"
              @click="switchViewMode(m)"
            >{{ m === 'week' ? 'Sem.' : m === 'month' ? 'Mois' : 'An.' }}</button>
          </div>
        </div>
        <div class="dash__budget-chart">
          <canvas ref="budgetCanvas" />
        </div>
        <div class="dash__budget-footer">
          <span>Moy. <b>{{ avgPrice.toFixed(2) }} €</b> / repas</span>
        </div>
      </div>

      <!-- Suggestion fraîche — ochre (mock) -->
      <div class="bento-card bento-ochre bento-col-8 dash__suggestion">
        <div class="dash__suggestion-icon">
          <KuboIcon name="sparkles" :size="20" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div class="dash__suggestion-title">Suggestion pour compléter la semaine</div>
          <div class="dash__suggestion-desc">Basé sur vos recettes actuelles, pensez à équilibrer avec des légumes de saison.</div>
        </div>
        <button class="btn-ink btn-sm" @click="navTo('catalog')">Voir →</button>
      </div>

      <!-- Alerte inventaire -->
      <div class="bento-card bento-col-4 dash__alert" @click="navTo('inventory')">
        <div class="dash__alert-icon">
          <KuboIcon name="alert-triangle" :size="18" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div class="dash__alert-title">Vérifiez votre inventaire</div>
          <div class="dash__alert-sub">Des ingrédients pourraient expirer bientôt</div>
        </div>
        <KuboIcon name="chevron-right" :size="16" />
      </div>
    </div>

    <!-- Saison -->
    <DashboardSeasonSection />
  </div>
</template>

<style scoped>
.dash {
  padding: 30px 36px 40px;
}

/* Header */
.dash__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 22px;
  flex-wrap: wrap;
  gap: 12px;
}
.dash__sub {
  font-size: 14px;
  color: var(--kubo-text-muted);
  margin-top: 8px;
  line-height: 1.5;
}
.dash__header-actions {
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

.btn-ghost {
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
  transition: background var(--transition-base);
}
.btn-ghost:hover { background: var(--kubo-surface-mute); }

.btn-ink {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--kubo-text);
  color: var(--kubo-surface);
  border: none;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-base);
}
.btn-sm { padding: 7px 12px; font-size: 12px; }

/* Tags */
.tag-sage {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--kubo-green-light);
  color: var(--kubo-sage-deep);
  font-size: 10.5px;
  font-weight: 700;
}

/* Empty */
.dash__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  text-align: center;
}
.dash__empty-icon {
  width: 100px;
  height: 100px;
  border-radius: 32px;
  background: var(--kubo-green-light);
  color: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dash__empty-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 28px;
  letter-spacing: -0.5px;
  color: var(--kubo-text);
}
.dash__empty-desc {
  max-width: 400px;
  font-size: 14px;
  color: var(--kubo-text-muted);
  line-height: 1.6;
}

/* Bento grid */
.dash__bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: 110px;
  gap: 14px;
  margin-bottom: 32px;
}

.bento-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: 22px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Column spans */
.bento-col-3 { grid-column: span 3; }
.bento-col-4 { grid-column: span 4; }
.bento-col-5 { grid-column: span 5; }
.bento-col-7 { grid-column: span 7; }
.bento-col-8 { grid-column: span 8; }
.bento-col-12 { grid-column: span 12; }
.bento-row-2 { grid-row: span 2; }

/* Color variants */
.bento-sage {
  background: var(--kubo-green);
  color: #fffdf7;
  border-color: transparent;
}
.bento-tomato {
  background: var(--kubo-tomato-soft);
  border-color: transparent;
}
.bento-ochre {
  background: var(--kubo-ochre-soft);
  border-color: transparent;
}

/* Big number */
.bento-big-num {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 72px;
  letter-spacing: -3px;
  line-height: 1;
  margin-top: 10px;
}
.bento-big-unit {
  font-style: normal;
  font-size: 32px;
  opacity: .55;
  margin-left: 4px;
}

/* Progress */
.bento-progress-track {
  height: 5px;
  background: rgba(255,253,247,.18);
  border-radius: 3px;
}
.bento-progress-fill {
  height: 100%;
  background: var(--kubo-tomato);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.bento-progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  letter-spacing: .05em;
  opacity: .7;
  text-transform: uppercase;
}

/* KPI */
.bento-kpi {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 38px;
  letter-spacing: -1px;
  color: var(--kubo-text);
  margin-top: 6px;
  line-height: 1;
}
.bento-kpi-unit {
  font-style: normal;
  font-size: 13px;
  color: var(--kubo-text-muted);
  margin-left: 6px;
  font-weight: 600;
}

/* Donut */
.dash__donut-body {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 14px;
  flex: 1;
}
.dash__donut-wrap {
  width: 130px;
  height: 130px;
  flex-shrink: 0;
}
.dash__donut-wrap canvas { width: 100% !important; height: 100% !important; }
.dash__macro-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dash__macro-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.dash__macro-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.dash__macro-label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--kubo-text);
}
.dash__macro-val {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 18px;
}
.dash__macro-val small { font-style: normal; font-size: 11px; opacity: .6; }

/* Section headers */
.dash__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.dash__section-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.4px;
  color: var(--kubo-text);
}

/* Recipes grid */
.dash__recipes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  flex: 1;
}
.dash__recipe-item {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dash__recipe-item--done .dash__recipe-thumb { opacity: .5; }
.dash__recipe-thumb {
  height: 80px;
  border-radius: var(--radius-md);
  background: var(--kubo-green-light);
  color: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter var(--transition-base);
}
.dash__recipe-item:hover .dash__recipe-thumb { filter: brightness(0.95); }
.dash__recipe-name {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--kubo-text);
  min-height: 28px;
}
.dash__recipe-meta {
  font-size: 10px;
  color: var(--kubo-text-faint);
  font-family: var(--font-mono);
  font-weight: 600;
}

/* View tabs */
.dash__view-tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--kubo-bg-2, var(--kubo-surface-mute));
  border-radius: var(--radius-pill);
}
.dash__view-tab {
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  cursor: pointer;
  font-family: var(--font-base);
  transition: all var(--transition-base);
}
.dash__view-tab--on {
  background: var(--kubo-surface);
  color: var(--kubo-text);
  box-shadow: var(--shadow-card);
}

/* Budget chart */
.dash__budget-chart {
  flex: 1;
  position: relative;
  min-height: 0;
}
.dash__budget-chart canvas { width: 100% !important; height: 100% !important; }
.dash__budget-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-top: 1px solid var(--kubo-border);
  padding-top: 10px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--kubo-text-muted);
}

/* Suggestion */
.dash__suggestion {
  flex-direction: row;
  align-items: center;
  gap: 18px;
}
.dash__suggestion-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--kubo-surface);
  color: var(--kubo-ochre);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dash__suggestion-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 16px;
  color: var(--kubo-text);
}
.dash__suggestion-desc {
  font-size: 12px;
  color: var(--kubo-text-muted);
  margin-top: 2px;
  line-height: 1.5;
}

/* Alert */
.dash__alert {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.dash__alert:hover { background: var(--kubo-surface-mute); }
.dash__alert-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--kubo-tomato-soft);
  color: var(--kubo-tomato-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dash__alert-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text);
}
.dash__alert-sub {
  font-size: 11px;
  color: var(--kubo-text-muted);
  margin-top: 2px;
}

@media (max-width: 1100px) {
  .dash__bento {
    grid-template-columns: repeat(6, 1fr);
  }
  .bento-col-5 { grid-column: span 6; }
  .bento-col-4 { grid-column: span 6; }
  .bento-col-3 { grid-column: span 3; }
  .bento-col-7 { grid-column: span 6; }
  .bento-col-8 { grid-column: span 6; }
  .bento-col-4.dash__alert { grid-column: span 6; }
  .dash__recipes-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>

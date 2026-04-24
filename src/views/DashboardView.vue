<script setup lang="ts">
/**
 * DashboardView — Vue tableau de bord nutritionnel + budget
 */
import { ref, computed, watch, onMounted } from 'vue'
import {
  Chart,
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import KuboCard from '@/components/ui/KuboCard.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboProgressBar from '@/components/ui/KuboProgressBar.vue'
import NutritionLegendItem from '@/components/recipes/NutritionLegendItem.vue'
import { storeToRefs } from 'pinia'
import { usePlanningStore } from '@/stores/planningStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { useSeasonStore } from '@/stores/seasonStore'
import { getSeasonImage } from '@/data/seasonImages'

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
const { fruits, legumes, loading: seasonLoading, currentMonth } = storeToRefs(seasonStore)

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]
const currentMonthName = computed(() => MONTH_NAMES[currentMonth.value - 1] ?? '')

function selectMonth(mois: number) {
  seasonStore.currentMonth = mois
  seasonStore.init(mois)
}

const hasData = computed(() => selectedRecipes.value.length > 0)

// Chart.js — Nutrition
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// Chart.js — Budget
const budgetCanvas = ref<HTMLCanvasElement | null>(null)
let budgetChartInstance: Chart | null = null

const macroSum = computed(
  () => nutritionTotals.value.prot + nutritionTotals.value.fat + nutritionTotals.value.carb || 1,
)
const protPct = computed(() => Math.round((nutritionTotals.value.prot / macroSum.value) * 100))
const fatPct = computed(() => Math.round((nutritionTotals.value.fat / macroSum.value) * 100))
const carbPct = computed(() => Math.round((nutritionTotals.value.carb / macroSum.value) * 100))

const dashProgress = computed(() => {
  if (!mealsGoal.value) return 0
  return Math.min(100, Math.round((doneRecipes.value.length / mealsGoal.value) * 100))
})

Chart.register(
  DoughnutController,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
)

async function renderChart() {
  if (!chartCanvas.value) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  chartInstance = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Protéines', 'Lipides', 'Glucides'],
      datasets: [
        {
          data: [nutritionTotals.value.prot, nutritionTotals.value.fat, nutritionTotals.value.carb],
          backgroundColor: ['#3B82F6', '#F97316', '#10B981'],
          borderWidth: 0,
          borderRadius: 10,
          spacing: 5,
        },
      ],
    },
    options: {
      cutout: '80%',
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  })
}

function getBudgetData() {
  // Données de démo — à remplacer par l'API
  if (viewMode.value === 'week') {
    return {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      data: [12, 19, 3, 5, 2, 3, 7],
      thickness: 30,
    }
  }
  if (viewMode.value === 'month') {
    return { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], data: [85, 120, 95, 110], thickness: 30 }
  }
  return {
    labels: [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc',
    ],
    data: [450, 480, 520, 410, 390, 510, 600, 580, 420, 410, 380, 550],
    thickness: 12,
  }
}

function renderBudgetChart() {
  if (!budgetCanvas.value) return
  if (budgetChartInstance) {
    budgetChartInstance.destroy()
    budgetChartInstance = null
  }
  const { labels, data, thickness } = getBudgetData()
  budgetChartInstance = new Chart(budgetCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Budget (€)',
          data,
          backgroundColor: '#00A35E',
          borderRadius: 8,
          barThickness: thickness,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { display: false },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' },
        },
      },
      plugins: { legend: { display: false } },
    },
  })
}

watch([selectedRecipes, nutritionTotals], renderChart, { deep: true })

watch(viewMode, () => {
  renderBudgetChart()
})

onMounted(() => {
  renderChart()
  renderBudgetChart()
  seasonStore.init()
})
</script>

<template>
  <div class="dashboard fade-in" data-testid="dashboard-view">
    <header class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Synthèse</h1>
        <p class="dashboard__sub">Votre équilibre culinaire hebdomadaire.</p>
      </div>
      <!-- View mode toggle -->
      <div class="dashboard__view-modes">
        <button
          v-for="mode in ['week', 'month', 'year']"
          :key="mode"
          :class="['dashboard__view-btn', { 'dashboard__view-btn--active': viewMode === mode }]"
          @click="switchViewMode(mode)"
        >
          {{ mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Année' }}
        </button>
      </div>
    </header>

    <!-- Empty state -->
    <div v-if="!hasData && viewMode === 'week'" class="dashboard__empty">
      <div class="dashboard__empty-icon">
        <KuboIcon name="chef-hat" :size="56" />
        <div class="dashboard__empty-icon-badge">
          <KuboIcon name="plus" :size="18" />
        </div>
      </div>
      <h2 class="dashboard__empty-title">Pas assez de données</h2>
      <p class="dashboard__empty-desc">
        Commencez par explorer le catalogue pour planifier vos repas et analyser vos besoins.
      </p>
      <KuboButton variant="primary" size="lg" @click="navTo('catalog')">
        <KuboIcon name="search" :size="18" />
        Parcourir les recettes
      </KuboButton>
    </div>

    <!-- Main content -->
    <div v-else class="dashboard__grid">
      <!-- Left column -->
      <div class="dashboard__left">
        <!-- Chart card — Nutrition -->
        <KuboCard rounded="3xl" class="dashboard__chart-card">
          <h2 class="dashboard__card-title">
            <span class="dashboard__dot" />
            Répartition Nutritionnelle
          </h2>
          <div class="dashboard__chart-body">
            <div class="dashboard__chart-wrap">
              <canvas ref="chartCanvas" />
            </div>
            <div class="dashboard__legend">
              <NutritionLegendItem
                label="Protéines"
                :percent="protPct"
                :grams="nutritionTotals.prot"
                icon="dna"
                color="#3B82F6"
              />
              <NutritionLegendItem
                label="Lipides"
                :percent="fatPct"
                :grams="nutritionTotals.fat"
                icon="droplets"
                color="#F97316"
              />
              <NutritionLegendItem
                label="Glucides"
                :percent="carbPct"
                :grams="nutritionTotals.carb"
                icon="wheat"
                color="#10B981"
              />
            </div>
          </div>
        </KuboCard>

        <!-- Budget chart -->
        <KuboCard rounded="3xl" class="dashboard__budget-card">
          <h2 class="dashboard__card-title">
            <span class="dashboard__dot" />
            Évolution du Budget
          </h2>
          <div class="dashboard__budget-chart-wrap">
            <canvas ref="budgetCanvas" />
          </div>
        </KuboCard>
      </div>

      <!-- Right column -->
      <div class="dashboard__right-col">
        <!-- Total period card (dark) -->
        <KuboCard rounded="2xl" :dark="true" class="dashboard__progress-card">
          <p class="dashboard__prog-label">Total Période</p>
          <h3 class="dashboard__prog-count" data-testid="dash-total-price">
            {{ totalPrice.toFixed(2) }} €
          </h3>

          <div class="dashboard__stats-row">
            <div class="dashboard__stat-mini">
              <span class="dashboard__stat-mini-label">Moy. / repas</span>
              <span class="dashboard__stat-mini-value">{{ avgPrice.toFixed(2) }} €</span>
            </div>
            <div class="dashboard__stat-mini">
              <span class="dashboard__stat-mini-label">Progression</span>
              <span class="dashboard__stat-mini-value"
                >{{ doneRecipes.length }} / {{ mealsGoal }} fait</span
              >
            </div>
          </div>

          <KuboProgressBar :value="dashProgress" color="emerald" />
        </KuboCard>

        <!-- Week details (only in week mode) -->
        <KuboCard
          v-if="viewMode === 'week'"
          rounded="2xl"
          :dark="true"
          class="dashboard__week-card"
        >
          <div class="dashboard__dish-list-label">Plats de la semaine</div>
          <div class="dashboard__dish-list custom-scrollbar">
            <div v-for="recipe in selectedRecipes" :key="recipe.id" class="dashboard__dish-item">
              <span
                :class="['dashboard__dish-dot', { 'dashboard__dish-dot--done': isDone(recipe.id) }]"
              />
              <span
                :class="[
                  'dashboard__dish-name',
                  { 'dashboard__dish-name--done': isDone(recipe.id) },
                ]"
              >
                {{ recipe.title }}
              </span>
            </div>
            <div v-if="!selectedRecipes.length" class="dashboard__dish-empty">
              Aucun plat sélectionné
            </div>
          </div>
        </KuboCard>
      </div>
    </div>

    <!-- ── Produits de saison (toujours visible) ── -->
    <section class="season-section" data-testid="season-section">
      <div class="season-section__header">
        <div class="season-section__title-block">
          <span class="season-section__dot" />
          <h2 class="season-section__title">Produits de saison</h2>
        </div>
        <!-- Sélecteur de mois -->
        <div class="season-month-picker">
          <button
            v-for="(name, idx) in MONTH_NAMES"
            :key="idx"
            :class="['season-month-btn', { 'season-month-btn--active': currentMonth === idx + 1 }]"
            @click="selectMonth(idx + 1)"
          >
            {{ name.slice(0, 3) }}
          </button>
        </div>
      </div>

      <!-- Skeleton loading -->
      <div v-if="seasonLoading" class="season-section__skeleton">
        <div v-for="n in 10" :key="n" class="season-skeleton-item">
          <div class="season-skeleton-item__img" />
          <div class="season-skeleton-item__label" />
        </div>
      </div>

      <template v-else>
        <!-- Légumes -->
        <div v-if="legumes.length" class="season-section__group">
          <h3 class="season-section__group-label">🥦 Légumes</h3>
          <div class="season-grid">
            <div
              v-for="item in legumes"
              :key="item.nom"
              class="season-item"
              data-testid="season-item"
            >
              <div class="season-item__img-wrap">
                <img
                  v-if="getSeasonImage(item.nom, item.type).url"
                  :src="getSeasonImage(item.nom, item.type).url"
                  :alt="item.nom"
                  class="season-item__img"
                  loading="lazy"
                  @error="
                    (e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      ;(e.target as HTMLImageElement).nextElementSibling!.removeAttribute('hidden')
                    }
                  "
                />
                <span hidden class="season-item__emoji-fallback">{{
                  getSeasonImage(item.nom, item.type).emoji
                }}</span>
                <span
                  v-if="!getSeasonImage(item.nom, item.type).url"
                  class="season-item__emoji-fallback"
                  >{{ getSeasonImage(item.nom, item.type).emoji }}</span
                >
              </div>
              <span class="season-item__name">{{ item.nom }}</span>
            </div>
          </div>
        </div>

        <!-- Fruits -->
        <div v-if="fruits.length" class="season-section__group">
          <h3 class="season-section__group-label">🍎 Fruits</h3>
          <div class="season-grid">
            <div
              v-for="item in fruits"
              :key="item.nom"
              class="season-item"
              data-testid="season-item"
            >
              <div class="season-item__img-wrap">
                <img
                  v-if="getSeasonImage(item.nom, item.type).url"
                  :src="getSeasonImage(item.nom, item.type).url"
                  :alt="item.nom"
                  class="season-item__img"
                  loading="lazy"
                  @error="
                    (e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      ;(e.target as HTMLImageElement).nextElementSibling!.removeAttribute('hidden')
                    }
                  "
                />
                <span hidden class="season-item__emoji-fallback">{{
                  getSeasonImage(item.nom, item.type).emoji
                }}</span>
                <span
                  v-if="!getSeasonImage(item.nom, item.type).url"
                  class="season-item__emoji-fallback"
                  >{{ getSeasonImage(item.nom, item.type).emoji }}</span
                >
              </div>
              <span class="season-item__name">{{ item.nom }}</span>
            </div>
          </div>
        </div>

        <!-- Aucun résultat -->
        <p v-if="!legumes.length && !fruits.length" class="season-section__empty">
          Aucun produit de saison trouvé pour ce mois.
        </p>
      </template>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 48px;
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .dashboard {
    padding: 24px;
  }
}

.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 40px;
}
.dashboard__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--kubo-text);
}
.dashboard__sub {
  font-size: 16px;
  font-weight: 600;
  font-style: italic;
  color: var(--kubo-text-muted);
  margin-top: 4px;
}

/* View mode toggle */
.dashboard__view-modes {
  display: flex;
  gap: 4px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  padding: 4px;
}
.dashboard__view-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}
.dashboard__view-btn--active {
  background: var(--kubo-surface);
  color: var(--kubo-green);
  box-shadow: var(--shadow-card);
}

/* Empty */
.dashboard__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  gap: 20px;
}
.dashboard__empty-icon {
  width: 120px;
  height: 120px;
  border-radius: 40px;
  background: var(--kubo-green-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-green);
  position: relative;
}
.dashboard__empty-icon-badge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: var(--kubo-surface);
  border-radius: var(--radius-md);
  padding: 10px;
  box-shadow: var(--shadow-lg);
  color: var(--kubo-green);
  border: 1px solid var(--kubo-border);
}
.dashboard__empty-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--kubo-text);
}
.dashboard__empty-desc {
  max-width: 420px;
  font-size: 15px;
  font-weight: 500;
  color: var(--kubo-text-muted);
  line-height: 1.7;
}

/* Grid */
.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 1024px) {
  .dashboard__grid {
    grid-template-columns: 2fr 1fr;
  }
}

.dashboard__left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.dashboard__right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Chart card */
.dashboard__chart-card {
  padding: 36px !important;
}
.dashboard__card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 28px;
}
.dashboard__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--kubo-green);
}
.dashboard__chart-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}
@media (min-width: 640px) {
  .dashboard__chart-body {
    flex-direction: row;
  }
}
.dashboard__chart-wrap {
  position: relative;
  height: 220px;
  width: 100%;
  max-width: 220px;
  flex-shrink: 0;
}
.dashboard__chart-wrap canvas {
  width: 100% !important;
  height: 100% !important;
}
.dashboard__legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

/* Budget card */
.dashboard__budget-card {
  padding: 36px !important;
}
.dashboard__budget-chart-wrap {
  height: 200px;
  position: relative;
}

/* Progress card */
.dashboard__progress-card {
  padding: 32px !important;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dashboard__prog-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #34d399;
}
.dashboard__prog-count {
  font-size: 28px;
  font-weight: 900;
  color: #fff;
}

.dashboard__stats-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.dashboard__stat-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dashboard__stat-mini-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #475569;
}
.dashboard__stat-mini-value {
  font-size: 13px;
  font-weight: 800;
  color: #e2e8f0;
}

/* Week details card */
.dashboard__week-card {
  padding: 24px !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dashboard__dish-list-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #475569;
}
.dashboard__dish-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}
.dashboard__dish-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dashboard__dish-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
  flex-shrink: 0;
}
.dashboard__dish-dot--done {
  background: #475569;
  box-shadow: none;
}
.dashboard__dish-name {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
}
.dashboard__dish-name--done {
  text-decoration: line-through;
  opacity: 0.4;
}
.dashboard__dish-empty {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  font-style: italic;
}

/* ── Section produits de saison ── */
.season-section {
  margin-top: 48px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}
@media (max-width: 768px) {
  .season-section {
    padding: 24px;
    border-radius: 20px;
  }
}

.season-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
}

.season-section__title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.season-section__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--kubo-green);
  flex-shrink: 0;
}

.season-section__title {
  font-size: 18px;
  font-weight: 800;
  color: var(--kubo-text);
}

/* Sélecteur de mois */
.season-month-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.season-month-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  letter-spacing: 0.02em;
}

.season-month-btn--active {
  background: var(--kubo-surface);
  color: var(--kubo-green);
  box-shadow: var(--shadow-card);
}

.season-month-btn:not(.season-month-btn--active):hover {
  color: var(--kubo-text);
  background: var(--kubo-border);
}

.season-section__group {
  margin-bottom: 28px;
}

.season-section__group-label {
  font-size: 15px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Grille illustrée */
.season-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
}

.season-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: default;
}

.season-item__img-wrap {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl, 16px);
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.season-item:hover .season-item__img-wrap {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}

.season-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.season-item__emoji-fallback {
  font-size: 40px;
  line-height: 1;
}

.season-item__name {
  font-size: 11px;
  font-weight: 700;
  color: var(--kubo-text);
  text-align: center;
  line-height: 1.3;
  max-width: 88px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Skeleton */
.season-section__skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.season-skeleton-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.season-skeleton-item__img {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl, 16px);
  background: var(--kubo-surface-mute);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.season-skeleton-item__label {
  width: 56px;
  height: 10px;
  border-radius: 4px;
  background: var(--kubo-surface-mute);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
  animation-delay: 0.1s;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.season-section__empty {
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  font-style: italic;
}
</style>

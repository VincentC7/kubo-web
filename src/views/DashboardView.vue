<script setup>
/**
 * DashboardView — Vue tableau de bord nutritionnel
 */
import { ref, computed, watch, onMounted } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'
import KuboCard from '@/components/ui/KuboCard.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboProgressBar from '@/components/ui/KuboProgressBar.vue'
import NutritionLegendItem from '@/components/recipes/NutritionLegendItem.vue'
import { useApp } from '@/composables/useApp.js'

const { selectedRecipes, doneRecipes, progressPercent, nutritionTotals, navTo, isDone } = useApp()

const hasData = computed(() => selectedRecipes.value.length > 0)

// Chart.js — chargé dynamiquement
const chartCanvas = ref(null)
let chartInstance = null

const macroSum = computed(
  () => nutritionTotals.value.prot + nutritionTotals.value.fat + nutritionTotals.value.carb || 1,
)
const protPct = computed(() => Math.round((nutritionTotals.value.prot / macroSum.value) * 100))
const fatPct = computed(() => Math.round((nutritionTotals.value.fat / macroSum.value) * 100))
const carbPct = computed(() => Math.round((nutritionTotals.value.carb / macroSum.value) * 100))

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

async function renderChart() {
  if (!chartCanvas.value || !hasData.value) return
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

watch(
  [selectedRecipes, nutritionTotals],
  () => {
    if (hasData.value) renderChart()
  },
  { deep: true },
)
onMounted(() => {
  if (hasData.value) renderChart()
})
</script>

<template>
  <div class="dashboard fade-in" data-testid="dashboard-view">
    <header class="dashboard__header">
      <h1 class="dashboard__title">Synthèse</h1>
      <p class="dashboard__sub">Votre équilibre culinaire hebdomadaire.</p>
    </header>

    <!-- Empty state -->
    <div v-if="!hasData" class="dashboard__empty">
      <div class="dashboard__empty-icon">
        <KuboIcon name="chef-hat" :size="56" />
        <div class="dashboard__empty-icon-badge">
          <KuboIcon name="plus" :size="18" />
        </div>
      </div>
      <h2 class="dashboard__empty-title">Votre semaine est vide</h2>
      <p class="dashboard__empty-desc">
        Commencez par explorer le catalogue pour planifier vos repas et analyser vos besoins.
      </p>
      <KuboButton variant="primary" size="lg" @click="navTo('catalog')">
        <KuboIcon name="search" :size="18" />
        Explorer le catalogue
      </KuboButton>
    </div>

    <!-- Main content -->
    <div v-else class="dashboard__grid">
      <!-- Chart card -->
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

      <!-- Progress card -->
      <KuboCard rounded="2xl" :dark="true" class="dashboard__progress-card">
        <p class="dashboard__prog-label">Progression</p>
        <h3 class="dashboard__prog-count">
          {{ doneRecipes.length }} / {{ selectedRecipes.length }} cuisinés
        </h3>
        <KuboProgressBar :value="progressPercent" color="emerald" />

        <div class="dashboard__dish-list-label">Plats de la semaine</div>
        <div class="dashboard__dish-list custom-scrollbar">
          <div v-for="recipe in selectedRecipes" :key="recipe.id" class="dashboard__dish-item">
            <span
              :class="['dashboard__dish-dot', { 'dashboard__dish-dot--done': isDone(recipe.id) }]"
            />
            <span
              :class="['dashboard__dish-name', { 'dashboard__dish-name--done': isDone(recipe.id) }]"
            >
              {{ recipe.title }}
            </span>
          </div>
        </div>
      </KuboCard>
    </div>
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
  font-size: 22px;
  font-weight: 900;
  color: #fff;
}
.dashboard__dish-list-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #475569;
  margin-top: 8px;
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
</style>

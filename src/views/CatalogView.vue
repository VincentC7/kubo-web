<script setup lang="ts">
/**
 * CatalogView — Vue catalogue des recettes
 * Section 1 : Sélection de la semaine (recettes scorées par l'API)
 * Section 2 : Toutes les recettes (reste du catalogue, infinite scroll)
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboInput from '@/components/ui/KuboInput.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import RecipeCard from '@/components/recipes/RecipeCard.vue'
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal.vue'
import FilterModal from '@/components/recipes/FilterModal.vue'
import { storeToRefs } from 'pinia'
import { useRecipeStore } from '@/stores/recipeStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import type { RecipeWithPrice } from '@/types/recipe'

const recipeStore = useRecipeStore()
const {
  recipesWithPrice,
  filteredRecipes,
  weeklySelection,
  currentWeek,
  filters,
  catalogLoading,
  catalogHasMore,
  loadingDetailId,
  hasActiveFilters,
} = storeToRefs(recipeStore)
const { setSearch, loadMoreRecipes, fetchDetail } = recipeStore

const planningStore = usePlanningStore()
const { selectedRecipes } = storeToRefs(planningStore)
const { isSelected, toggleRecipe } = planningStore

const userStore = useUserStore()
const { mealsGoal } = storeToRefs(userStore)

const uiStore = useUiStore()
const { notify } = uiStore

const filterOpen = ref(false)
const detailId = ref<string | null>(null)
// Toujours lire depuis recipesWithPrice (non filtré) pour recevoir les mises à jour du store
const detailRecipe = computed<RecipeWithPrice | null>(
  () => recipesWithPrice.value.find((r) => r.id === detailId.value) ?? null,
)
const sentinel = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

// Chargement initial : aucune recette chargée encore
const initialLoading = computed(() => catalogLoading.value && recipeStore.recipes.length === 0)

// Formate "2026-W12" → "Semaine 12"
const weekLabel = computed(() => {
  if (!currentWeek.value) return ''
  const match = currentWeek.value.match(/W(\d+)$/)
  return match ? `Semaine ${parseInt(match[1], 10)}` : currentWeek.value
})

function openDetail(recipe: RecipeWithPrice): void {
  detailId.value = recipe.id
  fetchDetail(recipe.id)
}

function closeDetail(): void {
  detailId.value = null
}

function handleToggle(recipe: RecipeWithPrice): void {
  toggleRecipe(recipe.id)
  const sel = isSelected(recipe.id)
  notify(sel ? `"${recipe.title}" ajouté au menu` : `"${recipe.title}" retiré du menu`)
}

function handleModalToggle(): void {
  if (!detailRecipe.value) return
  handleToggle(detailRecipe.value)
  closeDetail()
}

onMounted(async () => {
  // Si le store est vide, on charge (loading=true au départ = pas encore initialisé)
  if (recipeStore.recipes.length === 0) {
    await recipeStore.init()
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && catalogHasMore.value && !catalogLoading.value) {
        loadMoreRecipes()
      }
    },
    { rootMargin: '200px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

// Re-déclenche un check dès que catalogHasMore passe à true (données chargées)
// et que le sentinel est toujours visible dans le viewport.
watch(catalogHasMore, async (hasMore) => {
  if (!hasMore || !observer || !sentinel.value) return
  // Déconnecter puis ré-observer force l'IntersectionObserver à re-évaluer
  observer.unobserve(sentinel.value)
  await nextTick()
  observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="catalog fade-in" data-testid="catalog-view">
    <!-- Header -->
    <header class="catalog__header">
      <div>
        <h1 class="catalog__title">Explorer les Recettes</h1>
        <p class="catalog__sub">
          Découvrez les saveurs de la semaine.
          <span class="catalog__counter"
            >{{ selectedRecipes.length }} / {{ mealsGoal }} sélectionnés</span
          >
        </p>
      </div>
      <div class="catalog__actions">
        <KuboInput
          :model-value="filters.search"
          placeholder="Rechercher…"
          @update:model-value="setSearch"
        >
          <template #icon>
            <KuboIcon name="search" :size="16" />
          </template>
        </KuboInput>
        <KuboButton variant="dark" data-testid="filter-btn" @click="filterOpen = true">
          <KuboIcon name="filter" :size="16" />
          Filtrer
        </KuboButton>
      </div>
    </header>

    <!-- Skeleton chargement initial -->
    <div v-if="initialLoading" class="catalog__section">
      <div class="catalog__section-header">
        <div class="skeleton skeleton--title" />
      </div>
      <div class="catalog__grid">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="skeleton skeleton--image" />
          <div class="skeleton-card__body">
            <div class="skeleton skeleton--line skeleton--line-lg" />
            <div class="skeleton skeleton--line skeleton--line-sm" />
            <div class="skeleton skeleton--line skeleton--line-md" />
          </div>
        </div>
      </div>
    </div>

    <!-- Section 1 : Sélection de la semaine (masquée si filtre actif) -->
    <section
      v-if="weeklySelection.length && !hasActiveFilters && !initialLoading"
      class="catalog__section"
    >
      <div class="catalog__section-header">
        <h2 class="catalog__section-title">Sélection de la semaine</h2>
        <span v-if="weekLabel" class="catalog__week-badge">{{ weekLabel }}</span>
      </div>
      <div class="catalog__grid" data-testid="weekly-selection-grid">
        <RecipeCard
          v-for="recipe in weeklySelection"
          :key="recipe.id"
          :recipe="recipe"
          :selected="isSelected(recipe.id)"
          @select="openDetail(recipe)"
          @toggle="handleToggle(recipe)"
        />
      </div>
    </section>

    <!-- Section 2 : Toutes les recettes -->
    <section v-if="!initialLoading" class="catalog__section">
      <div class="catalog__section-header">
        <h2 class="catalog__section-title">
          {{ hasActiveFilters ? 'Résultats de recherche' : 'Toutes les recettes' }}
        </h2>
      </div>

      <div v-if="filteredRecipes.length" class="catalog__grid" data-testid="recipe-grid">
        <RecipeCard
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          :recipe="recipe"
          :selected="isSelected(recipe.id)"
          @select="openDetail(recipe)"
          @toggle="handleToggle(recipe)"
        />
      </div>

      <!-- Empty filtered state -->
      <div v-else class="catalog__empty">
        <KuboIcon name="search" :size="40" />
        <p>Aucune recette ne correspond à vos filtres.</p>
      </div>
    </section>

    <!-- Sentinel + loader pour l'infinite scroll -->
    <div ref="sentinel" class="catalog__sentinel" aria-hidden="true" />
    <div v-if="catalogLoading" class="catalog__loader">
      <span class="catalog__spinner" />
      Chargement…
    </div>

    <!-- Modals -->
    <RecipeDetailModal
      :recipe="detailRecipe"
      :selected="detailRecipe ? isSelected(detailRecipe.id) : false"
      :loading="loadingDetailId === detailRecipe?.id"
      @close="closeDetail"
      @toggle="handleModalToggle"
    />
    <FilterModal :visible="filterOpen" @close="filterOpen = false" />
  </div>
</template>

<style scoped>
.catalog {
  padding: 48px;
  max-width: 1400px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .catalog {
    padding: 24px;
  }
}

.catalog__header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 36px;
}
@media (min-width: 768px) {
  .catalog__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.catalog__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--kubo-text);
}
.catalog__sub {
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  margin-top: 4px;
}
.catalog__counter {
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-green);
  background: var(--kubo-green-light);
  padding: 2px 10px;
  border-radius: var(--radius-xs);
}

.catalog__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Sections */
.catalog__section {
  margin-bottom: 48px;
}

.catalog__section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--kubo-border);
}

.catalog__section-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--kubo-text);
}

.catalog__week-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--kubo-green);
  background: var(--kubo-green-light);
  padding: 3px 10px;
  border-radius: var(--radius-xs);
}

.catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.catalog__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  color: var(--kubo-text-muted);
  font-size: 15px;
  font-weight: 600;
  text-align: center;
}

.catalog__sentinel {
  height: 1px;
}

.catalog__loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0 48px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
}

.catalog__spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--kubo-border);
  border-top-color: var(--kubo-green);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Skeleton loading */
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--kubo-surface-mute) 25%,
    var(--kubo-border) 50%,
    var(--kubo-surface-mute) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: var(--radius-sm, 6px);
}

.skeleton--title {
  height: 20px;
  width: 180px;
}

.skeleton--image {
  width: 100%;
  height: 180px;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.skeleton--line {
  height: 14px;
  border-radius: var(--radius-xs);
}
.skeleton--line-lg {
  width: 80%;
}
.skeleton--line-md {
  width: 55%;
}
.skeleton--line-sm {
  width: 40%;
}

.skeleton-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
}

.skeleton-card__body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

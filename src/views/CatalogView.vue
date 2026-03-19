<script setup lang="ts">
/**
 * CatalogView — Vue catalogue des recettes
 */
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
const { filteredRecipes, filters, catalogLoading, catalogHasMore } = storeToRefs(recipeStore)
const { setSearch, loadMoreRecipes } = recipeStore

const planningStore = usePlanningStore()
const { selectedRecipes } = storeToRefs(planningStore)
const { isSelected, toggleRecipe } = planningStore

const userStore = useUserStore()
const { mealsGoal } = storeToRefs(userStore)

const uiStore = useUiStore()
const { notify } = uiStore

const filterOpen = ref(false)
const detailRecipe = ref<RecipeWithPrice | null>(null)
const sentinel = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

function openDetail(recipe: RecipeWithPrice): void {
  detailRecipe.value = recipe
}

function closeDetail(): void {
  detailRecipe.value = null
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

onMounted(() => {
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

    <!-- Grid -->
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

.catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  padding-bottom: 48px;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

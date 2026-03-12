<script setup>
/**
 * CatalogView — Vue catalogue des recettes
 */
import { ref } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboInput from '@/components/ui/KuboInput.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import RecipeCard from '@/components/recipes/RecipeCard.vue'
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal.vue'
import FilterModal from '@/components/recipes/FilterModal.vue'
import { useApp } from '@/composables/useApp.js'

const { filteredRecipes, isSelected, toggleRecipe, setSearch, filters, notify } = useApp()

const filterOpen = ref(false)
const detailRecipe = ref(null)

function openDetail(recipe) {
  detailRecipe.value = recipe
}

function closeDetail() {
  detailRecipe.value = null
}

function handleToggle(recipe) {
  toggleRecipe(recipe.id)
  const sel = isSelected(recipe.id)
  notify(sel ? `"${recipe.title}" ajouté au menu` : `"${recipe.title}" retiré du menu`)
}

function handleModalToggle() {
  handleToggle(detailRecipe.value)
  closeDetail()
}
</script>

<template>
  <div class="catalog fade-in" data-testid="catalog-view">
    <!-- Header -->
    <header class="catalog__header">
      <div>
        <h1 class="catalog__title">Recettes</h1>
        <p class="catalog__sub">Découvrez les saveurs de la semaine.</p>
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
</style>

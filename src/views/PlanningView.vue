<script setup lang="ts">
/**
 * PlanningView — Vue menu hebdomadaire
 */
import { ref } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import PlanningCard from '@/components/planning/PlanningCard.vue'
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal.vue'
import { storeToRefs } from 'pinia'
import { usePlanningStore } from '@/stores/planningStore'
import { useUiStore } from '@/stores/uiStore'
import type { RecipeWithPrice } from '@/types/recipe'

const planningStore = usePlanningStore()
const { selectedRecipes } = storeToRefs(planningStore)
const { isDone, isSelected, markAsDone, toggleRecipe } = planningStore

const uiStore = useUiStore()
const { notify } = uiStore

const detailRecipe = ref<RecipeWithPrice | null>(null)

function openDetail(recipe: RecipeWithPrice): void {
  detailRecipe.value = recipe
}

function handleRemove(recipe: RecipeWithPrice): void {
  toggleRecipe(recipe.id)
  notify(`"${recipe.title}" retiré du menu`)
}

function handleModalToggle(): void {
  if (!detailRecipe.value) return
  toggleRecipe(detailRecipe.value.id)
  detailRecipe.value = null
}
</script>

<template>
  <div class="planning fade-in" data-testid="planning-view">
    <header class="planning__header">
      <div>
        <h1 class="planning__title">Menu Hebdo</h1>
        <p class="planning__sub">Votre sélection personnalisée.</p>
      </div>
    </header>

    <!-- Grid -->
    <div v-if="selectedRecipes.length" class="planning__grid" data-testid="planning-grid">
      <PlanningCard
        v-for="recipe in selectedRecipes"
        :key="recipe.id"
        :recipe="recipe"
        :done="isDone(recipe.id)"
        @done="markAsDone(recipe.id)"
        @remove="handleRemove(recipe)"
        @open="openDetail(recipe)"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="planning__empty">
      <div class="planning__empty-icon">
        <KuboIcon name="calendar" :size="32" />
      </div>
      <h2 class="planning__empty-title">Menu vide cette semaine</h2>
      <p class="planning__empty-hint">
        Parcourez le catalogue et ajoutez des recettes pour composer votre menu.
      </p>
      <button class="planning__empty-cta" @click="uiStore.navTo('catalog')">
        <KuboIcon name="search" :size="18" />
        Parcourir le catalogue
      </button>
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
  padding: 48px;
  max-width: 1100px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .planning {
    padding: 24px;
  }
}

.planning__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 36px;
}
.planning__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--kubo-text);
}
.planning__sub {
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  margin-top: 4px;
}

.planning__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding-bottom: 48px;
}

.planning__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 24px;
  text-align: center;
}
.planning__empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-2xl);
  background: var(--kubo-surface-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-text-muted);
  margin-bottom: 4px;
}
.planning__empty-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--kubo-text);
  letter-spacing: -0.02em;
}
.planning__empty-hint {
  font-size: 14px;
  font-weight: 500;
  color: var(--kubo-text-muted);
  max-width: 300px;
  line-height: 1.5;
}
.planning__empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 14px 28px;
  background: var(--kubo-green);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}
.planning__empty-cta:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px var(--kubo-green-shadow);
}
.planning__empty-cta:active {
  transform: scale(0.98);
}
</style>

<script setup>
/**
 * PlanningView — Vue menu hebdomadaire
 */
import { ref } from 'vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import PlanningCard from '@/components/planning/PlanningCard.vue'
import RecipeDetailModal from '@/components/recipes/RecipeDetailModal.vue'
import { useApp } from '@/composables/useApp.js'

const { selectedRecipes, isDone, isSelected, markAsDone, toggleRecipe, clearPlanning, notify } =
  useApp()

const detailRecipe = ref(null)

function openDetail(recipe) {
  detailRecipe.value = recipe
}

function handleRemove(recipe) {
  toggleRecipe(recipe.id)
  notify(`"${recipe.title}" retiré du menu`)
}

function handleModalToggle() {
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
      <KuboButton
        variant="danger"
        size="sm"
        data-testid="planning-reset-btn"
        @click="clearPlanning"
      >
        <KuboIcon name="rotate-ccw" :size="14" />
        Reset semaine
      </KuboButton>
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
      <KuboIcon name="calendar" :size="48" />
      <p>Votre menu est vide pour cette semaine.</p>
      <p class="planning__empty-hint">Ajoutez des recettes depuis le catalogue.</p>
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
  gap: 12px;
  padding: 80px 0;
  text-align: center;
  color: var(--kubo-text-muted);
}
.planning__empty p {
  font-size: 16px;
  font-weight: 700;
}
.planning__empty-hint {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
}
</style>

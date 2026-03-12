<script setup>
/**
 * GroceriesView — Vue liste de courses
 */
import KuboCard from '@/components/ui/KuboCard.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import GroceryGroup from '@/components/shopping/GroceryGroup.vue'
import { useApp } from '@/composables/useApp.js'

const { selectedRecipes, isDone } = useApp()
</script>

<template>
  <div class="groceries fade-in" data-testid="groceries-view">
    <header class="groceries__header">
      <h1 class="groceries__title">Courses</h1>
      <p class="groceries__sub">Ingrédients générés depuis votre menu.</p>
    </header>

    <KuboCard v-if="selectedRecipes.length" rounded="3xl" class="groceries__card">
      <div class="groceries__list">
        <GroceryGroup
          v-for="recipe in selectedRecipes"
          :key="recipe.id"
          :recipe="recipe"
          :done="isDone(recipe.id)"
        />
      </div>
    </KuboCard>

    <div v-else class="groceries__empty">
      <KuboIcon name="shopping-cart" :size="48" />
      <p>Rien à acheter pour l'instant.</p>
      <p class="groceries__empty-hint">Planifiez des repas pour générer votre liste.</p>
    </div>
  </div>
</template>

<style scoped>
.groceries {
  padding: 48px;
  max-width: 720px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .groceries {
    padding: 24px;
  }
}

.groceries__header {
  margin-bottom: 32px;
}
.groceries__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--kubo-text);
}
.groceries__sub {
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  margin-top: 4px;
}

.groceries__card {
  padding: 36px !important;
}
.groceries__list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.groceries__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  text-align: center;
  color: var(--kubo-text-muted);
}
.groceries__empty p {
  font-size: 16px;
  font-weight: 700;
}
.groceries__empty-hint {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
}
</style>

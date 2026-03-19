<script setup lang="ts">
/**
 * GroceriesView — Vue liste de courses avec total prix
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import GroceryGroup from '@/components/shopping/GroceryGroup.vue'
import { storeToRefs } from 'pinia'
import { usePlanningStore } from '@/stores/planningStore'

const planningStore = usePlanningStore()
const { selectedRecipes, totalPrice } = storeToRefs(planningStore)
const { isDone } = planningStore
</script>

<template>
  <div class="groceries fade-in" data-testid="groceries-view">
    <header class="groceries__header">
      <div>
        <h1 class="groceries__title">Courses</h1>
        <p class="groceries__sub">Ingrédients générés depuis votre menu.</p>
      </div>
      <div v-if="selectedRecipes.length" class="groceries__total-card">
        <KuboIcon name="banknote" :size="18" class="groceries__total-icon" />
        <div>
          <p class="groceries__total-label">Total estimé</p>
          <p class="groceries__total-price" data-testid="groceries-total-price">
            {{ totalPrice.toFixed(2) }} €
          </p>
        </div>
      </div>
    </header>

    <div v-if="selectedRecipes.length" class="groceries__list">
      <GroceryGroup
        v-for="recipe in selectedRecipes"
        :key="recipe.id"
        :recipe="recipe"
        :done="isDone(recipe.id)"
      />
    </div>

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
  max-width: 960px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .groceries {
    padding: 24px;
  }
}

.groceries__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
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

.groceries__total-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}
.groceries__total-icon {
  color: var(--kubo-green);
}
.groceries__total-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--kubo-text-muted);
}
.groceries__total-price {
  font-size: 20px;
  font-weight: 900;
  color: var(--kubo-text);
}

.groceries__list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 48px;
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

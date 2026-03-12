<script setup>
/**
 * InventoryView — Vue inventaire des ingrédients en stock
 */
import { computed } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import { useApp } from '@/composables/useApp.js'

const { inventory, updateInventory, notify, selectedRecipes, isInInventory } = useApp()

const missingIngredients = computed(() => {
  const missing = []
  selectedRecipes.value.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      if (!isInInventory(ing.name) && !missing.find((m) => m.name === ing.name)) {
        missing.push({ ...ing, recipeName: recipe.title })
      }
    })
  })
  return missing
})

function removeItem(item) {
  updateInventory(item, false)
  notify(`${item.name} retiré du stock`)
}

function addMissing(item) {
  updateInventory(item, true)
  notify(`${item.name} ajouté au stock`)
}
</script>

<template>
  <div class="inventory fade-in" data-testid="inventory-view">
    <header class="inventory__header">
      <div>
        <h1 class="inventory__title">Inventaire</h1>
        <p class="inventory__sub">Vos ingrédients en stock.</p>
      </div>
      <div class="inventory__stats">
        <div class="inventory__stat-card">
          <KuboIcon name="package" :size="18" class="inventory__stat-icon" />
          <div>
            <p class="inventory__stat-label">En stock</p>
            <p class="inventory__stat-value" data-testid="inventory-count">
              {{ inventory.length }}
            </p>
          </div>
        </div>
        <div class="inventory__stat-card inventory__stat-card--warn">
          <KuboIcon name="alert-triangle" :size="18" class="inventory__stat-icon--warn" />
          <div>
            <p class="inventory__stat-label">Manquants</p>
            <p class="inventory__stat-value">{{ missingIngredients.length }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Current stock -->
    <section v-if="inventory.length" class="inventory__section">
      <h2 class="inventory__section-title">
        <span class="inventory__section-dot" />
        Stock Actuel
      </h2>
      <div class="inventory__grid">
        <div v-for="item in inventory" :key="item.name" class="inventory__item">
          <div class="inventory__item-icon">
            <KuboIcon name="package" :size="16" />
          </div>
          <div class="inventory__item-info">
            <span class="inventory__item-name">{{ item.name }}</span>
            <span v-if="item.qty" class="inventory__item-qty">{{ item.qty }}</span>
          </div>
          <button class="inventory__item-remove" title="Retirer" @click="removeItem(item)">
            <KuboIcon name="x" :size="14" />
          </button>
        </div>
      </div>
    </section>

    <!-- Missing ingredients -->
    <section v-if="missingIngredients.length" class="inventory__section">
      <h2 class="inventory__section-title">
        <span class="inventory__section-dot inventory__section-dot--warn" />
        Ingrédients Manquants
      </h2>
      <p class="inventory__section-desc">Par rapport à votre menu de la semaine.</p>
      <div class="inventory__grid">
        <div
          v-for="item in missingIngredients"
          :key="item.name"
          class="inventory__item inventory__item--missing"
        >
          <div class="inventory__item-icon inventory__item-icon--warn">
            <KuboIcon name="alert-triangle" :size="16" />
          </div>
          <div class="inventory__item-info">
            <span class="inventory__item-name">{{ item.name }}</span>
            <span class="inventory__item-recipe">{{ item.recipeName }}</span>
          </div>
          <KuboButton size="sm" variant="primary" @click="addMissing(item)">
            <KuboIcon name="plus" :size="14" />
          </KuboButton>
        </div>
      </div>
    </section>

    <!-- Empty state -->
    <div v-if="!inventory.length && !missingIngredients.length" class="inventory__empty">
      <KuboIcon name="box" :size="48" />
      <p>Votre inventaire est vide.</p>
      <p class="inventory__empty-hint">
        Ajoutez des recettes au menu puis cochez les ingrédients achetés dans Courses.
      </p>
    </div>
  </div>
</template>

<style scoped>
.inventory {
  padding: 48px;
  max-width: 960px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .inventory {
    padding: 24px;
  }
}

.inventory__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 40px;
}
.inventory__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--kubo-text);
}
.inventory__sub {
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  margin-top: 4px;
}

.inventory__stats {
  display: flex;
  gap: 12px;
}
.inventory__stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}
.inventory__stat-card--warn {
  border-color: #fbbf24;
}
.inventory__stat-icon {
  color: var(--kubo-green);
}
.inventory__stat-icon--warn {
  color: #f59e0b;
}
.inventory__stat-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--kubo-text-muted);
}
.inventory__stat-value {
  font-size: 18px;
  font-weight: 900;
  color: var(--kubo-text);
}

/* Section */
.inventory__section {
  margin-bottom: 32px;
}
.inventory__section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 16px;
}
.inventory__section-dot {
  width: 6px;
  height: 18px;
  background: var(--kubo-green);
  border-radius: 99px;
  flex-shrink: 0;
}
.inventory__section-dot--warn {
  background: #f59e0b;
}
.inventory__section-desc {
  font-size: 12px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  margin-bottom: 16px;
}

.inventory__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.inventory__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}
.inventory__item:hover {
  border-color: var(--kubo-border-mid);
  box-shadow: var(--shadow-card);
}
.inventory__item--missing {
  background: #fffbeb;
  border-color: #fde68a;
}
:global(.dark) .inventory__item--missing {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.inventory__item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-xs);
  background: var(--kubo-green-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-green);
  flex-shrink: 0;
}
.inventory__item-icon--warn {
  background: #fef3c7;
  color: #f59e0b;
}
:global(.dark) .inventory__item-icon--warn {
  background: rgba(245, 158, 11, 0.15);
}

.inventory__item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.inventory__item-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.inventory__item-qty {
  font-size: 10px;
  font-weight: 800;
  color: var(--kubo-green);
}
.inventory__item-recipe {
  font-size: 10px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  font-style: italic;
}

.inventory__item-remove {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  flex-shrink: 0;
}
.inventory__item-remove:hover {
  background: #fef2f2;
  color: #ef4444;
}
:global(.dark) .inventory__item-remove:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* Empty */
.inventory__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  text-align: center;
  color: var(--kubo-text-muted);
}
.inventory__empty p {
  font-size: 16px;
  font-weight: 700;
}
.inventory__empty-hint {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
  max-width: 400px;
}
</style>

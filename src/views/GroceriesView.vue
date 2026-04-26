<script setup lang="ts">
/**
 * GroceriesView — Vue liste de courses
 * Branché sur shoppingStore (liste générée depuis le planning ou ajouts manuels).
 * Fallback : affiche un état vide avec bouton "Générer" si aucune liste n'existe.
 */
import { onMounted } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useShoppingStore } from '@/stores/shoppingStore'
import { usePlanningStore } from '@/stores/planningStore'

const shoppingStore = useShoppingStore()
const planningStore = usePlanningStore()
const { list, loading, itemsByCategory, checkedCount, totalCount } = storeToRefs(shoppingStore)

onMounted(async () => {
  await shoppingStore.fetchList()
  if (!list.value) {
    await shoppingStore.generate()
  }
})
</script>

<template>
  <div class="groceries fade-in" data-testid="groceries-view">
    <header class="groceries__header">
      <div>
        <h1 class="groceries__title">Courses</h1>
        <p class="groceries__sub">{{ planningStore.weekRange }}</p>
      </div>

      <div class="groceries__actions">
        <div v-if="totalCount > 0" class="groceries__progress-badge">
          <KuboIcon name="list-checks" :size="15" />
          {{ checkedCount }}/{{ totalCount }}
        </div>
        <button
          class="groceries__generate-btn"
          :disabled="loading"
          title="Regénérer depuis le planning"
          @click="shoppingStore.generate()"
        >
          <KuboIcon name="rotate-ccw" :size="14" />
          Regénérer
        </button>
      </div>
    </header>

    <!-- Liste par catégorie -->
    <div v-if="list && totalCount > 0" class="groceries__list">
      <div v-for="(items, category) in itemsByCategory" :key="category" class="groceries__category">
        <h2 class="groceries__category-title">{{ category }}</h2>
        <ul class="groceries__items">
          <li
            v-for="item in items"
            :key="item.id"
            :class="['groceries__item', { 'groceries__item--checked': item.checked }]"
          >
            <button
              class="groceries__item-check"
              :aria-label="item.checked ? 'Décocher' : 'Cocher'"
              @click="shoppingStore.toggleItem(item.id)"
            >
              <KuboIcon :name="item.checked ? 'check' : 'plus'" :size="14" />
            </button>
            <span class="groceries__item-name">{{ item.ingredientName }}</span>
            <span v-if="item.quantity || item.unit" class="groceries__item-qty">
              {{ [item.quantity, item.unit].filter(Boolean).join(' ') }}
            </span>
            <button
              class="groceries__item-remove"
              aria-label="Supprimer"
              @click="shoppingStore.removeItem(item.id)"
            >
              <KuboIcon name="x" :size="13" />
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- État vide -->
    <div v-else-if="!loading" class="groceries__empty">
      <KuboIcon name="shopping-cart" :size="48" />
      <p>Aucun ingrédient dans le planning cette semaine.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="groceries__loading">
      <span class="groceries__spinner" />
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

.groceries__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.groceries__progress-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text-muted);
}

.groceries__generate-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--transition-base);
}
.groceries__generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.groceries__list {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-bottom: 48px;
}

.groceries__category-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--kubo-text-muted);
  margin-bottom: 10px;
}

.groceries__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.groceries__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  transition: opacity var(--transition-base);
}
.groceries__item--checked {
  opacity: 0.5;
}
.groceries__item--checked .groceries__item-name {
  text-decoration: line-through;
}

.groceries__item-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--kubo-border);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--kubo-green);
  transition:
    border-color var(--transition-base),
    background var(--transition-base);
}
.groceries__item--checked .groceries__item-check {
  background: var(--kubo-green);
  border-color: var(--kubo-green);
  color: #fff;
}

.groceries__item-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text);
}

.groceries__item-qty {
  font-size: 12px;
  font-weight: 600;
  color: var(--kubo-text-muted);
}

.groceries__item-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  opacity: 0.4;
  transition: opacity var(--transition-base);
}
.groceries__item-remove:hover {
  opacity: 1;
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

.groceries__loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.groceries__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--kubo-border);
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

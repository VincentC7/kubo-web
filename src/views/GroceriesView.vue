<script setup lang="ts">
/**
 * GroceriesView — Vue liste de courses
 */
import { onMounted, ref, computed } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useShoppingStore } from '@/stores/shoppingStore'
import { usePlanningStore } from '@/stores/planningStore'
import { useUiStore } from '@/stores/uiStore'

const shoppingStore = useShoppingStore()
const planningStore = usePlanningStore()
const uiStore = useUiStore()
const { list, loading, itemsByCategory, checkedCount, totalCount } = storeToRefs(shoppingStore)

// Set des IDs d'items en cours de toggle (feedback visuel)
const togglingIds = ref<Set<string>>(new Set())
// Set des IDs d'items fraîchement cochés (flash vert)
const flashedIds = ref<Set<string>>(new Set())
// Tout cocher en cours
const checkingAll = ref(false)
// Tous cochés ?
const allChecked = computed(() => totalCount.value > 0 && checkedCount.value === totalCount.value)

onMounted(async () => {
  await shoppingStore.fetchList()
  if (!list.value) {
    await shoppingStore.generate()
  }
})

async function handleToggle(id: string) {
  togglingIds.value = new Set(togglingIds.value).add(id)
  await shoppingStore.toggleItem(id)
  togglingIds.value.delete(id)
  togglingIds.value = new Set(togglingIds.value)

  // Flash vert pendant 600ms sur l'item qui vient d'être coché
  const item = list.value?.items.find((i) => i.id === id)
  if (item?.checked) {
    flashedIds.value = new Set(flashedIds.value).add(id)
    setTimeout(() => {
      flashedIds.value.delete(id)
      flashedIds.value = new Set(flashedIds.value)
    }, 600)
  }
}

async function handleUncheckAll() {
  checkingAll.value = true
  const checkedIds = list.value?.items.filter((i) => i.checked).map((i) => i.id) ?? []
  await Promise.all(checkedIds.map((id) => shoppingStore.toggleItem(id)))
  checkingAll.value = false
}

async function handleCheckAll() {
  checkingAll.value = true
  // Flash tous les items non cochés
  const uncheckedIds = list.value?.items.filter((i) => !i.checked).map((i) => i.id) ?? []
  await shoppingStore.checkAll()
  // Flash vert sur tous
  uncheckedIds.forEach((id) => {
    flashedIds.value = new Set(flashedIds.value).add(id)
  })
  setTimeout(() => {
    uncheckedIds.forEach((id) => flashedIds.value.delete(id))
    flashedIds.value = new Set(flashedIds.value)
  }, 600)
  checkingAll.value = false
  uiStore.notify('Toutes les courses cochées !')
}

function goToPlanning() {
  uiStore.navTo('planning')
}
</script>

<template>
  <div class="groceries fade-in" data-testid="groceries-view">
    <header class="groceries__header">
      <div>
        <h1 class="groceries__title">Courses</h1>
        <p class="groceries__sub">{{ planningStore.weekRange }}</p>
      </div>

      <div class="groceries__actions">
        <!-- Progression -->
        <div v-if="totalCount > 0" class="groceries__progress-badge">
          <KuboIcon name="list-checks" :size="15" />
          <span>{{ checkedCount }}/{{ totalCount }}</span>
          <!-- Barre de progression -->
          <div class="groceries__progress-track">
            <div
              class="groceries__progress-fill"
              :style="{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }"
            />
          </div>
        </div>
        <button
          v-if="totalCount > 0"
          class="groceries__check-all-btn"
          :class="{ 'groceries__check-all-btn--done': allChecked }"
          :disabled="checkingAll"
          @click="allChecked ? handleUncheckAll() : handleCheckAll()"
        >
          <span v-if="checkingAll" class="groceries__btn-spinner" />
          <KuboIcon v-else :name="allChecked ? 'circle-x' : 'list-checks'" :size="14" />
          {{ allChecked ? 'Tout décocher' : 'Tout cocher' }}
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
            :class="[
              'groceries__item',
              { 'groceries__item--checked': item.checked },
              { 'groceries__item--toggling': togglingIds.has(item.id) },
              { 'groceries__item--flash': flashedIds.has(item.id) },
            ]"
          >
            <button
              class="groceries__item-check"
              :aria-label="item.checked ? 'Décocher' : 'Cocher'"
              :disabled="togglingIds.has(item.id)"
              @click="handleToggle(item.id)"
            >
              <span v-if="togglingIds.has(item.id)" class="groceries__check-spinner" />
              <KuboIcon v-else :name="item.checked ? 'check' : 'plus'" :size="14" />
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
      <div class="groceries__empty-icon">
        <KuboIcon name="shopping-cart" :size="32" />
      </div>
      <p class="groceries__empty-title">Aucun ingrédient cette semaine</p>
      <p class="groceries__empty-hint">
        Ajoutez des recettes à votre menu pour générer automatiquement votre liste de courses.
      </p>
      <button class="groceries__empty-cta" @click="goToPlanning">
        <KuboIcon name="calendar" :size="15" />
        Aller au planning
      </button>
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

/* Badge progression avec barre */
.groceries__progress-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text-muted);
}
.groceries__progress-track {
  width: 60px;
  height: 4px;
  background: var(--kubo-surface-mute);
  border-radius: 99px;
  overflow: hidden;
}
.groceries__progress-fill {
  height: 100%;
  background: var(--kubo-green);
  border-radius: 99px;
  transition: width 0.4s ease;
}

.groceries__check-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--kubo-green);
  color: #fff;
  border: 1.5px solid transparent;
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-base);
  cursor: pointer;
  transition:
    opacity var(--transition-base),
    background var(--transition-base),
    color var(--transition-base),
    border-color var(--transition-base);
}
.groceries__check-all-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.groceries__check-all-btn--done {
  background: transparent;
  color: var(--kubo-text);
  border-color: var(--kubo-border);
}
.groceries__check-all-btn--done:not(:disabled):hover {
  border-color: var(--kubo-text-muted);
}
.groceries__check-all-btn:not(:disabled):not(.groceries__check-all-btn--done):hover {
  opacity: 0.88;
}

.groceries__btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
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
  transition:
    opacity var(--transition-base),
    border-color var(--transition-base),
    background var(--transition-base);
}
.groceries__item--checked {
  opacity: 0.5;
}
.groceries__item--checked .groceries__item-name {
  text-decoration: line-through;
}
.groceries__item--toggling {
  opacity: 0.7;
}
/* Flash vert bref au cochage */
.groceries__item--flash {
  border-color: var(--kubo-green);
  background: var(--kubo-green-light);
}

.groceries__item-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
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
.groceries__item-check:disabled {
  cursor: wait;
}
.groceries__item--checked .groceries__item-check {
  background: var(--kubo-green);
  border-color: var(--kubo-green);
  color: #fff;
}

.groceries__check-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--kubo-border);
  border-top-color: var(--kubo-green);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
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
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--kubo-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  opacity: 0.35;
  transition:
    opacity var(--transition-base),
    background var(--transition-base);
}
.groceries__item-remove:hover {
  opacity: 1;
  background: #fef2f2;
  color: #ef4444;
}

/* Empty state */
.groceries__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  text-align: center;
}
.groceries__empty-icon {
  width: 80px;
  height: 80px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-text-muted);
}
.groceries__empty-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--kubo-text);
}
.groceries__empty-hint {
  font-size: 14px;
  font-weight: 500;
  color: var(--kubo-text-muted);
  max-width: 360px;
  line-height: 1.6;
}
.groceries__empty-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-base);
  cursor: pointer;
  margin-top: 8px;
  transition:
    opacity var(--transition-base),
    transform var(--transition-bounce);
}
.groceries__empty-cta:hover {
  opacity: 0.88;
  transform: scale(1.02);
}

/* Loading */
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

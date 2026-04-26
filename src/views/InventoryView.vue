<script setup lang="ts">
/**
 * InventoryView — Vue inventaire des ingrédients en stock
 */
import { onMounted, ref } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/stores/inventoryStore'
import type { CreateInventoryItem } from '@/types/inventory'

const inventoryStore = useInventoryStore()
const { items, loading, expiringSoon, expired, itemsByCategory } = storeToRefs(inventoryStore)

onMounted(() => inventoryStore.fetchInventory())

// ── Formulaire d'ajout ────────────────────────────────────────────────────────
const showForm = ref(false)
const form = ref<CreateInventoryItem>({
  name: '',
  quantity: 1,
  unit: '',
  category: '',
  expiresAt: '',
})

function resetForm() {
  form.value = { name: '', quantity: 1, unit: '', category: '', expiresAt: '' }
  showForm.value = false
}

async function submitAdd() {
  if (!form.value.name.trim()) return
  const payload: CreateInventoryItem = {
    name: form.value.name.trim(),
    quantity: form.value.quantity,
    ...(form.value.unit ? { unit: form.value.unit } : {}),
    ...(form.value.category ? { category: form.value.category } : {}),
    ...(form.value.expiresAt ? { expiresAt: form.value.expiresAt } : {}),
  }
  await inventoryStore.addItem(payload)
  resetForm()
}

function statusLabel(status: string | null) {
  if (status === 'expiring_soon') return 'Bientôt périmé'
  if (status === 'expired') return 'Périmé'
  return null
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
            <p class="inventory__stat-value" data-testid="inventory-count">{{ items.length }}</p>
          </div>
        </div>
        <div v-if="expiringSoon.length" class="inventory__stat-card inventory__stat-card--warn">
          <KuboIcon name="alert-triangle" :size="18" class="inventory__stat-icon--warn" />
          <div>
            <p class="inventory__stat-label">Bientôt périmés</p>
            <p class="inventory__stat-value">{{ expiringSoon.length }}</p>
          </div>
        </div>
        <div v-if="expired.length" class="inventory__stat-card inventory__stat-card--danger">
          <KuboIcon name="x-circle" :size="18" class="inventory__stat-icon--danger" />
          <div>
            <p class="inventory__stat-label">Périmés</p>
            <p class="inventory__stat-value">{{ expired.length }}</p>
          </div>
        </div>
        <button class="inventory__add-btn" @click="showForm = !showForm">
          <KuboIcon name="plus" :size="15" />
          Ajouter
        </button>
      </div>
    </header>

    <!-- Formulaire d'ajout -->
    <div v-if="showForm" class="inventory__form-card">
      <h2 class="inventory__form-title">Ajouter un ingrédient</h2>
      <div class="inventory__form-row">
        <input v-model="form.name" class="inventory__input" placeholder="Nom *" />
        <input
          v-model.number="form.quantity"
          type="number"
          min="0"
          class="inventory__input inventory__input--sm"
          placeholder="Qté"
        />
        <input
          v-model="form.unit"
          class="inventory__input inventory__input--sm"
          placeholder="Unité"
        />
        <input v-model="form.category" class="inventory__input" placeholder="Catégorie" />
        <input v-model="form.expiresAt" type="date" class="inventory__input" />
      </div>
      <div class="inventory__form-actions">
        <button class="inventory__form-cancel" @click="resetForm">Annuler</button>
        <button class="inventory__form-submit" :disabled="!form.name.trim()" @click="submitAdd">
          Ajouter
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="inventory__loading">
      <span class="inventory__spinner" />
    </div>

    <!-- Liste par catégorie -->
    <template v-else-if="items.length">
      <div
        v-for="(catItems, category) in itemsByCategory"
        :key="category"
        class="inventory__section"
      >
        <h2 class="inventory__section-title">
          <span class="inventory__section-dot" />
          {{ category }}
        </h2>
        <div class="inventory__grid">
          <div
            v-for="item in catItems"
            :key="item.id"
            :class="[
              'inventory__item',
              item.status === 'expired' && 'inventory__item--expired',
              item.status === 'expiring_soon' && 'inventory__item--warn',
            ]"
          >
            <div
              :class="[
                'inventory__item-icon',
                item.status && 'inventory__item-icon--' + item.status,
              ]"
            >
              <KuboIcon name="package" :size="16" />
            </div>
            <div class="inventory__item-info">
              <span class="inventory__item-name">{{ item.name }}</span>
              <span class="inventory__item-qty">
                {{ item.quantity }}{{ item.unit ? ' ' + item.unit : '' }}
              </span>
              <span v-if="statusLabel(item.status)" class="inventory__item-status">
                {{ statusLabel(item.status) }}
              </span>
            </div>
            <button
              class="inventory__item-remove"
              title="Retirer"
              @click="inventoryStore.removeItem(item.id)"
            >
              <KuboIcon name="x" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- État vide -->
    <div v-else-if="!loading" class="inventory__empty">
      <KuboIcon name="box" :size="48" />
      <p>Votre inventaire est vide.</p>
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
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
.inventory__stat-card--danger {
  border-color: #ef4444;
}
.inventory__stat-icon {
  color: var(--kubo-green);
}
.inventory__stat-icon--warn {
  color: #f59e0b;
}
.inventory__stat-icon--danger {
  color: #ef4444;
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

.inventory__add-btn {
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
.inventory__add-btn:hover {
  opacity: 0.85;
}

/* Formulaire */
.inventory__form-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 32px;
}
.inventory__form-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 16px;
}
.inventory__form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.inventory__input {
  flex: 1;
  min-width: 140px;
  padding: 8px 12px;
  background: var(--kubo-bg);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--kubo-text);
}
.inventory__input--sm {
  max-width: 100px;
  flex: 0 0 100px;
}
.inventory__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.inventory__form-cancel {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  cursor: pointer;
}
.inventory__form-submit {
  padding: 8px 20px;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.inventory__form-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
.inventory__item--warn {
  background: #fffbeb;
  border-color: #fde68a;
}
.inventory__item--expired {
  background: #fef2f2;
  border-color: #fecaca;
}
:global(.dark) .inventory__item--warn {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}
:global(.dark) .inventory__item--expired {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
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
.inventory__item-icon--expiring_soon {
  background: #fef3c7;
  color: #f59e0b;
}
.inventory__item-icon--expired {
  background: #fef2f2;
  color: #ef4444;
}
:global(.dark) .inventory__item-icon--expiring_soon {
  background: rgba(245, 158, 11, 0.15);
}
:global(.dark) .inventory__item-icon--expired {
  background: rgba(239, 68, 68, 0.15);
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
.inventory__item-status {
  font-size: 10px;
  font-weight: 700;
  color: #f59e0b;
}
.inventory__item--expired .inventory__item-status {
  color: #ef4444;
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
  opacity: 0.4;
}
.inventory__item-remove:hover {
  background: #fef2f2;
  color: #ef4444;
  opacity: 1;
}
:global(.dark) .inventory__item-remove:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* Loading */
.inventory__loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.inventory__spinner {
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
</style>

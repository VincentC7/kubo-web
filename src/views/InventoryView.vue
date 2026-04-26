<script setup lang="ts">
/**
 * InventoryView — Vue inventaire des ingrédients en stock
 */
import { onMounted, ref, computed } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useUiStore } from '@/stores/uiStore'
import type { CreateInventoryItem } from '@/types/inventory'

const inventoryStore = useInventoryStore()
const { items, loading, expiringSoon, expired, itemsByCategory } = storeToRefs(inventoryStore)
const uiStore = useUiStore()

onMounted(() => inventoryStore.fetchInventory())

// ── Formulaire d'ajout ────────────────────────────────────────────────────────
const showForm = ref(false)
const submitting = ref(false)
const nameError = ref('')

const form = ref<CreateInventoryItem>({
  name: '',
  quantity: 1,
  unit: '',
  category: '',
  expiresAt: '',
})

const isFormValid = computed(() => form.value.name.trim().length > 0)

function resetForm() {
  form.value = { name: '', quantity: 1, unit: '', category: '', expiresAt: '' }
  nameError.value = ''
  showForm.value = false
}

function validateName() {
  nameError.value = form.value.name.trim() ? '' : 'Le nom est obligatoire'
}

async function submitAdd() {
  validateName()
  if (!isFormValid.value) return
  submitting.value = true
  try {
    const payload: CreateInventoryItem = {
      name: form.value.name.trim(),
      quantity: form.value.quantity,
      ...(form.value.unit ? { unit: form.value.unit } : {}),
      ...(form.value.category ? { category: form.value.category } : {}),
      ...(form.value.expiresAt ? { expiresAt: form.value.expiresAt } : {}),
    }
    await inventoryStore.addItem(payload)
    uiStore.notify(`"${payload.name}" ajouté à l'inventaire`)
    resetForm()
  } finally {
    submitting.value = false
  }
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
          <KuboIcon :name="showForm ? 'x' : 'plus'" :size="15" />
          {{ showForm ? 'Annuler' : 'Ajouter' }}
        </button>
      </div>
    </header>

    <!-- Formulaire d'ajout -->
    <Transition name="form-slide">
      <div v-if="showForm" class="inventory__form-card">
        <h2 class="inventory__form-title">Ajouter un ingrédient</h2>
        <div class="inventory__form-grid">
          <!-- Nom -->
          <div class="inventory__field inventory__field--wide">
            <label class="inventory__label" for="inv-name">
              Nom <span class="inventory__label-required">*</span>
            </label>
            <input
              id="inv-name"
              v-model="form.name"
              :class="['inventory__input', { 'inventory__input--error': nameError }]"
              placeholder="ex. Carottes"
              autocomplete="off"
              @blur="validateName"
            />
            <p v-if="nameError" class="inventory__field-error">
              <KuboIcon name="alert-circle" :size="12" />
              {{ nameError }}
            </p>
          </div>

          <!-- Quantité -->
          <div class="inventory__field">
            <label class="inventory__label" for="inv-qty">Quantité</label>
            <input
              id="inv-qty"
              v-model.number="form.quantity"
              type="number"
              min="0"
              class="inventory__input"
              placeholder="1"
            />
          </div>

          <!-- Unité -->
          <div class="inventory__field">
            <label class="inventory__label" for="inv-unit">Unité</label>
            <input
              id="inv-unit"
              v-model="form.unit"
              class="inventory__input"
              placeholder="kg, L, pcs…"
            />
          </div>

          <!-- Catégorie -->
          <div class="inventory__field inventory__field--wide">
            <label class="inventory__label" for="inv-cat">Catégorie</label>
            <input
              id="inv-cat"
              v-model="form.category"
              class="inventory__input"
              placeholder="ex. Légumes"
            />
          </div>

          <!-- Date d'expiration -->
          <div class="inventory__field inventory__field--wide">
            <label class="inventory__label" for="inv-expires">Date d'expiration</label>
            <input id="inv-expires" v-model="form.expiresAt" type="date" class="inventory__input" />
          </div>
        </div>

        <div class="inventory__form-actions">
          <button class="inventory__form-cancel" :disabled="submitting" @click="resetForm">
            Annuler
          </button>
          <button
            class="inventory__form-submit"
            :disabled="!isFormValid || submitting"
            @click="submitAdd"
          >
            <span v-if="submitting" class="inventory__btn-spinner" />
            <KuboIcon v-else name="plus" :size="14" />
            {{ submitting ? 'Ajout…' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Loading initial -->
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
      <div class="inventory__empty-icon">
        <KuboIcon name="box" :size="32" />
      </div>
      <p class="inventory__empty-title">Votre inventaire est vide</p>
      <p class="inventory__empty-hint">
        Ajoutez vos ingrédients en stock pour suivre les dates d'expiration et éviter le gaspillage.
      </p>
      <button class="inventory__empty-cta" @click="showForm = true">
        <KuboIcon name="plus" :size="15" />
        Ajouter un ingrédient
      </button>
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
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.form-slide-enter-from,
.form-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}
.form-slide-enter-to,
.form-slide-leave-from {
  opacity: 1;
  max-height: 600px;
  margin-bottom: 32px;
}

.inventory__form-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-green);
  border-radius: var(--radius-xl);
  padding: 28px;
  margin-bottom: 32px;
  box-shadow: 0 0 0 4px var(--kubo-green-shadow);
}
.inventory__form-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 20px;
}

.inventory__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 600px) {
  .inventory__form-grid {
    grid-template-columns: 1fr;
  }
}

.inventory__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.inventory__field--wide {
  grid-column: 1 / -1;
}

.inventory__label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--kubo-text-muted);
}
.inventory__label-required {
  color: #ef4444;
  margin-left: 2px;
}

.inventory__input {
  padding: 10px 14px;
  background: var(--kubo-surface-mute);
  border: 1.5px solid var(--kubo-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-base);
  color: var(--kubo-text);
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}
.inventory__input:focus {
  outline: none;
  border-color: var(--kubo-green);
  box-shadow: 0 0 0 3px var(--kubo-green-shadow);
}
.inventory__input--error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}
.inventory__field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
}

.inventory__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.inventory__form-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1.5px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-base);
  color: var(--kubo-text-muted);
  cursor: pointer;
  transition: border-color var(--transition-base);
}
.inventory__form-cancel:hover {
  border-color: var(--kubo-text-muted);
}
.inventory__form-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.inventory__form-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--kubo-green);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-base);
  cursor: pointer;
  transition: opacity var(--transition-base);
}
.inventory__form-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.inventory__form-submit:not(:disabled):hover {
  opacity: 0.88;
}

.inventory__btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
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
  width: 32px;
  height: 32px;
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
  opacity: 0.35;
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

/* Empty state */
.inventory__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  text-align: center;
}
.inventory__empty-icon {
  width: 80px;
  height: 80px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-text-muted);
}
.inventory__empty-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--kubo-text);
}
.inventory__empty-hint {
  font-size: 14px;
  font-weight: 500;
  color: var(--kubo-text-muted);
  max-width: 380px;
  line-height: 1.6;
}
.inventory__empty-cta {
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
.inventory__empty-cta:hover {
  opacity: 0.88;
  transform: scale(1.02);
}
</style>

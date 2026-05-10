<script setup lang="ts">
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

const showForm = ref(false)
const submitting = ref(false)
const nameError = ref('')

const form = ref<CreateInventoryItem>({
  name: '', quantity: 1, unit: '', category: '', expiresAt: '',
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

const CAT_META: Record<string, { emoji: string; tone: string }> = {
  'Légumes':   { emoji: '🥬', tone: 'sage' },
  'Frais':     { emoji: '🥛', tone: 'blue' },
  'Épicerie':  { emoji: '🌾', tone: 'ochre' },
  'Viande':    { emoji: '🥩', tone: 'tomato' },
  'Boissons':  { emoji: '🧃', tone: 'blue' },
}
function catMeta(cat: string) { return CAT_META[cat] ?? { emoji: '📦', tone: 'mute' } }

const STATUS_MAP = {
  expiring_soon: { label: 'Bientôt', color: 'var(--kubo-ochre)', bg: 'var(--kubo-ochre-soft)' },
  expired:       { label: 'Périmé',  color: 'var(--kubo-tomato-deep)', bg: 'var(--kubo-tomato-soft)' },
  ok:            { label: 'OK',      color: 'var(--kubo-green)', bg: 'var(--kubo-green-light)' },
}

function statusInfo(status: string | null) {
  return STATUS_MAP[status as keyof typeof STATUS_MAP] ?? STATUS_MAP.ok
}

// mock estimated value
const estimatedValue = computed(() => (items.value.length * 3.2).toFixed(0))
const autonomyDays = computed(() => Math.min(14, Math.round(items.value.length * 0.9)))
</script>

<template>
  <div class="inventory fade-in" data-testid="inventory-view">

    <!-- Header -->
    <div class="inventory__header">
      <div>
        <h1 class="kb-h1">Garde-<span class="roman">manger.</span></h1>
        <p class="inventory__sub">{{ items.length }} ingrédient{{ items.length > 1 ? 's' : '' }} suivis · mis à jour depuis votre liste de courses.</p>
      </div>
      <div class="inventory__header-actions">
        <button class="btn-ghost-line" @click="showForm = !showForm">
          <KuboIcon :name="showForm ? 'x' : 'plus'" :size="13" />
          {{ showForm ? 'Annuler' : 'Ajouter' }}
        </button>
      </div>
    </div>

    <!-- Bento header stats -->
    <div class="inventory__bento-header">
      <!-- À utiliser vite — tomate -->
      <div class="bento-card bento-tomato bento-col-4">
        <div class="bento-col-header">
          <KuboIcon name="alert-triangle" :size="16" />
          <span class="kb-eyebrow" style="color: var(--kubo-tomato-deep)">À utiliser vite</span>
        </div>
        <div class="bento-big-num" style="color: var(--kubo-text);">{{ expired.length + expiringSoon.length }}</div>
        <div style="font-size: 12px; color: var(--kubo-text-muted); margin-top: 6px;">
          <b>{{ expired.length }}</b> périmé{{ expired.length > 1 ? 's' : '' }} · <b>{{ expiringSoon.length }}</b> dans les 48 h
        </div>
      </div>

      <!-- Valeur estimée — sauge (mock) -->
      <div class="bento-card bento-sage bento-col-4">
        <div class="kb-eyebrow" style="color: rgba(255,253,247,.65)">Valeur estimée</div>
        <div class="bento-big-num">{{ estimatedValue }}<span class="bento-big-unit">€</span></div>
        <div style="font-size: 12px; opacity: .85; margin-top: 8px;">
          soit ~<b>{{ autonomyDays }} jours</b> d'autonomie
        </div>
      </div>

      <!-- Suggestion fraîche (mock) -->
      <div class="bento-card bento-col-4 inventory__suggestion">
        <div class="kb-eyebrow">Suggestion fraîche</div>
        <div style="font-family: var(--font-display); font-style: italic; font-weight: 600; font-size: 17px; margin-top: 8px; line-height: 1.25; color: var(--kubo-text);">
          Utilisez vos ingrédients qui expirent bientôt.
        </div>
        <div style="font-size: 11.5px; color: var(--kubo-text-muted); margin-top: 6px; line-height: 1.5;">
          {{ expiringSoon.length + expired.length }} ingrédient{{ expiringSoon.length + expired.length > 1 ? 's' : '' }} à cuisiner en priorité.
        </div>
        <button class="btn-sage btn-sm" style="margin-top: 12px; width: fit-content;" @click="uiStore.navTo('catalog')">
          <KuboIcon name="sparkles" :size="12" />Voir les recettes
        </button>
      </div>
    </div>

    <!-- Add form -->
    <Transition name="form-slide">
      <div v-if="showForm" class="inventory__form-card">
        <h2 class="inventory__form-title">Ajouter un ingrédient</h2>
        <div class="inventory__form-grid">
          <div class="inventory__field inventory__field--wide">
            <label class="inventory__label" for="inv-name">Nom <span style="color: var(--kubo-tomato)">*</span></label>
            <input id="inv-name" v-model="form.name" :class="['inventory__input', { 'inventory__input--error': nameError }]" placeholder="ex. Carottes" @blur="validateName" />
            <p v-if="nameError" class="inventory__field-error"><KuboIcon name="alert-circle" :size="12" />{{ nameError }}</p>
          </div>
          <div class="inventory__field">
            <label class="inventory__label" for="inv-qty">Quantité</label>
            <input id="inv-qty" v-model.number="form.quantity" type="number" min="0" class="inventory__input" placeholder="1" />
          </div>
          <div class="inventory__field">
            <label class="inventory__label" for="inv-unit">Unité</label>
            <input id="inv-unit" v-model="form.unit" class="inventory__input" placeholder="kg, L, pcs…" />
          </div>
          <div class="inventory__field inventory__field--wide">
            <label class="inventory__label" for="inv-cat">Catégorie</label>
            <input id="inv-cat" v-model="form.category" class="inventory__input" placeholder="ex. Légumes" />
          </div>
          <div class="inventory__field inventory__field--wide">
            <label class="inventory__label" for="inv-expires">Date d'expiration</label>
            <input id="inv-expires" v-model="form.expiresAt" type="date" class="inventory__input" />
          </div>
        </div>
        <div class="inventory__form-actions">
          <button class="btn-ghost-line" :disabled="submitting" @click="resetForm">Annuler</button>
          <button class="btn-sage" :disabled="!isFormValid || submitting" @click="submitAdd">
            <span v-if="submitting" class="spinner-white" />
            <KuboIcon v-else name="plus" :size="14" />
            {{ submitting ? 'Ajout…' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="inventory__loading">
      <span class="spinner-sage" />
    </div>

    <!-- Category grid -->
    <template v-else-if="items.length">
      <div class="inventory__grid">
        <div
          v-for="([cat, catItems]) in Object.entries(itemsByCategory)"
          :key="cat"
          class="bento-card inventory__cat-card"
        >
          <div class="inventory__cat-header">
            <div class="inventory__cat-icon" :class="`inventory__cat-icon--${catMeta(cat).tone}`">
              {{ catMeta(cat).emoji }}
            </div>
            <div>
              <div class="inventory__cat-title">{{ cat }}</div>
              <div class="kb-eyebrow" style="margin-top: 2px;">{{ catItems.length }} ARTICLES</div>
            </div>
            <button class="inventory__cat-add" @click="form.category = cat; showForm = true">
              <KuboIcon name="plus" :size="13" />
            </button>
          </div>

          <div
            v-for="(item, i) in catItems"
            :key="item.id"
            :class="['inventory__item', { 'inventory__item--first': i === 0 }]"
          >
            <div class="inventory__item-icon">
              <KuboIcon name="package" :size="16" />
            </div>
            <div class="inventory__item-info">
              <div class="inventory__item-name">{{ item.name }}</div>
              <div class="inventory__item-qty">{{ item.quantity }}{{ item.unit ? ' ' + item.unit : '' }}</div>
            </div>
            <span
              v-if="item.status"
              class="inventory__item-badge"
              :style="{ background: statusInfo(item.status).bg, color: statusInfo(item.status).color }"
            >
              <span class="inventory__badge-dot" :style="{ background: statusInfo(item.status).color }" />
              {{ statusInfo(item.status).label }}
            </span>
            <button class="inventory__item-remove" @click="inventoryStore.removeItem(item.id)">
              <KuboIcon name="x" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty -->
    <div v-else-if="!loading" class="inventory__empty">
      <div class="inventory__empty-icon">
        <KuboIcon name="box" :size="32" />
      </div>
      <p class="inventory__empty-title">Votre inventaire est vide</p>
      <p class="inventory__empty-hint">Ajoutez vos ingrédients en stock pour suivre les dates d'expiration et éviter le gaspillage.</p>
      <button class="btn-sage" style="margin-top: 8px;" @click="showForm = true">
        <KuboIcon name="plus" :size="14" />Ajouter un ingrédient
      </button>
    </div>
  </div>
</template>

<style scoped>
.inventory {
  padding: 30px 36px 40px;
}

.inventory__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
}
.inventory__sub {
  font-size: 14px;
  color: var(--kubo-text-muted);
  margin-top: 8px;
  line-height: 1.5;
}
.inventory__header-actions { display: flex; gap: 10px; }

/* Buttons */
.btn-sage {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--kubo-green); color: #fffdf7;
  border: none; border-radius: var(--radius-pill);
  font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-base);
  transition: filter var(--transition-base);
}
.btn-sage:hover { filter: brightness(1.08); }
.btn-sage:disabled { opacity: .45; cursor: not-allowed; filter: none; }
.btn-sm { padding: 7px 12px; font-size: 12px; }

.btn-ghost-line {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: transparent; color: var(--kubo-text);
  border: 1px solid var(--kubo-border); border-radius: var(--radius-pill);
  font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-base);
}
.btn-ghost-line:disabled { opacity: .5; cursor: not-allowed; }

/* Bento header */
.inventory__bento-header {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

.bento-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}
.bento-col-4 { grid-column: span 4; }
.bento-sage   { background: var(--kubo-green); color: #fffdf7; border-color: transparent; }
.bento-tomato { background: var(--kubo-tomato-soft); border-color: transparent; }

.bento-col-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bento-big-num {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 64px;
  letter-spacing: -2.5px;
  line-height: 1;
  margin-top: 10px;
}
.bento-big-unit {
  font-style: normal; font-size: 24px; opacity: .55; margin-left: 4px;
}

.inventory__suggestion { }

/* Add form */
.form-slide-enter-active, .form-slide-leave-active {
  transition: all 0.25s ease; overflow: hidden;
}
.form-slide-enter-from, .form-slide-leave-to { opacity: 0; max-height: 0; margin-bottom: 0; }
.form-slide-enter-to, .form-slide-leave-from { opacity: 1; max-height: 600px; margin-bottom: 24px; }

.inventory__form-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-green);
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 0 0 4px var(--kubo-green-shadow);
}
.inventory__form-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 18px;
  color: var(--kubo-text);
  margin-bottom: 18px;
}
.inventory__form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;
}
.inventory__field { display: flex; flex-direction: column; gap: 6px; }
.inventory__field--wide { grid-column: 1 / -1; }
.inventory__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--kubo-text-muted); }
.inventory__input {
  padding: 10px 14px;
  background: var(--kubo-surface-mute);
  border: 1.5px solid var(--kubo-border);
  border-radius: var(--radius-md);
  font-size: 13.5px;
  font-family: var(--font-base);
  color: var(--kubo-text);
  outline: none;
  transition: border-color var(--transition-base);
}
.inventory__input:focus { border-color: var(--kubo-green); }
.inventory__input--error { border-color: var(--kubo-tomato); }
.inventory__field-error {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--kubo-tomato-deep);
}
.inventory__form-actions { display: flex; justify-content: flex-end; gap: 10px; }

/* Category grid */
.inventory__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding-bottom: 40px;
}

.inventory__cat-card { padding: 20px; }
.inventory__cat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--kubo-border);
}
.inventory__cat-icon {
  width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.inventory__cat-icon--sage   { background: var(--kubo-green-light); }
.inventory__cat-icon--blue   { background: var(--kubo-blue-soft); }
.inventory__cat-icon--ochre  { background: var(--kubo-ochre-soft); }
.inventory__cat-icon--tomato { background: var(--kubo-tomato-soft); }
.inventory__cat-icon--mute   { background: var(--kubo-surface-mute); }

.inventory__cat-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 19px;
  letter-spacing: -0.3px;
  color: var(--kubo-text);
}
.inventory__cat-add {
  margin-left: auto;
  width: 30px; height: 30px; border-radius: 10px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  color: var(--kubo-text-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all var(--transition-base);
}
.inventory__cat-add:hover { border-color: var(--kubo-green); color: var(--kubo-green); }

/* Items */
.inventory__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px dashed var(--kubo-border);
}
.inventory__item--first { border-top: none; }

.inventory__item-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--kubo-bg-2, var(--kubo-surface-mute));
  color: var(--kubo-text-muted);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.inventory__item-info { flex: 1; min-width: 0; }
.inventory__item-name { font-size: 13px; font-weight: 700; color: var(--kubo-text); }
.inventory__item-qty { font-size: 10.5px; color: var(--kubo-text-faint); font-family: var(--font-mono); font-weight: 600; margin-top: 2px; }

.inventory__item-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: var(--radius-pill);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .04em;
  flex-shrink: 0;
}
.inventory__badge-dot { width: 5px; height: 5px; border-radius: 3px; }

.inventory__item-remove {
  width: 28px; height: 28px; border: none; background: transparent;
  color: var(--kubo-text-faint); border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: .4; transition: opacity var(--transition-base);
}
.inventory__item-remove:hover { opacity: 1; color: var(--kubo-tomato-deep); }

/* Loading / Empty */
.inventory__loading { display: flex; justify-content: center; padding: 40px 0; }
.inventory__empty { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px 24px; text-align: center; }
.inventory__empty-icon { width: 80px; height: 80px; background: var(--kubo-surface-mute); border-radius: var(--radius-2xl); display: flex; align-items: center; justify-content: center; color: var(--kubo-text-muted); }
.inventory__empty-title { font-size: 20px; font-weight: 700; color: var(--kubo-text); }
.inventory__empty-hint { font-size: 14px; color: var(--kubo-text-muted); max-width: 380px; line-height: 1.6; }

/* Spinners */
.spinner-white { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-sage  { width: 28px; height: 28px; border: 3px solid var(--kubo-border); border-top-color: var(--kubo-green); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .inventory__bento-header { grid-template-columns: repeat(6, 1fr); }
  .bento-col-4 { grid-column: span 6; }
  .inventory__grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .inventory__grid { grid-template-columns: 1fr; }
}
</style>

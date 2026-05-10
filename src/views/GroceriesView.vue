<script setup lang="ts">
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

const togglingIds = ref<Set<string>>(new Set())
const flashedIds  = ref<Set<string>>(new Set())
const checkingAll = ref(false)
const allChecked  = computed(() => totalCount.value > 0 && checkedCount.value === totalCount.value)

const CATEGORY_META: Record<string, { emoji: string; tone: string }> = {
  'Féculent':      { emoji: '🌾', tone: 'ochre' },
  'Légume':        { emoji: '🥬', tone: 'sage' },
  'Frais':         { emoji: '🥚', tone: 'blue' },
  'Herbe / Épice': { emoji: '🌿', tone: 'sage' },
  'Conserve':      { emoji: '🥫', tone: 'tomato' },
}

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { emoji: '🛒', tone: 'mute' }
}

onMounted(async () => {
  await shoppingStore.fetchList()
  if (!list.value) await shoppingStore.generate()
})

async function handleToggle(id: string) {
  togglingIds.value = new Set(togglingIds.value).add(id)
  await shoppingStore.toggleItem(id)
  togglingIds.value.delete(id)
  togglingIds.value = new Set(togglingIds.value)
  const item = list.value?.items.find((i) => i.id === id)
  if (item?.checked) {
    flashedIds.value = new Set(flashedIds.value).add(id)
    setTimeout(() => { flashedIds.value.delete(id); flashedIds.value = new Set(flashedIds.value) }, 600)
  }
}

async function handleCheckAll() {
  checkingAll.value = true
  const uncheckedIds = list.value?.items.filter((i) => !i.checked).map((i) => i.id) ?? []
  await shoppingStore.checkAll()
  uncheckedIds.forEach((id) => { flashedIds.value = new Set(flashedIds.value).add(id) })
  setTimeout(() => { uncheckedIds.forEach((id) => flashedIds.value.delete(id)); flashedIds.value = new Set(flashedIds.value) }, 600)
  checkingAll.value = false
  uiStore.notify('Toutes les courses cochées !')
}

async function handleUncheckAll() {
  checkingAll.value = true
  const checkedIds = list.value?.items.filter((i) => i.checked).map((i) => i.id) ?? []
  await Promise.all(checkedIds.map((id) => shoppingStore.toggleItem(id)))
  checkingAll.value = false
}

const progressPct = computed(() => totalCount.value > 0 ? Math.round((checkedCount.value / totalCount.value) * 100) : 0)

// mock estimated budget
const estimatedBudget = computed(() => (totalCount.value * 2.35).toFixed(2))
</script>

<template>
  <div class="groceries fade-in" data-testid="groceries-view">

    <!-- Header -->
    <div class="groceries__header">
      <div>
        <h1 class="kb-h1">Liste <span class="roman">de courses.</span></h1>
        <p class="groceries__sub">{{ totalCount }} articles · auto-générée depuis votre menu {{ planningStore.weekRange }}.</p>
      </div>
      <div class="groceries__header-actions">
        <button class="btn-ghost-line" @click="shoppingStore.generate()">
          <KuboIcon name="refresh-cw" :size="13" />Régénérer
        </button>
        <button
          class="btn-sage"
          :disabled="checkingAll"
          @click="allChecked ? handleUncheckAll() : handleCheckAll()"
        >
          <span v-if="checkingAll" class="spinner-white" />
          <KuboIcon v-else :name="allChecked ? 'x' : 'check'" :size="13" />
          {{ allChecked ? 'Tout décocher' : 'Tout cocher' }}
        </button>
      </div>
    </div>

    <!-- Bento header -->
    <div v-if="totalCount > 0" class="groceries__bento-header">
      <!-- Progression — sauge -->
      <div class="bento-card bento-sage bento-col-5">
        <div class="kb-eyebrow" style="color: rgba(255,253,247,.65)">Progression</div>
        <div class="groceries__prog-body">
          <span class="groceries__prog-num">{{ checkedCount }}</span>
          <span class="groceries__prog-total">/ {{ totalCount }}</span>
          <span class="groceries__prog-pct">{{ progressPct }}%</span>
        </div>
        <div class="bento-progress-track">
          <div class="bento-progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
        <div style="font-size: 12.5px; opacity: .9; margin-top: 10px;">
          Plus que <b>{{ totalCount - checkedCount }}</b> article{{ totalCount - checkedCount > 1 ? 's' : '' }} à attraper.
        </div>
      </div>

      <!-- Budget estimé — tomate -->
      <div class="bento-card bento-tomato bento-col-4">
        <div class="kb-eyebrow" style="color: var(--kubo-tomato-deep)">Estimé · semaine</div>
        <div class="groceries__budget-num">{{ estimatedBudget }}<span class="groceries__budget-unit">€</span></div>
        <div style="font-size: 11.5px; color: var(--kubo-text-muted); margin-top: 8px; line-height: 1.5;">
          Basé sur les prix observés.
        </div>
      </div>

      <!-- Par rayon -->
      <div class="bento-card bento-col-3">
        <div class="kb-eyebrow">Par rayon</div>
        <div class="groceries__rayon-list">
          <div
            v-for="([cat, items]) in Object.entries(itemsByCategory)"
            :key="cat"
            class="groceries__rayon-row"
          >
            <span class="groceries__rayon-emoji">{{ categoryMeta(cat).emoji }}</span>
            <span class="groceries__rayon-name">{{ cat }}</span>
            <span class="groceries__rayon-count">{{ items.filter(i => i.checked).length }}/{{ items.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="groceries__loading">
      <span class="spinner-sage" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!list || totalCount === 0" class="groceries__empty">
      <div class="groceries__empty-icon">
        <KuboIcon name="shopping-cart" :size="32" />
      </div>
      <p class="groceries__empty-title">Aucun article cette semaine</p>
      <p class="groceries__empty-hint">Ajoutez des recettes à votre menu pour générer automatiquement votre liste.</p>
      <button class="btn-sage" style="margin-top: 8px;" @click="uiStore.navTo('planning')">
        <KuboIcon name="calendar" :size="14" />Aller au planning
      </button>
    </div>

    <!-- Category grid -->
    <div v-else class="groceries__grid">
      <div
        v-for="([cat, items]) in Object.entries(itemsByCategory)"
        :key="cat"
        class="bento-card groceries__category-card"
      >
        <!-- Category header -->
        <div class="groceries__cat-header">
          <div class="groceries__cat-icon" :class="`groceries__cat-icon--${categoryMeta(cat).tone}`">
            {{ categoryMeta(cat).emoji }}
          </div>
          <span class="groceries__cat-title">{{ cat }}</span>
          <span class="groceries__cat-count">{{ items.filter(i => i.checked).length }}/{{ items.length }}</span>
        </div>

        <!-- Items -->
        <div
          v-for="item in items"
          :key="item.id"
          :class="[
            'groceries__item',
            { 'groceries__item--checked': item.checked },
            { 'groceries__item--flash': flashedIds.has(item.id) },
          ]"
        >
          <button
            class="groceries__check"
            :class="{ 'groceries__check--on': item.checked }"
            :disabled="togglingIds.has(item.id)"
            @click="handleToggle(item.id)"
          >
            <span v-if="togglingIds.has(item.id)" class="spinner-xs" />
            <KuboIcon v-else-if="item.checked" name="check" :size="13" />
          </button>
          <span class="groceries__item-name">{{ item.ingredientName }}</span>
          <span v-if="item.quantity || item.unit" class="groceries__item-qty">
            {{ [item.quantity, item.unit].filter(Boolean).join(' ') }}
          </span>
          <button class="groceries__item-remove" @click="shoppingStore.removeItem(item.id)">
            <KuboIcon name="x" :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groceries {
  padding: 30px 36px 40px;
}

.groceries__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
}
.groceries__sub {
  font-size: 14px;
  color: var(--kubo-text-muted);
  margin-top: 8px;
  line-height: 1.5;
}
.groceries__header-actions {
  display: flex;
  gap: 10px;
}

/* Buttons */
.btn-sage {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--kubo-green); color: #fffdf7;
  border: none; border-radius: var(--radius-pill);
  font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-base);
  transition: filter var(--transition-base);
}
.btn-sage:hover { filter: brightness(1.08); }
.btn-sage:disabled { opacity: .6; cursor: not-allowed; filter: none; }

.btn-ghost-line {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: transparent; color: var(--kubo-text);
  border: 1px solid var(--kubo-border); border-radius: var(--radius-pill);
  font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--font-base);
}
.btn-ghost-line:hover { border-color: var(--kubo-text-muted); }

/* Bento header */
.groceries__bento-header {
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
.bento-col-3 { grid-column: span 3; }
.bento-col-4 { grid-column: span 4; }
.bento-col-5 { grid-column: span 5; }

.bento-sage   { background: var(--kubo-green); color: #fffdf7; border-color: transparent; }
.bento-tomato { background: var(--kubo-tomato-soft); border-color: transparent; }

.bento-progress-track {
  height: 6px; background: rgba(255,253,247,.2); border-radius: 3px; margin-top: 14px;
}
.bento-progress-fill {
  height: 100%; background: var(--kubo-tomato); border-radius: 3px; transition: width .4s ease;
}

/* Progression */
.groceries__prog-body {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 8px;
}
.groceries__prog-num {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 64px;
  letter-spacing: -2.5px;
  line-height: 1;
}
.groceries__prog-total {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 26px;
  opacity: .55;
}
.groceries__prog-pct {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-tomato-deep);
  background: #fffdf7;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
}

/* Budget */
.groceries__budget-num {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 52px;
  letter-spacing: -2px;
  color: var(--kubo-text);
  line-height: 1;
  margin-top: 8px;
}
.groceries__budget-unit {
  font-style: normal;
  font-size: 22px;
  opacity: .5;
  margin-left: 4px;
}

/* Rayon list */
.groceries__rayon-list { margin-top: 10px; display: flex; flex-direction: column; }
.groceries__rayon-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 0;
  font-size: 11px;
  border-top: 1px dashed var(--kubo-border);
}
.groceries__rayon-row:first-child { border-top: none; }
.groceries__rayon-emoji { font-size: 13px; }
.groceries__rayon-name { flex: 1; font-weight: 700; color: var(--kubo-text); }
.groceries__rayon-count { font-family: var(--font-mono); color: var(--kubo-green); font-weight: 700; }

/* Category grid */
.groceries__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding-bottom: 40px;
}

.groceries__category-card { padding: 20px; }

.groceries__cat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--kubo-border);
}
.groceries__cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.groceries__cat-icon--sage   { background: var(--kubo-green-light); }
.groceries__cat-icon--tomato { background: var(--kubo-tomato-soft); }
.groceries__cat-icon--ochre  { background: var(--kubo-ochre-soft); }
.groceries__cat-icon--blue   { background: var(--kubo-blue-soft); }
.groceries__cat-icon--mute   { background: var(--kubo-surface-mute); }

.groceries__cat-title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 19px;
  letter-spacing: -0.3px;
  flex: 1;
  color: var(--kubo-text);
}
.groceries__cat-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--kubo-text-faint);
  font-weight: 700;
}

/* Items */
.groceries__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid transparent;
  transition: opacity var(--transition-base);
}
.groceries__item + .groceries__item { border-top-color: var(--kubo-border); }
.groceries__item--checked { opacity: .5; }
.groceries__item--checked .groceries__item-name { text-decoration: line-through; }
.groceries__item--flash { background: var(--kubo-green-light); border-radius: var(--radius-sm); padding-left: 8px; padding-right: 8px; }

.groceries__check {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1.5px solid var(--kubo-border-mid);
  background: var(--kubo-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-base);
}
.groceries__check:hover { border-color: var(--kubo-green); }
.groceries__check--on { background: var(--kubo-green); border-color: var(--kubo-green); color: #fff; }
.groceries__check:disabled { cursor: wait; }

.groceries__item-name {
  flex: 1;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--kubo-text);
}
.groceries__item-qty {
  font-size: 11px;
  color: var(--kubo-text-muted);
  font-family: var(--font-mono);
  font-weight: 600;
}
.groceries__item-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--kubo-text-faint);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: .4;
  transition: opacity var(--transition-base), color var(--transition-base);
}
.groceries__item-remove:hover { opacity: 1; color: var(--kubo-tomato-deep); }

/* Empty */
.groceries__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 24px;
  text-align: center;
}
.groceries__empty-icon {
  width: 80px; height: 80px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-2xl);
  display: flex; align-items: center; justify-content: center;
  color: var(--kubo-text-muted);
}
.groceries__empty-title { font-size: 20px; font-weight: 700; color: var(--kubo-text); }
.groceries__empty-hint { font-size: 14px; color: var(--kubo-text-muted); max-width: 360px; line-height: 1.6; }

/* Spinners */
.spinner-white { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-sage  { width: 28px; height: 28px; border: 3px solid var(--kubo-border); border-top-color: var(--kubo-green); border-radius: 50%; animation: spin .7s linear infinite; }
.spinner-xs    { width: 12px; height: 12px; border: 2px solid var(--kubo-border); border-top-color: var(--kubo-green); border-radius: 50%; animation: spin .6s linear infinite; }
.groceries__loading { display: flex; justify-content: center; padding: 40px 0; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 800px) {
  .groceries__bento-header { grid-template-columns: repeat(6, 1fr); }
  .bento-col-5 { grid-column: span 6; }
  .bento-col-4 { grid-column: span 6; }
  .bento-col-3 { grid-column: span 6; }
  .groceries__grid { grid-template-columns: 1fr; }
}
</style>

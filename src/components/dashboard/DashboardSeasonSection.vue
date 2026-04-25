<script setup lang="ts">
/**
 * DashboardSeasonSection — Section "Produits de saison" avec sélecteur de mois
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSeasonStore } from '@/stores/seasonStore'
import { getSeasonImage } from '@/data/seasonImages'

const seasonStore = useSeasonStore()
const { fruits, legumes, loading: seasonLoading, currentMonth } = storeToRefs(seasonStore)

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

const currentMonthName = computed(() => MONTH_NAMES[currentMonth.value - 1] ?? '')
void currentMonthName

function selectMonth(mois: number) {
  seasonStore.setMonth(mois)
  seasonStore.init(mois)
}
</script>

<template>
  <section class="season-section" data-testid="season-section">
    <div class="season-section__header">
      <div class="season-section__title-block">
        <span class="season-section__dot" />
        <h2 class="season-section__title">Produits de saison</h2>
      </div>
      <!-- Sélecteur de mois -->
      <div class="season-month-picker">
        <button
          v-for="(name, idx) in MONTH_NAMES"
          :key="idx"
          :class="['season-month-btn', { 'season-month-btn--active': currentMonth === idx + 1 }]"
          @click="selectMonth(idx + 1)"
        >
          {{ name.slice(0, 3) }}
        </button>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="seasonLoading" class="season-section__skeleton">
      <div v-for="n in 10" :key="n" class="season-skeleton-item">
        <div class="season-skeleton-item__img" />
        <div class="season-skeleton-item__label" />
      </div>
    </div>

    <template v-else>
      <!-- Légumes -->
      <div v-if="legumes.length" class="season-section__group">
        <h3 class="season-section__group-label">🥦 Légumes</h3>
        <div class="season-grid">
          <div
            v-for="item in legumes"
            :key="item.nom"
            class="season-item"
            data-testid="season-item"
          >
            <div class="season-item__img-wrap">
              <img
                v-if="getSeasonImage(item.nom, item.type).url"
                :src="getSeasonImage(item.nom, item.type).url"
                :alt="item.nom"
                class="season-item__img"
                loading="lazy"
                @error="
                  (e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                    ;(e.target as HTMLImageElement).nextElementSibling!.removeAttribute('hidden')
                  }
                "
              />
              <span hidden class="season-item__emoji-fallback">{{
                getSeasonImage(item.nom, item.type).emoji
              }}</span>
              <span
                v-if="!getSeasonImage(item.nom, item.type).url"
                class="season-item__emoji-fallback"
                >{{ getSeasonImage(item.nom, item.type).emoji }}</span
              >
            </div>
            <span class="season-item__name">{{ item.nom }}</span>
          </div>
        </div>
      </div>

      <!-- Fruits -->
      <div v-if="fruits.length" class="season-section__group">
        <h3 class="season-section__group-label">🍎 Fruits</h3>
        <div class="season-grid">
          <div v-for="item in fruits" :key="item.nom" class="season-item" data-testid="season-item">
            <div class="season-item__img-wrap">
              <img
                v-if="getSeasonImage(item.nom, item.type).url"
                :src="getSeasonImage(item.nom, item.type).url"
                :alt="item.nom"
                class="season-item__img"
                loading="lazy"
                @error="
                  (e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                    ;(e.target as HTMLImageElement).nextElementSibling!.removeAttribute('hidden')
                  }
                "
              />
              <span hidden class="season-item__emoji-fallback">{{
                getSeasonImage(item.nom, item.type).emoji
              }}</span>
              <span
                v-if="!getSeasonImage(item.nom, item.type).url"
                class="season-item__emoji-fallback"
                >{{ getSeasonImage(item.nom, item.type).emoji }}</span
              >
            </div>
            <span class="season-item__name">{{ item.nom }}</span>
          </div>
        </div>
      </div>

      <!-- Aucun résultat -->
      <p v-if="!legumes.length && !fruits.length" class="season-section__empty">
        Aucun produit de saison trouvé pour ce mois.
      </p>
    </template>
  </section>
</template>

<style scoped>
.season-section {
  margin-top: 48px;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}
@media (max-width: 768px) {
  .season-section {
    padding: 24px;
    border-radius: 20px;
  }
}

.season-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
}

.season-section__title-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.season-section__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--kubo-green);
  flex-shrink: 0;
}

.season-section__title {
  font-size: 18px;
  font-weight: 800;
  color: var(--kubo-text);
}

.season-month-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.season-month-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  letter-spacing: 0.02em;
}

.season-month-btn--active {
  background: var(--kubo-surface);
  color: var(--kubo-green);
  box-shadow: var(--shadow-card);
}

.season-month-btn:not(.season-month-btn--active):hover {
  color: var(--kubo-text);
  background: var(--kubo-border);
}

.season-section__group {
  margin-bottom: 28px;
}

.season-section__group-label {
  font-size: 15px;
  font-weight: 800;
  color: var(--kubo-text);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.season-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
}

.season-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: default;
}

.season-item__img-wrap {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl, 16px);
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.season-item:hover .season-item__img-wrap {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}

.season-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.season-item__emoji-fallback {
  font-size: 40px;
  line-height: 1;
}

.season-item__name {
  font-size: 11px;
  font-weight: 700;
  color: var(--kubo-text);
  text-align: center;
  line-height: 1.3;
  max-width: 88px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.season-section__skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.season-skeleton-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.season-skeleton-item__img {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl, 16px);
  background: var(--kubo-surface-mute);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.season-skeleton-item__label {
  width: 56px;
  height: 10px;
  border-radius: 4px;
  background: var(--kubo-surface-mute);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
  animation-delay: 0.1s;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.season-section__empty {
  font-size: 14px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  font-style: italic;
}
</style>

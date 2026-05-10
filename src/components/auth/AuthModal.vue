<script setup lang="ts">
/**
 * AuthModal — Modale login / register par-dessus le shell
 * Le fond (catalog) reste visible et flouté derrière.
 * Fermeture : croix, clic sur l'overlay, ou Échap.
 *
 * Les formulaires sont délégués à AuthLoginForm et AuthRegisterForm.
 */
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import AuthLoginForm from '@/components/auth/AuthLoginForm.vue'
import AuthRegisterForm from '@/components/auth/AuthRegisterForm.vue'

const uiStore = useUiStore()
const isLogin = computed(() => uiStore.currentView === 'login')

function close(): void {
  uiStore.navTo('catalog')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!-- Overlay flouté -->
  <div class="auth-overlay" aria-modal="true" role="dialog" @click.self="close">
    <!-- Carte modale -->
    <div class="auth-modal">
      <!-- Bouton fermer -->
      <button class="auth-modal__close" aria-label="Fermer" @click="close">
        <KuboIcon name="x" :size="18" />
      </button>

      <!-- Logo -->
      <div class="auth-modal__logo">
        <div class="auth-modal__logo-mark">k</div>
        <span class="auth-modal__logo-name">kubo</span>
      </div>

      <!-- Formulaires -->
      <AuthLoginForm v-if="isLogin" />
      <AuthRegisterForm v-else />
    </div>
  </div>
</template>

<style scoped>
/* ── Overlay ── */
.auth-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── Carte ── */
.auth-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-2xl);
  padding: 40px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}

/* ── Croix ── */
.auth-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--kubo-border);
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}
.auth-modal__close:hover {
  background: var(--kubo-surface);
  color: var(--kubo-text);
  border-color: var(--kubo-border-mid);
}

/* ── Logo ── */
.auth-modal__logo {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 32px;
}
.auth-modal__logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--kubo-green);
  color: var(--kubo-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--kubo-green-shadow);
}
.auth-modal__logo-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-style: italic;
  font-size: 26px;
  letter-spacing: -0.5px;
  color: var(--kubo-sage-deep);
  line-height: 1;
}
</style>

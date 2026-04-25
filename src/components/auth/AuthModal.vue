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
        <div class="auth-modal__logo-icon">
          <span class="auth-modal__logo-k">K</span>
        </div>
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
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
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
  gap: 10px;
  margin-bottom: 28px;
}
.auth-modal__logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--kubo-green);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--kubo-green-shadow);
  flex-shrink: 0;
}
.auth-modal__logo-k {
  color: #fff;
  font-weight: 900;
  font-size: 20px;
  line-height: 1;
}
.auth-modal__logo-name {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--kubo-green);
}
</style>

<script setup>
import { useApp } from '@/composables/useApp.js'
const { toastMessage, toastVisible } = useApp()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastVisible" class="toast">
        <span class="toast__dot" />
        <span class="toast__text">{{ toastMessage }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--kubo-surface-inv);
  color: var(--kubo-surface);
  padding: 14px 28px;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.toast__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
  flex-shrink: 0;
}
.toast__text {
  font-size: 13px;
  font-weight: 700;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

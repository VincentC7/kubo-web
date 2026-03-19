<script setup lang="ts">
/**
 * KuboButton — Atome bouton polyvalent
 * Variantes : primary | secondary | ghost | danger | dark
 * Tailles : sm | md | lg
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    fullWidth?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
)
defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :class="[
      'kubo-btn',
      `kubo-btn--${variant}`,
      `kubo-btn--${size}`,
      { 'kubo-btn--full': fullWidth, 'kubo-btn--loading': loading },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="kubo-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.kubo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-base);
  font-weight: 800;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: all var(--transition-bounce);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.kubo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.kubo-btn:not(:disabled):hover {
  transform: scale(1.03);
}

.kubo-btn:not(:disabled):active {
  transform: scale(0.97);
}

/* Sizes */
.kubo-btn--sm {
  padding: 8px 16px;
  font-size: 11px;
  border-radius: var(--radius-sm);
}

.kubo-btn--md {
  padding: 12px 24px;
  font-size: 13px;
}

.kubo-btn--lg {
  padding: 16px 40px;
  font-size: 14px;
  border-radius: var(--radius-xl);
}

.kubo-btn--full {
  width: 100%;
}

/* Variants */
.kubo-btn--primary {
  background: var(--kubo-green);
  color: #fff;
  box-shadow: 0 8px 20px -4px var(--kubo-green-shadow);
}

.kubo-btn--primary:not(:disabled):hover {
  background: var(--kubo-green-dark);
}

.kubo-btn--secondary {
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  border: 1px solid var(--kubo-border);
}

.kubo-btn--secondary:not(:disabled):hover {
  background: var(--kubo-surface);
  color: var(--kubo-text);
  border-color: var(--kubo-border-mid);
}

.kubo-btn--ghost {
  background: transparent;
  color: var(--kubo-text-muted);
}

.kubo-btn--ghost:not(:disabled):hover {
  background: var(--kubo-surface-mute);
  color: var(--kubo-text);
}

.kubo-btn--dark {
  background: var(--kubo-surface-inv);
  color: var(--kubo-surface);
  box-shadow: var(--shadow-lg);
}

.kubo-btn--dark:not(:disabled):hover {
  opacity: 0.85;
}

.kubo-btn--danger {
  background: #fef2f2;
  color: #dc2626;
}

.kubo-btn--danger:not(:disabled):hover {
  background: #fee2e2;
}

/* Spinner */
.kubo-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
</style>

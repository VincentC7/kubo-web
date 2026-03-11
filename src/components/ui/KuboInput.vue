<script setup>
/**
 * KuboInput — Atome champ de saisie
 */
defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  label: { type: String, default: null },
  icon: { type: String, default: null },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="kubo-input-wrapper">
    <label v-if="label" class="kubo-input-label">{{ label }}</label>
    <div class="kubo-input-field">
      <slot name="icon" />
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        class="kubo-input"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>
  </div>
</template>

<style scoped>
.kubo-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kubo-input-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--kubo-text-muted);
}

.kubo-input-field {
  position: relative;
  display: flex;
  align-items: center;
}

.kubo-input-field :slotted(*) {
  position: absolute;
  left: 14px;
  color: var(--kubo-text-faint);
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.kubo-input {
  width: 100%;
  background: var(--kubo-surface-mute);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  font-family: var(--font-base);
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text);
  outline: none;
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.kubo-input:focus {
  border-color: var(--kubo-green);
  box-shadow: 0 0 0 3px var(--kubo-green-shadow);
}

.kubo-input-field :slotted(*) ~ .kubo-input {
  padding-left: 40px;
}
</style>

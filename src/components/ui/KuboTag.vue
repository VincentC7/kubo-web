<script setup>
/**
 * KuboTag — Atome pastille de tag colorée
 */
const TAG_COLORS = {
  Bio: 'green',
  Vege: 'green',
  Frais: 'green',
  Epice: 'red',
  Gourmand: 'red',
  Gratine: 'red',
  Proteines: 'blue',
  AOP: 'blue',
  Gourmet: 'purple',
  Express: 'orange',
  Nouveau: 'pink',
  Leger: 'default',
  Crunchy: 'default',
  Noix: 'default',
}

const props = defineProps({
  label: { type: String, required: true },
  color: { type: String, default: null },
})

const colorClass = props.color
  ? `kubo-tag--${props.color}`
  : `kubo-tag--${TAG_COLORS[props.label] ?? 'default'}`
</script>

<template>
  <span :class="['kubo-tag', colorClass]">{{ label }}</span>
</template>

<style scoped>
.kubo-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.6;
}
.kubo-tag--green {
  background: #059669;
  color: #fff;
}
.kubo-tag--red {
  background: #dc2626;
  color: #fff;
}
.kubo-tag--blue {
  background: #2563eb;
  color: #fff;
}
.kubo-tag--orange {
  background: #ea580c;
  color: #fff;
}
.kubo-tag--purple {
  background: #7c3aed;
  color: #fff;
}
.kubo-tag--default {
  background: #64748b;
  color: #fff;
}
.kubo-tag--pink {
  background: #db2777;
  color: #fff;
}
</style>

<script setup lang="ts">
defineProps<{ mensagem?: string | null; tipo?: "erro" | "ok" }>();
</script>
<template>
  <p
    v-if="mensagem"
    class="rounded-xl px-4 py-3 text-sm border"
    :class="tipo === 'ok'
      ? 'border-esmeralda/40 bg-esmeralda/10 text-esmeralda'
      : 'border-rubi/40 bg-rubi/10 text-rubi'"
  >{{ mensagem }}</p>
</template>

<script setup lang="ts">
defineProps<{ mensagem?: string | null; tipo?: "erro" | "ok" }>();
</script>
<template>
  <p
    v-if="mensagem"
    class="rounded-lg px-4 py-3 text-sm font-semibold border-2 border-tinta shadow-blocoP"
    :class="tipo === 'ok' ? 'bg-verde text-papel' : 'bg-laranja text-papel'"
  >{{ mensagem }}</p>
</template>

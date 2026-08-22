<script setup lang="ts">
defineProps<{ mensagem?: string | null }>();
</script>
<template>
  <p
    v-if="mensagem"
    class="mt-2 flex items-start gap-2 rounded-lg border-2 border-tinta bg-laranja text-papel
           px-3 py-2 text-sm font-bold shadow-blocoP animate-colar"
    role="alert"
  >
    <span aria-hidden="true">!</span>
    <span>{{ mensagem }}</span>
  </p>
</template>

<script setup lang="ts">
import { linkDaFoto } from "~/lib/api";

const props = defineProps<{ src?: string | null; alt?: string; classe?: string }>();
const endereco = ref<string | null>(null);
const falhou = ref(false);

async function resolver() {
  falhou.value = false;
  endereco.value = null;
  if (!props.src) return;
  try {
    endereco.value = await linkDaFoto(props.src);
    if (!endereco.value) falhou.value = true;
  } catch { falhou.value = true; }
}

watch(() => props.src, resolver, { immediate: true });
</script>

<template>
  <img v-if="endereco" :src="endereco" :alt="alt ?? ''" :class="classe" />
  <span
    v-else-if="falhou"
    :class="classe"
    class="grid place-items-center bg-cartao text-fumaca text-xs font-semibold"
  >foto indisponível</span>
  <span v-else :class="classe" class="block bg-risco/40 animate-pulse" />
</template>

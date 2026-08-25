<script setup lang="ts">
const props = withDefaults(defineProps<{
  url?: string | null; nome?: string; tamanho?: number;
  selo?: boolean; streak?: number;
}>(), { tamanho: 40, selo: false, streak: 0 });

const iniciais = computed(() =>
  (props.nome ?? "?").trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase());
const marca = computed(() => Math.max(16, Math.round(props.tamanho * 0.42)));
</script>

<template>
  <span
    class="relative inline-block shrink-0 rounded-full overflow-visible"
    :style="{ width: tamanho + 'px', height: tamanho + 'px', minWidth: tamanho + 'px', minHeight: tamanho + 'px' }"
  >
    <img
      v-if="url" :src="url" :alt="nome ? `Foto de ${nome}` : 'Foto de perfil'"
      class="w-full h-full object-cover rounded-full border-2 border-tinta"
    />
    <span
      v-else
      class="w-full h-full rounded-full border-2 border-tinta bg-amarelo grid place-items-center
             font-display uppercase leading-none"
      :style="{ fontSize: Math.round(tamanho * 0.38) + 'px' }"
    >{{ iniciais }}</span>

    <span
      v-if="selo"
      class="absolute -bottom-1 -right-1 rounded-full bg-amarelo border-2 border-tinta grid place-items-center"
      :style="{ width: marca + 'px', height: marca + 'px' }"
      :title="streak ? `${streak} dias de streak` : 'Squad com selo dourado'"
    >
      <EmojiCristao codigo="coroa" :tamanho="Math.round(marca * 0.62)" />
    </span>
  </span>
</template>

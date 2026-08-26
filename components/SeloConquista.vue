<script setup lang="ts">
const props = defineProps<{ selo: any; imagem: string }>();
const virado = ref(false);
const { destaque } = useConquistas();
const emFoco = computed(() => destaque.value === props.selo.codigo);
</script>

<template>
  <div
    class="[perspective:1000px] h-full rounded-xl transition"
    :data-selo="selo.codigo"
    :class="emFoco ? 'animate-piscar' : ''"
  >
    <button
      type="button"
      class="relative w-full h-full min-h-[11.5rem] sm:min-h-[13rem] text-left
             [transform-style:preserve-3d] transition-transform duration-500"
      :style="virado ? 'transform: rotateY(180deg)' : ''"
      :aria-label="virado ? `Ver ${selo.titulo}` : `Ver a regra de ${selo.titulo}`"
      @click="virado = !virado"
    >
      <!-- frente -->
      <span
        class="absolute inset-0 [backface-visibility:hidden] painel px-2 py-2.5
               flex flex-col items-center overflow-hidden"
      >
        <span class="flex items-center justify-center gap-0.5 shrink-0">
          <svg v-for="i in selo.estrelas" :key="i" width="13" height="13" viewBox="0 0 24 24"
               :fill="selo.conquistado ? '#F5CE16' : 'none'"
               :stroke="selo.conquistado ? '#151310' : 'currentColor'"
               stroke-width="1.8" stroke-linejoin="round"
               :class="selo.conquistado ? '' : 'text-fumaca'">
            <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
          </svg>
        </span>

        <span class="w-full flex-1 min-h-0 grid place-items-center py-1">
          <img
            :src="imagem" :alt="selo.titulo"
            class="max-w-full max-h-full object-contain"
            :style="selo.conquistado ? '' : 'filter: brightness(.55) saturate(.75); opacity:.6;'"
          />
        </span>

        <span
          class="block w-full shrink-0 text-[10px] font-semibold text-center leading-tight
                 break-words line-clamp-2"
          :class="selo.conquistado ? '' : 'text-fumaca'"
        >{{ selo.sub || selo.frase }}</span>
      </span>

      <!-- verso -->
      <span
        class="absolute inset-0 [backface-visibility:hidden] painel p-3 flex flex-col
               justify-center text-center overflow-hidden"
        style="transform: rotateY(180deg)"
      >
        <span class="rotulo text-base">como conquistar</span>
        <span class="block font-bold text-[11px] sm:text-xs mt-2 leading-snug break-words">
          {{ selo.regra }}
        </span>
        <span class="block font-marca text-base mt-3"
              :class="selo.conquistado ? 'text-verde' : 'text-fumaca'">
          {{ selo.conquistado ? 'conquistado!' : 'seja intencional pra chegar lá' }}
        </span>
      </span>
    </button>
  </div>
</template>

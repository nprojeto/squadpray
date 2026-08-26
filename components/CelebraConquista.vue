<script setup lang="ts">
const { pendentes, verificar, confirmar } = useConquistas();
const base = useRuntimeConfig().app.baseURL;
const imagem = (c: string) => `${base.replace(/\/$/, "")}/selos/${c}.png`;

const atual = computed(() => pendentes.value[0] ?? null);
const cartao = ref<HTMLElement | null>(null);
const voando = ref(false);

const rota = useRoute();
const pronto = ref(false);

onMounted(() => { verificar(); });

// leva o fundo para a tela de conquistas e centraliza o lugar do selo
watch(atual, async (v) => {
  if (!import.meta.client) return;
  document.body.style.overflow = v ? "hidden" : "";
  pronto.value = false;
  if (!v) return;

  if (rota.path !== "/conquistas") {
    await navigateTo("/conquistas");
    await new Promise((r) => setTimeout(r, 700));
  } else {
    await nextTick();
  }

  const alvo = document.querySelector(`[data-selo="${v.codigo}"]`);
  if (alvo) {
    document.body.style.overflow = "";
    alvo.scrollIntoView({ block: "center", behavior: "auto" });
    document.body.style.overflow = "hidden";
  }
  pronto.value = true;
}, { immediate: true });
onUnmounted(() => { if (import.meta.client) document.body.style.overflow = ""; });

async function receber() {
  const selo = atual.value;
  if (!selo || voando.value) return;
  voando.value = true;

  const alvo =
    document.querySelector(`[data-selo="${selo.codigo}"]`) ??
    document.querySelector('a[href$="/conquistas"]');

  const el = cartao.value;
  if (el && alvo) {
    const de = el.getBoundingClientRect();
    const para = (alvo as HTMLElement).getBoundingClientRect();
    const dx = para.left + para.width / 2 - (de.left + de.width / 2);
    const dy = para.top + para.height / 2 - (de.top + de.height / 2);
    const escala = Math.max(0.12, Math.min(para.width / de.width, 0.6));

    el.style.transition = "transform .95s cubic-bezier(.5,-0.2,.3,1), opacity .95s ease-in";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${escala}) rotateY(720deg)`;
    el.style.opacity = "0.15";
    await new Promise((r) => setTimeout(r, 950));
  }

  await confirmar(selo.codigo);
  voando.value = false;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="atual"
      class="fixed inset-0 z-[100] grid place-items-center p-5"
      role="dialog" aria-modal="true"
    >
      <div class="absolute inset-0 bg-tinta/80 backdrop-blur-sm" />

      <div
        ref="cartao"
        class="relative w-full max-w-xs painel p-6 text-center [transform-style:preserve-3d] animate-colar"
      >
        <p class="rotulo text-xl">você conquistou o selo</p>

        <div class="flex items-center justify-center gap-1 mt-3">
          <svg v-for="i in atual.estrelas" :key="i" width="18" height="18" viewBox="0 0 24 24"
               fill="#F5CE16" stroke="#151310" stroke-width="1.8" stroke-linejoin="round"
               class="animate-colar" :style="{ animationDelay: `${i * 90}ms` }">
            <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
          </svg>
        </div>

        <img :src="imagem(atual.codigo)" :alt="atual.titulo" class="w-full max-w-[220px] mx-auto mt-3" />

        <h2 class="text-3xl mt-2 leading-tight">{{ atual.titulo }}</h2>
        <p class="font-semibold text-sm mt-2">{{ atual.sub || atual.frase }}</p>
        <p class="font-marca text-lg text-laranja mt-3">{{ atual.regra }}</p>

        <button class="btn-ouro w-full mt-6" :disabled="voando" @click="receber">
          {{ voando ? "Guardando…" : "Recebi!" }}
        </button>

        <p v-if="pendentes.length > 1" class="text-xs font-semibold text-fumaca mt-3">
          mais {{ pendentes.length - 1 }} esperando você
        </p>
      </div>
    </div>
  </Teleport>
</template>

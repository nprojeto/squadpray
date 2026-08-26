<script setup lang="ts">
import { api } from "~/lib/api";

const { perfil, tourVisto, carregar } = useSessao();
const base = useRuntimeConfig().app.baseURL;
const heroi = (n: string) => `${base.replace(/\/$/, "")}/tour/${n}.png`;

const aberto = ref(false);
const passo = ref(0);
const alvo = ref<DOMRect | null>(null);

const primeiroNome = computed(() => perfil.value?.nome?.split(" ")[0] ?? "");

const passos = computed(() => [
  {
    quem: "ernane",
    titulo: `Boas-vindas, ${primeiroNome.value}!`,
    texto: "Aqui a fé é treinada em turma. Vem que a gente te mostra a casa em um minuto.",
    seletor: null,
  },
  {
    quem: "fernanda",
    titulo: "Meus squads",
    texto: "É o seu quartel-general. Todos os squads que você criou ou entrou ficam aqui, separados entre em andamento, concluídos e cancelados.",
    seletor: '[data-tour="painel"]',
  },
  {
    quem: "ernane",
    titulo: "Como funciona o streak",
    texto: "Todo dia uma pessoa da escala escreve, e as outras leem e reagem. Se todo mundo cumprir, o dia conta. Se um falhar, a contagem do squad volta ao zero — mas o seu streak pessoal continua.",
    seletor: '[data-tour="painel"]',
  },
  {
    quem: "fernanda",
    titulo: "Explorar",
    texto: "Aqui você descobre squads que estão se formando e pede para entrar, ou acompanha de longe os que já começaram.",
    seletor: '[data-tour="explorar"]',
  },
  {
    quem: "ernane",
    titulo: "Rede",
    texto: "A turma toda da plataforma. Procure por nome ou igreja, favorite quem você quer acompanhar e visite o perfil de cada um.",
    seletor: '[data-tour="rede"]',
  },
  {
    quem: "fernanda",
    titulo: "Convites",
    texto: "Chegou convite para um squad? Aparece aqui. E se alguém pedir para entrar no squad que você criou, é por aqui que você responde.",
    seletor: '[data-tour="convites"]',
  },
  {
    quem: "ernane",
    titulo: "Galeria dos Heróis",
    texto: "São 18 selos esperando por você. Toque em qualquer figurinha para descobrir o que é preciso para conquistar.",
    seletor: '[data-tour="conquistas"]',
  },
  {
    quem: "fernanda",
    titulo: "Notificações",
    texto: "O sino avisa quando o artigo do dia sai, quando entra gente nova e quando você conquista um selo.",
    seletor: '[data-tour="sino"]',
  },
  {
    quem: "ernane",
    titulo: "Seu perfil",
    texto: "Sua foto, sua igreja, seus ministérios e seus pontos. É aqui também que você troca o tema e escolhe se quer aparecer na rede.",
    seletor: '[data-tour="conta"]',
  },
  {
    quem: "fernanda",
    titulo: "É isso, bora!",
    texto: "Crie o seu squad, chame a galera e comece o ciclo. A gente se vê por aí.",
    seletor: null,
  },
]);

const atual = computed(() => passos.value[passo.value]);
const ultimo = computed(() => passo.value === passos.value.length - 1);

function medir() {
  const sel = atual.value?.seletor;
  if (!sel) { alvo.value = null; return; }
  const el = document.querySelector(sel) as HTMLElement | null;
  const visivel = el && el.offsetParent !== null;
  const fallback = document.querySelector('[data-tour="menu"]') as HTMLElement | null;
  const escolhido = visivel ? el : fallback;
  alvo.value = escolhido ? escolhido.getBoundingClientRect() : null;
}

watch(passo, () => nextTick(medir));
watch(aberto, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? "hidden" : "";
  if (v) nextTick(medir);
});

onMounted(() => {
  window.addEventListener("resize", medir);
  setTimeout(() => { if (!tourVisto.value) aberto.value = true; }, 900);
});
onUnmounted(() => {
  window.removeEventListener("resize", medir);
  if (import.meta.client) document.body.style.overflow = "";
});

// permite reabrir pelo perfil
const { abrirTour } = useTour();
watch(abrirTour, (v) => { if (v) { passo.value = 0; aberto.value = true; abrirTour.value = false; } });

function avancar() { if (ultimo.value) concluir(); else passo.value++; }
function voltar() { if (passo.value > 0) passo.value--; }

async function concluir() {
  aberto.value = false;
  try { await api.atualizarPerfil({ tour_visto: true } as any); await carregar(); } catch { /* segue */ }
}

// posição do balão: perto do alvo, sem sair da tela
const ancorado = computed(() => !!alvo.value);

const estiloBalao = computed(() => {
  if (!alvo.value || !import.meta.client) {
    return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }
  const a = alvo.value;
  const larguraBalao = Math.min(window.innerWidth * 0.92, 416);
  const topo = Math.min(a.bottom + 16, Math.max(12, window.innerHeight - 360));
  const meio = a.left + a.width / 2;
  const esq = Math.max(12, Math.min(meio - larguraBalao / 2, window.innerWidth - 12 - larguraBalao));
  return { top: `${topo}px`, left: `${esq}px` };
});
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="fixed inset-0 z-[110]">
      <div class="absolute inset-0 bg-tinta/75" @click.self="() => {}" />

      <!-- destaque em volta do alvo -->
      <div
        v-if="alvo"
        class="absolute rounded-xl border-4 border-amarelo pointer-events-none animate-pulsoTour"
        :style="{
          left: alvo.left - 8 + 'px',
          top: alvo.top - 8 + 'px',
          width: alvo.width + 16 + 'px',
          height: alvo.height + 16 + 'px',
          boxShadow: '0 0 0 9999px rgba(21,19,16,.75)',
        }"
      />

      <!-- balão -->
      <div class="absolute w-[min(92vw,26rem)]" :style="estiloBalao">
        <div class="flex items-end gap-1">
          <img
            :src="heroi(atual.quem)" :alt="atual.quem === 'ernane' ? 'Ernane' : 'Fernanda'"
            class="w-24 sm:w-28 shrink-0 animate-gingar"
            :key="atual.quem"
          />

          <div class="painel p-5 flex-1 relative">
            <span
              v-if="ancorado"
              class="absolute -top-2.5 left-8 w-4 h-4 bg-cartao border-t-2 border-l-2 border-tinta rotate-45"
            />

            <img
              v-if="passo === 0" :src="`${base}logo.png`" alt="SquadPray"
              class="w-16 h-16 rounded-full border-2 border-tinta mb-3"
            />
            <p class="rotulo text-lg">passo {{ passo + 1 }} de {{ passos.length }}</p>
            <h2 class="text-2xl mt-1 leading-tight">{{ atual.titulo }}</h2>
            <p class="text-sm font-semibold mt-2 leading-snug">{{ atual.texto }}</p>

            <div class="flex items-center gap-2 mt-5">
              <button v-if="passo > 0" class="btn-vidro !py-2 text-xs" @click="voltar">Voltar</button>
              <button class="btn-ouro !py-2 text-xs flex-1" @click="avancar">
                {{ ultimo ? "Bora começar!" : "Avançar" }}
              </button>
            </div>

            <button v-if="!ultimo" class="btn-fantasma w-full !py-1.5 text-xs mt-1" @click="concluir">
              Pular apresentação
            </button>

            <div class="flex justify-center gap-1.5 mt-3">
              <span
                v-for="(x, i) in passos" :key="i"
                class="w-2 h-2 rounded-full border-2 border-tinta transition"
                :class="i === passo ? 'bg-laranja' : 'bg-cartao'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

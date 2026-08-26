<script setup lang="ts">
import { api, TIPOS_SQUAD, ehSemanal, precisaObjetivo, proximaSegunda, hojeISO, dataBR, type TipoSquad } from "~/lib/api";

const { carregar, meuSquadCriado } = useSessao();

const nome = ref("");
const tipo = ref<TipoSquad>("leitura_biblica");
const objetivo = ref("");
const descricao = ref("");
const inicio = ref(hojeISO());
const fim = ref("");
const erro = ref<string | null>(null);
const salvando = ref(false);
const eNome = ref<string | null>(null);
const eObjetivo = ref<string | null>(null);
const eInicio = ref<string | null>(null);
const eFim = ref<string | null>(null);

const semanal = computed(() => ehSemanal(tipo.value));

const coresTipo: Record<string, string> = {
  oracao: "bg-amarelo text-tinta",
  leitura_biblica: "bg-roxo text-tinta",
  devocional: "bg-laranja text-papel",
  jejum: "bg-rosa text-papel",
  livros: "bg-verde text-papel",
  celebracao: "bg-amarelo text-tinta",
  gdc: "bg-roxo text-tinta",
};

const ordemTipos: TipoSquad[] = [
  "oracao", "leitura_biblica", "devocional", "jejum", "livros", "celebracao", "gdc",
];
const inicioReal = computed(() => (semanal.value ? proximaSegunda(new Date(inicio.value + "T12:00:00")) : inicio.value));

const totalPeriodos = computed(() => {
  if (!fim.value || !inicioReal.value) return 0;
  const dias = Math.floor((+new Date(fim.value) - +new Date(inicioReal.value)) / 86400000) + 1;
  if (dias <= 0) return 0;
  return semanal.value ? Math.floor(dias / 7) : dias;
});
const valorPeriodo = computed(() => (totalPeriodos.value ? 100 / totalPeriodos.value : 0));

const minimoFim = computed(() => {
  const d = new Date(inicioReal.value + "T12:00:00");
  d.setDate(d.getDate() + (semanal.value ? 27 : 20));
  return d.toLocaleDateString("sv-SE");
});

const regraMinima = computed(() => semanal.value
  ? "No mínimo 4 encontros. O card abre assim que duas pessoas entrarem."
  : "Mínimo de 21 dias corridos. O card abre assim que duas pessoas entrarem.");

watch(tipo, () => { if (semanal.value) inicio.value = proximaSegunda(); });

function focar(id: string) {
  document.getElementById(id)?.focus();
  document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

async function criar() {
  erro.value = null;
  eNome.value = eObjetivo.value = eInicio.value = eFim.value = null;

  if (!nome.value.trim()) { eNome.value = "Dê um nome ao squad."; focar("n"); return; }
  if (precisaObjetivo(tipo.value) && objetivo.value.trim().length < 10) {
    eObjetivo.value = "Descreva o objetivo com pelo menos 10 caracteres."; focar("o"); return;
  }
  if (!inicio.value) { eInicio.value = "Escolha quando o ciclo começa."; focar("i"); return; }
  if (!fim.value) { eFim.value = "Escolha a data de término."; focar("f"); return; }

  const dias = Math.floor((+new Date(fim.value) - +new Date(inicioReal.value)) / 86400000) + 1;
  if (semanal.value) {
    if (totalPeriodos.value < 4) {
      eFim.value = `O ciclo precisa ter no mínimo 4 encontros. O seu tem ${totalPeriodos.value}.`;
      focar("f"); return;
    }
  } else if (dias < 21) {
    eFim.value = `O ciclo precisa ter no mínimo 21 dias corridos. O seu tem ${dias}.`;
    focar("f"); return;
  }
  salvando.value = true;
  try {
    const r: any = await api.criarSquad({
      nome: nome.value.trim(), tipo: tipo.value,
      objetivo: objetivo.value.trim() || undefined,
      descricao: descricao.value.trim() || undefined,
      data_inicio: inicioReal.value, data_fim: fim.value,
    });
    await carregar();
    await navigateTo(`/squad/${r.squad.id}`);
  } catch (e: any) { erro.value = e.message; }
  finally { salvando.value = false; }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <NuxtLink to="/painel" class="rotulo hover:text-tinta">← meus squads</NuxtLink>
    <h1 class="text-4xl mt-4">Criar meu squad</h1>
    <p class="text-fumaca mt-2">Você pode ter um squad criado por você e participar de outros dois como convidado.</p>

    <div v-if="meuSquadCriado" class="painel p-7 mt-8 text-center">
      <EmojiCristao codigo="coroa" :tamanho="40" class="mx-auto" />
      <h2 class="text-3xl mt-4">Você já tem um squad aberto</h2>
      <p class="font-semibold mt-2 text-sm">
        Seu squad é <span class="bg-amarelo px-1">{{ meuSquadCriado.nome }}</span>.
        Quando ele for concluído, cancelado ou excluído, você pode criar outro.
      </p>
      <NuxtLink :to="`/squad/${meuSquadCriado.id}`" class="btn-ouro mt-6">Abrir meu squad</NuxtLink>
    </div>

    <form v-else novalidate class="painel p-7 mt-8 space-y-6" @submit.prevent="criar">
      <div>
        <label for="tipo">O que este squad vai fazer</label>
        <div class="space-y-2">
          <button
            v-for="(k, i) in ordemTipos" :key="k" type="button"
            class="w-full flex items-center justify-between gap-3 border-2 border-tinta
                   px-4 py-2.5 transition"
            :class="[
              tipo === k ? `${coresTipo[k]} shadow-blocoP` : 'bg-cartao text-fumaca hover:bg-amarelo/40',
              i % 2 ? 'rotate-[.4deg]' : '-rotate-[.5deg]',
            ]"
            @click="tipo = k"
          >
            <span class="font-display text-xl sm:text-2xl uppercase">{{ TIPOS_SQUAD[k].nome }}</span>
            <span class="font-bold text-[10px] sm:text-xs uppercase tracking-widest">
              {{ TIPOS_SQUAD[k].frequencia }}
            </span>
          </button>
        </div>
      </div>

      <div>
        <label for="n">Nome do squad</label>
        <input id="n" v-model="nome" placeholder="Ex.: Guerreiros da Madrugada"
               :class="eNome ? '!border-laranja' : ''" @input="eNome = null" />
        <CampoErro :mensagem="eNome" />
      </div>

      <div v-if="precisaObjetivo(tipo)">
        <label for="o">Objetivo deste squad</label>
        <textarea id="o" v-model="objetivo" rows="3"
          placeholder="Pelo que este squad vai orar ou jejuar?"
          :class="eObjetivo ? '!border-laranja' : ''" @input="eObjetivo = null" />
        <p class="text-xs text-fumaca font-semibold mt-1">Obrigatório para oração e jejum.</p>
        <CampoErro :mensagem="eObjetivo" />
      </div>

      <div>
        <label for="d">Descrição (opcional)</label>
        <textarea id="d" v-model="descricao" rows="2" placeholder="Combinados do grupo, livro escolhido, plano de leitura…" />
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label for="i">Começa em</label>
          <input id="i" v-model="inicio" type="date" :min="hojeISO()"
                 :class="eInicio ? '!border-laranja' : ''" @input="eInicio = null" />
          <CampoErro :mensagem="eInicio" />
          <p v-if="semanal" class="text-xs text-laranja mt-1">
            Ciclos semanais começam na segunda: {{ dataBR(inicioReal) }}
          </p>
        </div>
        <div>
          <label for="f">Termina em</label>
          <input id="f" v-model="fim" type="date" :min="minimoFim"
                 :class="eFim ? '!border-laranja' : ''" @input="eFim = null" />
          <CampoErro :mensagem="eFim" />
        </div>
      </div>

      <div v-if="totalPeriodos" class="chumbo pt-5">
        <p class="rotulo">Como fica a pontuação</p>
        <p class="text-fumaca text-sm mt-2">
          <span class="font-mono text-tinta">{{ totalPeriodos }}</span>
          {{ semanal ? 'encontros' : 'dias' }} no ciclo · cada
          {{ semanal ? 'semana cumprida' : 'dia cumprido' }} por todos vale
          <span class="font-mono text-laranja">{{ valorPeriodo.toFixed(2) }}</span> pontos.
          O ciclo inteiro soma 100 — e os pontos só entram quando ele terminar.
        </p>
      </div>

      <AvisoErro :mensagem="erro" />

      <button class="btn-ouro w-full" :disabled="salvando">
        {{ salvando ? "Criando…" : "Criar squad e convidar pessoas" }}
      </button>
      <p class="text-xs text-fumaca text-center font-semibold">{{ regraMinima }}</p>
    </form>
  </div>
</template>

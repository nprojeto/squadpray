<script setup lang="ts">
import { api, TIPOS_SQUAD, dataBR, hojeISO } from "~/lib/api";

const squads = ref<any[]>([]);
const vagas = ref(2);
const aba = ref<"montando" | "andamento">("montando");
const carregando = ref(true);
const erro = ref<string | null>(null);
const aviso = ref<string | null>(null);
const pedindo = ref<string | null>(null);

async function buscar() {
  carregando.value = true; erro.value = null;
  try {
    const r: any = await api.explorar();
    squads.value = r.squads ?? [];
    vagas.value = r.vagas_convidado ?? 0;
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
onMounted(buscar);

const montando = computed(() => squads.value.filter((s) => s.status === "rascunho"));
const andamento = computed(() => squads.value.filter((s) => s.status === "ativo"));
const lista = computed(() => (aba.value === "montando" ? montando.value : andamento.value));

async function pedir(s: any) {
  erro.value = null; aviso.value = null; pedindo.value = s.id;
  try {
    await api.solicitarEntrada(s.id);
    aviso.value = `Pedido enviado para ${s.organizador}. Agora é esperar a resposta.`;
    await buscar();
  } catch (e: any) { erro.value = e.message; }
  finally { pedindo.value = null; }
}

function progresso(s: any) {
  const ini = +new Date(s.data_inicio), fim = +new Date(s.data_fim), hoje = +new Date(hojeISO());
  if (fim <= ini) return 0;
  return Math.min(100, Math.max(0, Math.round(((hoje - ini) / (fim - ini)) * 100)));
}

function diasRestantes(s: any) {
  const d = Math.ceil((+new Date(s.data_fim) - +new Date(hojeISO())) / 86400000);
  return Math.max(0, d);
}
</script>

<template>
  <div>
    <span class="rotulo text-xl">o que está rolando por aqui</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Explorar</h1>
    <p class="font-semibold text-fumaca mt-3 max-w-xl">
      Squads que ainda estão montando aceitam pedidos de entrada. Os que já começaram
      você só acompanha de longe.
    </p>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <AvisoErro :mensagem="aviso" tipo="ok" class="mt-6" />

    <nav class="grid grid-cols-2 gap-2 mt-6">
      <button
        v-for="a in [
          { k: 'montando', t: 'Vão começar', n: montando.length },
          { k: 'andamento', t: 'Em andamento', n: andamento.length },
        ]" :key="a.k"
        class="rounded-lg border-2 border-tinta px-3 py-2.5 font-display uppercase text-sm sm:text-lg transition"
        :class="aba === a.k ? 'bg-amarelo shadow-blocoP' : 'bg-cartao text-fumaca hover:bg-amarelo/40'"
        @click="aba = a.k as any"
      >
        {{ a.t }} <span class="font-mono text-xs">{{ a.n }}</span>
      </button>
    </nav>

    <p v-if="aba === 'montando'" class="font-marca text-lg text-laranja mt-4">
      {{ vagas > 0
        ? `você ainda pode entrar em ${vagas} squad${vagas > 1 ? 's' : ''}`
        : 'seus lugares de convidado estão cheios, assim que você completá-los poderá ingressar como convidado(a) em 2 novos squads' }}
    </p>

    <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

    <p v-else-if="!lista.length" class="painel p-8 mt-6 text-center font-semibold">
      {{ aba === 'montando' ? 'Nenhum squad montando no momento.' : 'Nenhum squad em andamento.' }}
    </p>

    <ul v-else class="grid sm:grid-cols-2 gap-4 mt-6">
      <li v-for="s in lista" :key="s.id" class="painel p-5">
        <div class="flex items-start justify-between gap-3">
          <span class="faixa text-xs -rotate-1"
                :class="s.status === 'ativo' ? 'bg-verde text-papel' : 'bg-amarelo'">
            {{ s.status === 'ativo' ? 'iniciado' : 'vai iniciar' }}
          </span>
          <span class="text-[10px] font-bold uppercase tracking-widest text-fumaca">
            {{ TIPOS_SQUAD[s.tipo]?.nome }}
          </span>
        </div>

        <h2 class="text-2xl mt-3 break-words">{{ s.nome }}</h2>

        <NuxtLink :to="`/prayer/${s.organizador_id}`" class="flex items-center gap-2 mt-3 hover:text-laranja">
          <AvatarPerfil :url="s.organizador_avatar" :nome="s.organizador" :tamanho="30" />
          <span class="text-sm font-semibold truncate">{{ s.organizador }}</span>
        </NuxtLink>

        <!-- vai começar -->
        <template v-if="s.status === 'rascunho'">
          <p v-if="s.objetivo" class="text-sm font-semibold mt-3 leading-relaxed">{{ s.objetivo }}</p>
          <p class="text-xs font-semibold text-fumaca mt-3">
            {{ s.qtd_membros }} {{ s.qtd_membros === 1 ? 'pessoa' : 'pessoas' }} ·
            começa em {{ dataBR(s.data_inicio) }}
          </p>

          <p v-if="s.sou_membro" class="font-marca text-lg text-verde mt-4">você já está nesse</p>
          <p v-else-if="s.meu_pedido === 'pendente'" class="font-marca text-lg text-laranja mt-4">
            pedido enviado, aguardando resposta
          </p>
          <p v-else-if="s.meu_pedido === 'recusado'" class="font-marca text-lg text-fumaca mt-4">
            pedido não aceito
          </p>
          <button
            v-else class="btn-ouro w-full mt-4 !py-2 text-xs"
            :disabled="pedindo === s.id || vagas === 0" @click="pedir(s)"
          >
            {{ pedindo === s.id ? "Enviando…" : "Pedir para entrar" }}
          </button>
        </template>

        <!-- em andamento -->
        <template v-else>
          <div class="grid grid-cols-2 gap-2 mt-4 text-center">
            <div class="border-2 border-tinta rounded-lg py-2 bg-cartao">
              <p class="font-display text-2xl">{{ s.streak_atual }}</p>
              <p class="text-[10px] font-bold uppercase">de streak</p>
            </div>
            <div class="border-2 border-tinta rounded-lg py-2 bg-cartao">
              <p class="font-display text-2xl">{{ Number(s.pontos_total).toFixed(0) }}</p>
              <p class="text-[10px] font-bold uppercase">pontos</p>
            </div>
          </div>

          <div class="mt-4">
            <div class="h-4 border-2 border-tinta rounded-full bg-papel overflow-hidden">
              <div class="h-full bg-amarelo border-r-2 border-tinta transition-all"
                   :style="{ width: progresso(s) + '%' }" />
            </div>
            <p class="text-xs font-semibold text-fumaca mt-2">
              {{ progresso(s) }}% do ciclo ·
              {{ diasRestantes(s) === 0 ? 'último dia' : `faltam ${diasRestantes(s)} dias` }}
            </p>
          </div>
        </template>
      </li>
    </ul>
  </div>
</template>

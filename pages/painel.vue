<script setup lang="ts">
const { perfil, squads, carregando, carregar, meuSquadCriado } = useSessao();
onMounted(() => { if (!squads.value.length) carregar(); });

const aba = ref<"andamento" | "concluidos" | "cancelados">("andamento");

const andamento = computed(() => squads.value.filter(s => ["rascunho", "ativo"].includes(s.status)));
const concluidos = computed(() => squads.value.filter(s => s.status === "concluido"));
const cancelados = computed(() => squads.value.filter(s => s.status === "cancelado"));

const abas = computed(() => [
  { chave: "andamento", texto: "Em andamento", lista: andamento.value },
  { chave: "concluidos", texto: "Concluídos", lista: concluidos.value },
  { chave: "cancelados", texto: "Cancelados", lista: cancelados.value },
]);

const listaAtual = computed(() => abas.value.find(a => a.chave === aba.value)?.lista ?? []);
const podeCriar = computed(() => !meuSquadCriado.value);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span class="rotulo text-xl">Olá, {{ perfil?.nome?.split(' ')[0] }}</span>
        <h1 class="text-5xl sm:text-6xl mt-1">Meus squads</h1>
      </div>
      <div class="text-right">
        <span class="rotulo">pontos</span>
        <p class="font-display text-5xl text-laranja">{{ Number(perfil?.pontos_total ?? 0).toFixed(1) }}</p>
      </div>
    </div>

    <p v-if="carregando" class="mt-10 font-semibold">Carregando…</p>

    <template v-else>
      <div v-if="!squads.length" class="painel p-10 mt-10 text-center">
        <EmojiCristao codigo="semente" :tamanho="52" class="mx-auto" />
        <h2 class="text-3xl mt-4">Nenhum squad ainda</h2>
        <p class="font-semibold text-fumaca mt-2 max-w-md mx-auto">
          Crie o seu e convide pelo menos mais uma pessoa, ou espere um convite chegar.
        </p>
        <div class="flex flex-wrap gap-3 justify-center mt-7">
          <NuxtLink to="/criar" class="btn-ouro">Criar meu squad</NuxtLink>
          <NuxtLink to="/convites" class="btn-vidro">Ver convites</NuxtLink>
        </div>
      </div>

      <template v-else>
        <nav class="grid grid-cols-3 gap-2 mt-8">
          <button
            v-for="a in abas" :key="a.chave"
            class="rounded-lg border-2 border-tinta px-2 py-2.5 font-display uppercase
                   text-sm sm:text-lg leading-tight transition"
            :class="aba === a.chave ? 'bg-amarelo shadow-blocoP' : 'bg-cartao text-fumaca hover:bg-amarelo/40'"
            @click="aba = a.chave as any"
          >
            {{ a.texto }}
            <span class="block font-mono text-xs">{{ a.lista.length }}</span>
          </button>
        </nav>

        <div v-if="listaAtual.length" class="grid sm:grid-cols-2 gap-4 mt-6"
             :class="aba !== 'andamento' ? 'opacity-80' : ''">
          <CartaoSquad v-for="s in listaAtual" :key="s.id" :squad="s" />
        </div>

        <p v-else class="painel p-8 mt-6 text-center font-semibold">
          {{ aba === 'andamento' ? 'Nenhum squad em andamento agora.'
           : aba === 'concluidos' ? 'Nenhum ciclo concluído ainda.'
           : 'Nenhum squad cancelado.' }}
        </p>

        <div class="chumbo mt-10 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p class="font-semibold text-sm max-w-lg">
            <template v-if="meuSquadCriado">
              Seu squad aberto é <span class="bg-amarelo px-1">{{ meuSquadCriado.nome }}</span>.
              Quando ele terminar ou for excluído, você pode criar outro.
            </template>
            <template v-else>
              Você pode ter um squad criado por você e participar de um squad de outra pessoa.
            </template>
          </p>
          <NuxtLink v-if="podeCriar" to="/criar" class="btn-ouro">Criar meu squad</NuxtLink>
        </div>
      </template>
    </template>
  </div>
</template>

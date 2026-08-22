<script setup lang="ts">
const { perfil, squads, carregando, carregar, meuSquadCriado } = useSessao();
onMounted(() => { if (!squads.value.length) carregar(); });

const ativos = computed(() => squads.value.filter(s => s.status !== 'concluido'));
const encerrados = computed(() => squads.value.filter(s => s.status === 'concluido'));
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="rotulo">Olá, {{ perfil?.nome?.split(' ')[0] }}</p>
        <h1 class="text-4xl mt-2">Meus squads</h1>
      </div>
      <div class="text-right">
        <p class="rotulo">Pontos acumulados</p>
        <p class="font-mono text-4xl font-extrabold text-ouro">
          {{ Number(perfil?.pontos_total ?? 0).toFixed(1) }}
        </p>
      </div>
    </div>

    <p v-if="carregando" class="text-sussurro mt-10">Carregando…</p>

    <template v-else>
      <div v-if="!squads.length" class="painel p-10 mt-10 text-center">
        <EmojiCristao codigo="semente" :tamanho="48" class="mx-auto" />
        <h2 class="text-2xl mt-4">Nenhum squad ainda</h2>
        <p class="text-sussurro mt-2 max-w-md mx-auto">
          Crie o seu e convide pelo menos mais duas pessoas, ou espere um convite chegar.
        </p>
        <div class="flex flex-wrap gap-3 justify-center mt-7">
          <NuxtLink to="/criar" class="btn-ouro">Criar meu squad</NuxtLink>
          <NuxtLink to="/convites" class="btn-vidro">Ver convites</NuxtLink>
        </div>
      </div>

      <template v-else>
        <div class="grid sm:grid-cols-2 gap-4 mt-8">
          <CartaoSquad v-for="s in ativos" :key="s.id" :squad="s" />
        </div>

        <div v-if="encerrados.length" class="mt-10">
          <p class="rotulo mb-3">Ciclos encerrados</p>
          <div class="grid sm:grid-cols-2 gap-4 opacity-60">
            <CartaoSquad v-for="s in encerrados" :key="s.id" :squad="s" />
          </div>
        </div>

        <div class="chumbo mt-10 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p class="text-sm text-sussurro">
            <template v-if="meuSquadCriado">
              Você já criou o squad <span class="text-texto">{{ meuSquadCriado.nome }}</span>.
              Cada pessoa pode criar apenas um, mas pode participar de outros.
            </template>
            <template v-else>Você ainda não criou nenhum squad.</template>
          </p>
          <NuxtLink v-if="!meuSquadCriado" to="/criar" class="btn-ouro">Criar meu squad</NuxtLink>
        </div>
      </template>
    </template>
  </div>
</template>

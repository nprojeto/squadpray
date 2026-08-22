<script setup lang="ts">
const { perfil, naoLidas, carregar, sair, logado, falha } = useSessao();
const { escuro, alternar, iniciar } = useTema();
const menuAberto = ref(false);
onMounted(() => { iniciar(); carregar(); });
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 border-b-2 border-tinta bg-papel/95 backdrop-blur">
      <div class="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <NuxtLink :to="logado ? '/painel' : '/'" class="flex items-center gap-2">
          <span class="w-9 h-9 grid place-items-center bg-laranja border-2 border-tinta rounded-lg -rotate-6">
            <EmojiCristao codigo="oracao" :tamanho="22" />
          </span>
          <span class="font-display text-2xl uppercase tracking-tight">SquadPray</span>
        </NuxtLink>

        <nav v-if="logado" class="hidden sm:flex items-center gap-1 text-sm">
          <NuxtLink to="/painel" class="btn-fantasma">Meus squads</NuxtLink>
          <NuxtLink to="/convites" class="btn-fantasma relative">
            Convites
            <span v-if="naoLidas" class="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-laranja border border-tinta" />
          </NuxtLink>
          <NuxtLink to="/perfil" class="btn-fantasma">
            {{ perfil?.nome?.split(' ')[0] }}
            <span class="font-mono font-bold ml-1">{{ Number(perfil?.pontos_total ?? 0).toFixed(0) }}</span>
          </NuxtLink>
          <NuxtLink to="/historico" class="btn-fantasma">Histórico</NuxtLink>
          <button class="btn-fantasma" @click="sair">Sair</button>
        </nav>

        <div class="flex items-center gap-1">
          <button
            class="btn-fantasma !px-3" :aria-label="escuro ? 'Usar tema claro' : 'Usar tema escuro'"
            @click="alternar"
          >{{ escuro ? "☀" : "☾" }}</button>
          <button v-if="logado" class="sm:hidden btn-fantasma" @click="menuAberto = !menuAberto">Menu</button>
        </div>
      </div>

      <div v-if="menuAberto && logado" class="sm:hidden border-t-2 border-tinta px-5 py-3 flex flex-col gap-1">
        <NuxtLink to="/painel" class="btn-fantasma justify-start" @click="menuAberto = false">Meus squads</NuxtLink>
        <NuxtLink to="/convites" class="btn-fantasma justify-start" @click="menuAberto = false">Convites</NuxtLink>
        <NuxtLink to="/historico" class="btn-fantasma justify-start" @click="menuAberto = false">Histórico</NuxtLink>
        <NuxtLink to="/perfil" class="btn-fantasma justify-start" @click="menuAberto = false">Meu perfil</NuxtLink>
        <button class="btn-fantasma justify-start" @click="sair">Sair</button>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto px-5 py-8 sm:py-12">
      <AvisoErro v-if="falha && logado" :mensagem="falha" class="mb-6" />
      <slot />
    </main>

    <footer class="border-t-2 border-tinta py-6 text-center">
      <p class="font-marca text-xl text-laranja -rotate-1 inline-block">
        o streak só conta quando todo mundo cumpre
      </p>
    </footer>
  </div>
</template>

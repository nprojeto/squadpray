<script setup lang="ts">
const { perfil, convitesPendentes, naoLidas, carregar, sair, logado, falha, temSelo, melhorStreak } = useSessao();
const { escuro, alternar, iniciar } = useTema();
const menuAberto = ref(false);
const contaAberta = ref(false);
const rota = useRoute();

onMounted(() => { iniciar(); carregar(); });
watch(() => rota.fullPath, () => { menuAberto.value = false; contaAberta.value = false; });

const links = [
  { para: "/painel", texto: "Meus squads" },
  { para: "/rede", texto: "Rede" },
  { para: "/convites", texto: "Convites" },
  { para: "/historico", texto: "Histórico" },
];
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 border-b-2 border-tinta bg-papel/95 backdrop-blur">
      <div class="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
        <NuxtLink :to="logado ? '/painel' : '/'" class="flex items-center gap-2 shrink-0">
          <span class="w-9 h-9 grid place-items-center bg-laranja border-2 border-tinta rounded-lg -rotate-6">
            <EmojiCristao codigo="oracao" :tamanho="22" />
          </span>
          <span class="font-display text-xl sm:text-2xl uppercase tracking-tight">SquadPray</span>
        </NuxtLink>

        <nav v-if="logado" class="hidden md:flex items-center gap-1 text-sm ml-auto mr-2">
          <NuxtLink v-for="l in links" :key="l.para" :to="l.para" class="btn-fantasma relative">
            {{ l.texto }}
            <span
              v-if="l.para === '/convites' && convitesPendentes"
              class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-laranja text-papel
                     border-2 border-tinta grid place-items-center text-[11px] font-bold"
            >{{ convitesPendentes }}</span>
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-1.5">
          <button class="btn-fantasma !px-2.5" :aria-label="escuro ? 'Tema claro' : 'Tema escuro'" @click="alternar">
            {{ escuro ? "☀" : "☾" }}
          </button>

          <NuxtLink
            v-if="logado" to="/notificacoes"
            class="btn-fantasma !px-2.5 relative" aria-label="Notificações"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span
              v-if="naoLidas"
              class="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-laranja text-papel
                     border-2 border-tinta grid place-items-center text-[11px] font-bold"
            >{{ naoLidas }}</span>
          </NuxtLink>

          <div v-if="logado" class="relative">
            <button
              class="flex items-center gap-2 rounded-full border-2 border-tinta bg-cartao pl-1 pr-2.5 py-1
                     hover:bg-amarelo transition"
              @click="contaAberta = !contaAberta"
            >
              <AvatarPerfil :url="perfil?.avatar_url" :nome="perfil?.nome" :tamanho="30"
                            :selo="temSelo" :streak="melhorStreak" />
              <span class="font-mono text-xs font-bold">{{ Number(perfil?.pontos_total ?? 0).toFixed(0) }}</span>
            </button>

            <div
              v-if="contaAberta"
              class="absolute right-0 mt-2 w-56 painel p-2 z-50"
            >
              <p class="px-3 py-2 font-bold text-sm truncate">{{ perfil?.nome }}</p>
              <div class="chumbo my-1" />
              <NuxtLink to="/perfil" class="btn-fantasma w-full justify-start">Meu perfil</NuxtLink>
              <NuxtLink to="/historico" class="btn-fantasma w-full justify-start md:hidden">Histórico</NuxtLink>
              <NuxtLink to="/notificacoes" class="btn-fantasma w-full justify-start">Notificações</NuxtLink>
              <button class="btn-fantasma w-full justify-start" @click="sair">Sair</button>
            </div>
          </div>

          <button v-if="logado" class="md:hidden btn-fantasma !px-2.5" @click="menuAberto = !menuAberto">
            Menu
          </button>
        </div>
      </div>

      <div v-if="menuAberto && logado" class="md:hidden border-t-2 border-tinta px-5 py-3 flex flex-col gap-1">
        <NuxtLink v-for="l in links" :key="l.para" :to="l.para" class="btn-fantasma justify-start">
          {{ l.texto }}
          <span v-if="l.para === '/convites' && convitesPendentes" class="font-mono">({{ convitesPendentes }})</span>
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto px-5 py-8 sm:py-12" @click="contaAberta = false">
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

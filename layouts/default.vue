<script setup lang="ts">
const { perfil, naoLidas, carregar, sair, logado } = useSessao();
const menuAberto = ref(false);
onMounted(carregar);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 border-b border-borda/60 bg-noite/80 backdrop-blur-md">
      <div class="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <NuxtLink :to="logado ? '/painel' : '/'" class="flex items-center gap-2.5">
          <EmojiCristao codigo="luz" :tamanho="26" />
          <span class="font-display text-xl tracking-tight">Vigília</span>
        </NuxtLink>

        <nav v-if="logado" class="hidden sm:flex items-center gap-1 text-sm">
          <NuxtLink to="/painel" class="btn-fantasma !px-3 !py-2">Meus squads</NuxtLink>
          <NuxtLink to="/convites" class="btn-fantasma !px-3 !py-2 relative">
            Convites
            <span v-if="naoLidas" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-ouro" />
          </NuxtLink>
          <NuxtLink to="/perfil" class="btn-fantasma !px-3 !py-2">
            {{ perfil?.nome?.split(' ')[0] }}
            <span class="font-mono text-ouro ml-1">{{ Number(perfil?.pontos_total ?? 0).toFixed(0) }}</span>
          </NuxtLink>
          <button class="btn-fantasma !px-3 !py-2" @click="sair">Sair</button>
        </nav>

        <button v-if="logado" class="sm:hidden btn-fantasma !px-3 !py-2" @click="menuAberto = !menuAberto">
          Menu
        </button>
      </div>

      <div v-if="menuAberto && logado" class="sm:hidden border-t border-borda/60 px-5 py-3 flex flex-col gap-1">
        <NuxtLink to="/painel" class="btn-fantasma justify-start" @click="menuAberto = false">Meus squads</NuxtLink>
        <NuxtLink to="/convites" class="btn-fantasma justify-start" @click="menuAberto = false">Convites</NuxtLink>
        <NuxtLink to="/perfil" class="btn-fantasma justify-start" @click="menuAberto = false">Meu perfil</NuxtLink>
        <button class="btn-fantasma justify-start" @click="sair">Sair</button>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto px-5 py-8 sm:py-12">
      <slot />
    </main>

    <footer class="border-t border-borda/60 py-6 text-center text-xs text-sussurro">
      Vigília · o streak só conta quando todos cumprem
    </footer>
  </div>
</template>

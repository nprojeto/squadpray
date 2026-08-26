<script setup lang="ts">
const { perfil, convitesPendentes, naoLidas, carregar, sair, logado, falha, temSelo, melhorStreak, ehAdmin, senhaProvisoria } = useSessao();
const { escuro, alternar, iniciar } = useTema();
const gaveta = ref(false);
const contaAberta = ref(false);
const rota = useRoute();

onMounted(() => { iniciar(); carregar(); });
watch(() => rota.fullPath, () => { gaveta.value = false; contaAberta.value = false; });
watch(gaveta, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? "hidden" : "";
});

const recado = computed(() => {
  const p = rota.path;
  if (p.startsWith("/squad/")) return "o streak só conta quando todo mundo cumpre";
  if (p === "/painel") return "um squad de cada vez, um dia de cada vez";
  if (p === "/rede") return "ninguém caminha sozinho por aqui";
  if (p === "/convites") return "todo squad começa com um convite";
  if (p === "/historico") return "o que vocês construíram fica guardado";
  if (p === "/perfil") return "sua caminhada guiada por Jesus";
  if (p === "/notificacoes") return "nada passa despercebido";
  if (p === "/criar") return "em dupla ou de galera";
  if (p.startsWith("/prayer/")) return "gente de fé se encontra";
  if (p === "/cadastro") return "bem-vindo à rede";
  if (p === "/admin") return "os números da plataforma";
  if (p === "/explorar") return "tem gente começando agora";
  if (p === "/conquistas") return "o que você construiu em família";
  if (p === "/nova-senha") return "só mais um passo";
  return "fé que se pratica em grupo";
});

const links = computed(() => [
  { para: "/painel", texto: "Meus squads", contador: 0 },
  { para: "/explorar", texto: "Explorar", contador: 0 },
  { para: "/rede", texto: "Rede", contador: 0 },
  { para: "/convites", texto: "Convites", contador: convitesPendentes.value },
  { para: "/conquistas", texto: "Conquistas", contador: 0 },
  { para: "/historico", texto: "Histórico", contador: 0 },
  ...(ehAdmin.value ? [{ para: "/admin", texto: "Painel admin", contador: 0 }] : []),
]);

watch([senhaProvisoria, () => rota.path], ([provisoria, caminho]) => {
  if (provisoria && caminho !== "/nova-senha") navigateTo("/nova-senha");
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 border-b-2 border-tinta bg-papel/95 backdrop-blur">
      <div class="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center gap-3">
        <button
          v-if="logado"
          class="md:hidden w-10 h-10 grid place-items-center border-2 border-tinta rounded-lg
                 bg-cartao shadow-blocoP shrink-0"
          :aria-expanded="gaveta" aria-label="Abrir menu"
          @click="gaveta = true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <span
            v-if="convitesPendentes"
            class="absolute translate-x-4 -translate-y-4 w-3 h-3 rounded-full bg-laranja border-2 border-tinta"
          />
        </button>

        <NuxtLink :to="logado ? '/painel' : '/'" class="flex items-center gap-2 shrink-0">
          <span class="w-9 h-9 grid place-items-center bg-laranja border-2 border-tinta rounded-lg -rotate-6">
            <EmojiCristao codigo="oracao" :tamanho="22" />
          </span>
          <span class="font-display text-xl sm:text-2xl uppercase tracking-tight">SquadPray</span>
        </NuxtLink>

        <nav v-if="logado" class="hidden md:flex items-center gap-1 text-sm ml-auto mr-2">
          <NuxtLink v-for="l in links.slice(0, 5)" :key="l.para" :to="l.para" class="btn-fantasma relative">
            {{ l.texto }}
            <span
              v-if="l.contador"
              class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-laranja text-papel
                     border-2 border-tinta grid place-items-center text-[11px] font-bold"
            >{{ l.contador }}</span>
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-1.5 ml-auto md:ml-0">
          <NuxtLink v-if="logado" to="/notificacoes" class="btn-fantasma !px-2.5 relative" aria-label="Notificações">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
              class="rounded-full border-2 border-tinta bg-cartao p-1 hover:bg-amarelo transition"
              aria-label="Minha conta" @click.stop="contaAberta = !contaAberta"
            >
              <AvatarPerfil :url="perfil?.avatar_url" :nome="perfil?.nome" :tamanho="32" />
            </button>

            <div v-if="contaAberta" class="absolute right-0 mt-2 w-56 painel p-2 z-50">
              <p class="px-3 py-2 font-bold text-sm truncate">{{ perfil?.nome }}</p>
              <div class="chumbo my-1" />
              <NuxtLink to="/perfil" class="btn-fantasma w-full justify-start">Meu perfil</NuxtLink>
              <NuxtLink to="/historico" class="btn-fantasma w-full justify-start">Histórico</NuxtLink>
              <NuxtLink v-if="ehAdmin" to="/admin" class="btn-fantasma w-full justify-start">Painel admin</NuxtLink>
              <button class="btn-fantasma w-full justify-start" @click.stop="alternar">
                {{ escuro ? "☀ Tema claro" : "☾ Tema escuro" }}
              </button>
              <button class="btn-fantasma w-full justify-start" @click="sair">Sair</button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- gaveta lateral (mobile) -->
    <Teleport to="body">
      <div v-if="gaveta && logado" class="md:hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-tinta/60" @click="gaveta = false" />
        <aside class="absolute left-0 top-0 bottom-0 w-72 max-w-[85%] bg-papel border-r-2 border-tinta
                      shadow-bloco flex flex-col">
          <div class="flex items-center justify-between gap-3 px-5 h-16 border-b-2 border-tinta">
            <span class="font-display text-xl uppercase tracking-tight">SquadPray</span>
            <button
              class="w-10 h-10 grid place-items-center border-2 border-tinta rounded-lg bg-cartao"
              aria-label="Fechar menu" @click="gaveta = false"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            <NuxtLink
              v-for="l in links" :key="l.para" :to="l.para"
              class="flex items-center justify-between gap-3 rounded-lg px-4 py-3 font-display uppercase
                     text-lg border-2 border-transparent hover:border-tinta hover:bg-amarelo transition"
              :class="rota.path === l.para ? 'bg-amarelo border-tinta' : ''"
            >
              {{ l.texto }}
              <span
                v-if="l.contador"
                class="min-w-6 h-6 px-1.5 rounded-full bg-laranja text-papel border-2 border-tinta
                       grid place-items-center text-xs font-bold"
              >{{ l.contador }}</span>
            </NuxtLink>
          </nav>

        </aside>
      </div>
    </Teleport>

    <main class="flex-1 max-w-5xl w-full mx-auto px-5 py-8 sm:py-12" @click="contaAberta = false">
      <AvisoErro v-if="falha && logado" :mensagem="falha" class="mb-6" />
      <slot />
    </main>

    <CelebraConquista v-if="logado" />

    <footer class="border-t-2 border-tinta py-6 text-center">
      <p class="font-marca text-xl text-laranja -rotate-1 inline-block">{{ recado }}</p>
    </footer>
  </div>
</template>

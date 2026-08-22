<script setup lang="ts">
import { api, enviarAvatar, TIPOS_SQUAD } from "~/lib/api";

const { perfil, squads, carregar, sair, temSelo, melhorStreak } = useSessao();
const nome = ref(""); const bio = ref("");
const igreja = ref(""); const ministerios = ref(""); const nascimento = ref("");
const instagram = ref(""); const facebook = ref(""); const tiktok = ref(""); const youtube = ref("");
const publico = ref(true);
const salvando = ref(false); const enviandoFoto = ref(false);
const aviso = ref<string | null>(null); const erro = ref<string | null>(null);
const campoFoto = ref<HTMLInputElement | null>(null);

watchEffect(() => {
  const p = perfil.value;
  if (p) {
    nome.value = p.nome; bio.value = p.bio ?? "";
    igreja.value = p.igreja ?? ""; ministerios.value = p.ministerios ?? "";
    nascimento.value = p.data_nascimento ?? "";
    instagram.value = p.instagram ?? ""; facebook.value = p.facebook ?? "";
    tiktok.value = p.tiktok ?? ""; youtube.value = p.youtube ?? "";
    publico.value = p.perfil_publico !== false;
  }
});

async function trocarFoto(ev: Event) {
  const arq = (ev.target as HTMLInputElement).files?.[0];
  if (!arq || !perfil.value) return;
  erro.value = null; aviso.value = null; enviandoFoto.value = true;
  try {
    const url = await enviarAvatar(arq, perfil.value.id);
    await api.atualizarPerfil({ avatar_url: url });
    await carregar();
    aviso.value = "Foto atualizada.";
  } catch (e: any) { erro.value = e.message; }
  finally { enviandoFoto.value = false; if (campoFoto.value) campoFoto.value.value = ""; }
}

async function removerFoto() {
  erro.value = null;
  try { await api.atualizarPerfil({ avatar_url: null as any }); await carregar(); aviso.value = "Foto removida."; }
  catch (e: any) { erro.value = e.message; }
}

async function salvar() {
  erro.value = null; aviso.value = null; salvando.value = true;
  try {
    await api.atualizarPerfil({
      nome: nome.value.trim(), bio: bio.value.trim(),
      igreja: igreja.value.trim(), ministerios: ministerios.value.trim(),
      data_nascimento: nascimento.value || undefined,
      instagram: instagram.value.trim(), facebook: facebook.value.trim(),
      tiktok: tiktok.value.trim(), youtube: youtube.value.trim(),
      perfil_publico: publico.value,
    });
    await carregar(); aviso.value = "Perfil salvo.";
  } catch (e: any) { erro.value = e.message; }
  finally { salvando.value = false; }
}
</script>

<template>
  <div class="max-w-2xl">
    <span class="rotulo text-xl">quem você é por aqui</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Meu perfil</h1>

    <section class="painel p-6 sm:p-7 mt-8">
      <div class="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:gap-5">
        <AvatarPerfil
          :url="perfil?.avatar_url" :nome="perfil?.nome"
          :tamanho="96" :selo="temSelo" :streak="melhorStreak"
        />
        <div class="flex-1 min-w-0">
          <p class="font-display text-3xl">{{ perfil?.nome }}</p>
          <p v-if="temSelo" class="font-marca text-lg text-laranja">
            selo dourado ativo · {{ melhorStreak }} de streak
          </p>
          <p v-else class="font-marca text-lg text-fumaca">
            a coroa aparece aqui quando um squad seu chegar a 7 seguidos
          </p>

          <div class="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <button class="btn-vidro !py-2 text-xs" :disabled="enviandoFoto" @click="campoFoto?.click()">
              {{ enviandoFoto ? "Enviando…" : (perfil?.avatar_url ? "Trocar foto" : "Colocar foto") }}
            </button>
            <button v-if="perfil?.avatar_url" class="btn-fantasma !py-2 text-xs" @click="removerFoto">
              Remover
            </button>
          </div>
          <input ref="campoFoto" type="file" accept="image/*" class="hidden" @change="trocarFoto" />
        </div>
      </div>

      <div class="chumbo mt-6 pt-5 flex items-center justify-between gap-4">
        <div>
          <span class="rotulo">pontos</span>
          <p class="font-display text-5xl mt-1">{{ Number(perfil?.pontos_total ?? 0).toFixed(1) }}</p>
        </div>
        <NuxtLink to="/historico" class="btn-vidro">Ver histórico</NuxtLink>
      </div>
    </section>

    <section class="painel p-6 mt-6">
      <span class="rotulo">meus squads</span>
      <ul class="space-y-2 mt-3">
        <li v-for="s in squads" :key="s.id" class="flex items-center justify-between gap-3">
          <NuxtLink :to="`/squad/${s.id}`" class="font-bold hover:text-laranja">{{ s.nome }}</NuxtLink>
          <span class="text-xs font-semibold text-fumaca flex items-center gap-1.5">
            {{ TIPOS_SQUAD[s.tipo].nome }} · <span class="font-mono text-tinta">{{ s.streak_atual }}</span>
            <EmojiCristao v-if="s.selo_dourado" codigo="coroa" :tamanho="16" />
          </span>
        </li>
      </ul>
      <p v-if="!squads.length" class="text-fumaca font-semibold text-sm mt-2">
        Você ainda não participa de nenhum squad.
      </p>
    </section>

    <form class="painel p-6 mt-6 space-y-4" @submit.prevent="salvar">
      <div>
        <label for="n">Nome</label>
        <input id="n" v-model="nome" required />
      </div>
      <div>
        <label for="b">Descrição</label>
        <textarea id="b" v-model="bio" rows="3" placeholder="Uma linha sobre você e sua caminhada" />
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div><label for="ig">Igreja</label><input id="ig" v-model="igreja" placeholder="Nome da sua igreja" /></div>
        <div><label for="dn">Data de nascimento</label><input id="dn" v-model="nascimento" type="date" /></div>
      </div>
      <div>
        <label for="mi">Ministérios</label>
        <input id="mi" v-model="ministerios" placeholder="Louvor, Intercessão, GDC…" />
      </div>

      <div class="chumbo pt-5">
        <span class="rotulo">redes sociais</span>
        <div class="grid sm:grid-cols-2 gap-4 mt-3">
          <div><label for="in">Instagram</label><input id="in" v-model="instagram" placeholder="@seuperfil" /></div>
          <div><label for="fb">Facebook</label><input id="fb" v-model="facebook" placeholder="seuperfil" /></div>
          <div><label for="tk">TikTok</label><input id="tk" v-model="tiktok" placeholder="@seuperfil" /></div>
          <div><label for="yt">YouTube</label><input id="yt" v-model="youtube" placeholder="@seucanal" /></div>
        </div>
      </div>

      <label class="flex items-start gap-3 border-2 border-tinta rounded-lg p-4 bg-cartao cursor-pointer">
        <input v-model="publico" type="checkbox" class="!w-5 !h-5 !p-0 mt-0.5 shrink-0" />
        <span class="text-sm font-semibold">
          Deixar meu perfil visível na rede
          <span class="block font-normal text-fumaca text-xs mt-1">
            Desmarcado, outras pessoas veem só seu nome e sua foto.
          </span>
        </span>
      </label>
      <p class="text-xs text-fumaca font-semibold">
        E-mail: {{ perfil?.email }} · Fuso: {{ perfil?.timezone }}
      </p>
      <AvisoErro :mensagem="erro" />
      <AvisoErro :mensagem="aviso" tipo="ok" />
      <div class="flex gap-3">
        <button class="btn-ouro flex-1" :disabled="salvando">{{ salvando ? "Salvando…" : "Salvar" }}</button>
        <button type="button" class="btn-fantasma" @click="sair">Sair da conta</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { api, TIPOS_SQUAD, dataBR } from "~/lib/api";

const paraMim = ref<any[]>([]); const pedidos = ref<any[]>([]);
const carregando = ref(true); const erro = ref<string | null>(null); const aviso = ref<string | null>(null);
const { carregar } = useSessao();

async function buscar() {
  carregando.value = true;
  try {
    const r: any = await api.convites();
    paraMim.value = r.para_mim ?? [];
    pedidos.value = r.pedidos ?? [];
  }
  catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
onMounted(buscar);

async function responderPedido(id: string, aprovado: boolean) {
  erro.value = null;
  try {
    await api.responderSolicitacao(id, aprovado);
    aviso.value = aprovado ? "Pessoa adicionada ao squad." : "Pedido recusado.";
    await buscar(); await carregar();
  } catch (e: any) { erro.value = e.message; }
}

async function responder(id: string, aceitar: boolean) {
  erro.value = null;
  try {
    await api.responderConvite(id, aceitar);
    aviso.value = aceitar ? "Pronto, você entrou no squad." : "Convite recusado.";
    await buscar(); await carregar();
  } catch (e: any) { erro.value = e.message; }
}

</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-4xl">Convites</h1>
    <p class="font-semibold text-fumaca mt-2">Aceitou, entrou. Simples assim.</p>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <AvisoErro :mensagem="aviso" tipo="ok" class="mt-6" />

    <p v-if="carregando" class="text-fumaca mt-8">Carregando…</p>

    <template v-else>
      <section v-if="pedidos.length" class="mt-8">
        <p class="rotulo mb-3">Querem entrar no seu squad</p>
        <div v-for="p in pedidos" :key="p.id" class="painel p-6 mb-3">
          <div class="flex items-center gap-3">
            <AvatarPerfil :url="p.profiles?.avatar_url" :nome="p.profiles?.nome" :tamanho="44" />
            <div class="min-w-0">
              <p class="font-display text-xl truncate">{{ p.profiles?.nome }}</p>
              <p v-if="p.profiles?.igreja" class="text-xs font-semibold text-fumaca truncate">
                {{ p.profiles.igreja }}
              </p>
            </div>
          </div>
          <p class="text-sm font-semibold mt-3">
            Quer entrar em <span class="bg-amarelo px-1">{{ p.squads?.nome }}</span>.
          </p>
          <div class="flex gap-3 mt-5">
            <button class="btn-ouro flex-1" @click="responderPedido(p.id, true)">Aceitar</button>
            <button class="btn-fantasma" @click="responderPedido(p.id, false)">Recusar</button>
          </div>
        </div>
      </section>

      <section class="mt-8">
        <p class="rotulo mb-3">Convites para você</p>
        <div v-if="!paraMim.length" class="painel p-6 text-fumaca text-sm">Nenhum convite no momento.</div>
        <div v-for="c in paraMim" :key="c.id" class="painel p-6 mb-3">
          <p class="rotulo">{{ TIPOS_SQUAD[c.squads?.tipo]?.nome }}</p>
          <h2 class="text-2xl mt-1">{{ c.squads?.nome }}</h2>
          <p v-if="c.squads?.objetivo" class="text-fumaca text-sm mt-2">{{ c.squads.objetivo }}</p>
          <p class="text-xs text-fumaca mt-2">
            {{ dataBR(c.squads?.data_inicio) }} a {{ dataBR(c.squads?.data_fim) }} · convite de {{ c.profiles?.nome }}
          </p>
          <div class="flex gap-3 mt-5">
            <button class="btn-ouro flex-1" @click="responder(c.id, true)">Aceitar</button>
            <button class="btn-fantasma" @click="responder(c.id, false)">Recusar</button>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>

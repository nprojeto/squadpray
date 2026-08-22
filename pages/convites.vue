<script setup lang="ts">
import { api, TIPOS_SQUAD, dataBR } from "~/lib/api";

const paraMim = ref<any[]>([]); const paraAprovar = ref<any[]>([]);
const carregando = ref(true); const erro = ref<string | null>(null); const aviso = ref<string | null>(null);
const { carregar } = useSessao();

async function buscar() {
  carregando.value = true;
  try { const r: any = await api.convites(); paraMim.value = r.para_mim; paraAprovar.value = r.para_aprovar; }
  catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
onMounted(buscar);

async function responder(id: string, aceitar: boolean) {
  erro.value = null;
  try {
    await api.responderConvite(id, aceitar);
    aviso.value = aceitar
      ? "Convite aceito. Agora os membros do squad precisam aprovar sua entrada."
      : "Convite recusado.";
    await buscar(); await carregar();
  } catch (e: any) { erro.value = e.message; }
}

async function aprovar(id: string, ok: boolean) {
  erro.value = null;
  try { await api.aprovarConvite(id, ok); aviso.value = ok ? "Você aprovou." : "Você recusou a entrada."; await buscar(); }
  catch (e: any) { erro.value = e.message; }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-4xl">Convites</h1>
    <p class="text-fumaca mt-2">Quem entra no squad passa pelo aval de todos.</p>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <AvisoErro :mensagem="aviso" tipo="ok" class="mt-6" />

    <p v-if="carregando" class="text-fumaca mt-8">Carregando…</p>

    <template v-else>
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

      <section class="mt-10">
        <p class="rotulo mb-3">Esperando sua aprovação</p>
        <div v-if="!paraAprovar.length" class="painel p-6 text-fumaca text-sm">Nada para aprovar agora.</div>
        <div v-for="c in paraAprovar" :key="c.id" class="painel p-6 mb-3">
          <p class="rotulo">{{ c.squads?.nome }}</p>
          <h2 class="text-xl mt-1">{{ c.email }} quer entrar</h2>
          <p class="text-xs text-fumaca mt-2">
            Todos os membros precisam aprovar. Já aprovaram: {{ c.invite_approvals?.filter((a: any) => a.aprovado).length ?? 0 }}
          </p>
          <div class="flex gap-3 mt-5">
            <button class="btn-ouro flex-1" @click="aprovar(c.id, true)">Aprovar entrada</button>
            <button class="btn-fantasma" @click="aprovar(c.id, false)">Recusar</button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

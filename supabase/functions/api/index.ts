// ============================================================
//  VIGÍLIA — API (Supabase Edge Function)
//  Deploy: Supabase > Edge Functions > nome da função: "api"
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const erro = (msg: string, status = 400) => ok({ erro: msg }, status);

const admin = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const comUsuario = (req: Request) =>
  createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });

async function usuarioAtual(req: Request) {
  const sb = comUsuario(req);
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

const SEMANAIS = ["celebracao", "gdc"];
const TIPOS = ["leitura_biblica", "livros", "devocional", "oracao", "jejum", "celebracao", "gdc"];

// próxima segunda-feira (ou hoje, se hoje for segunda)
function proximaSegunda(base = new Date()): string {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const dow = d.getUTCDay(); // 0 dom ... 1 seg
  const faltam = dow === 1 ? 0 : (8 - dow) % 7;
  d.setUTCDate(d.getUTCDate() + faltam);
  return d.toISOString().slice(0, 10);
}

async function notificar(db: any, userIds: string[], titulo: string, mensagem: string, link?: string) {
  if (!userIds.length) return;
  await db.from("notifications").insert(
    userIds.map((u) => ({ user_id: u, titulo, mensagem, link })),
  );
}

// ============================================================
//  ROTEADOR
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  // remove o prefixo /functions/v1/api
  const path = url.pathname.replace(/^\/functions\/v1\/api/, "").replace(/^\/api/, "") || "/";
  const seg = path.split("/").filter(Boolean);
  const metodo = req.method;
  const db = admin();

  let body: any = {};
  if (metodo !== "GET" && metodo !== "DELETE") {
    try { body = await req.json(); } catch { body = {}; }
  }

  try {
    // ---------- saúde ----------
    if (path === "/" || path === "/health") {
      return ok({ status: "online", app: "Vigília API", versao: "1.0.0" });
    }

    // ---------- cron: fecha períodos vencidos ----------
    if (seg[0] === "cron" && seg[1] === "fechar") {
      if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
        return erro("Não autorizado.", 401);
      }
      const { data, error } = await db.rpc("fechar_periodos_vencidos");
      if (error) return erro(error.message, 500);
      return ok({ streaks_quebrados: data });
    }

    // ---------- emojis (público) ----------
    if (seg[0] === "emojis" && metodo === "GET") {
      const { data } = await db.from("reaction_emojis")
        .select("*").eq("ativo", true).order("ordem");
      return ok({ emojis: data ?? [] });
    }

    // daqui pra baixo precisa estar logado
    const user = await usuarioAtual(req);
    if (!user) return erro("Faça login para continuar.", 401);

    // ============ PERFIL ============
    if (seg[0] === "me") {
      if (metodo === "GET") {
        const { data: perfil } = await db.from("profiles").select("*").eq("id", user.id).single();
        const { data: squads } = await db.from("v_squad_resumo")
          .select("*")
          .in("id",
            (await db.from("squad_members").select("squad_id")
              .eq("user_id", user.id).eq("status", "ativo")).data?.map((m: any) => m.squad_id) ?? ["00000000-0000-0000-0000-000000000000"],
          );
        const { count: naoLidas } = await db.from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id).eq("lida", false);
        return ok({ perfil, squads: squads ?? [], notificacoes_nao_lidas: naoLidas ?? 0 });
      }
      if (metodo === "PATCH") {
        const campos: any = {};
        for (const k of ["nome", "avatar_url", "bio", "timezone"]) {
          if (body[k] !== undefined) campos[k] = body[k];
        }
        campos.updated_at = new Date().toISOString();
        const { data, error } = await db.from("profiles")
          .update(campos).eq("id", user.id).select().single();
        if (error) return erro(error.message);
        return ok({ perfil: data });
      }
    }

    // ============ SQUADS ============
    if (seg[0] === "squads") {
      // GET /squads  -> meus squads
      if (!seg[1] && metodo === "GET") {
        const { data: ids } = await db.from("squad_members")
          .select("squad_id").eq("user_id", user.id).eq("status", "ativo");
        const lista = ids?.map((m: any) => m.squad_id) ?? [];
        if (!lista.length) return ok({ squads: [] });
        const { data } = await db.from("v_squad_resumo").select("*").in("id", lista);
        return ok({ squads: data ?? [] });
      }

      // POST /squads -> criar
      if (!seg[1] && metodo === "POST") {
        const { nome, tipo, objetivo, descricao, data_inicio, data_fim } = body;
        if (!nome || !tipo) return erro("Informe o nome e o tipo do squad.");
        if (!TIPOS.includes(tipo)) return erro("Tipo de squad inválido.");
        if ((tipo === "oracao" || tipo === "jejum") && (!objetivo || objetivo.trim().length < 10)) {
          return erro("Squads de oração e jejum precisam de um objetivo com pelo menos 10 caracteres.");
        }
        if (!data_inicio || !data_fim) return erro("Informe a data de início e de término.");

        const { data: jaTem } = await db.from("squads")
          .select("id").eq("criado_por", user.id).in("status", ["rascunho", "ativo"]).maybeSingle();
        if (jaTem) return erro("Você já tem um squad ativo. Cada pessoa pode criar apenas um.");

        let inicio = data_inicio;
        if (SEMANAIS.includes(tipo)) inicio = proximaSegunda(new Date(data_inicio + "T12:00:00Z"));
        if (new Date(data_fim) < new Date(inicio)) {
          return erro("A data de término precisa ser depois do início.");
        }

        const { data, error } = await db.from("squads").insert({
          nome, tipo, objetivo, descricao,
          data_inicio: inicio, data_fim, criado_por: user.id, status: "rascunho",
        }).select().single();
        if (error) return erro(error.message);
        return ok({ squad: data }, 201);
      }

      const squadId = seg[1];

      // membro deste squad?
      const { data: souMembro } = await db.from("squad_members")
        .select("id, papel").eq("squad_id", squadId).eq("user_id", user.id)
        .eq("status", "ativo").maybeSingle();

      // GET /squads/:id -> detalhe completo
      if (seg.length === 2 && metodo === "GET") {
        if (!souMembro) return erro("Você não participa deste squad.", 403);
        const { data: squad } = await db.from("v_squad_resumo").select("*").eq("id", squadId).single();
        const { data: membros } = await db.from("squad_members")
          .select("id, papel, status, entrou_em, ordem_escala, profiles(id, nome, avatar_url, pontos_total)")
          .eq("squad_id", squadId).eq("status", "ativo").order("entrou_em");
        const { data: periodos } = await db.from("squad_periods")
          .select("*, profiles:autor_id(id, nome, avatar_url)")
          .eq("squad_id", squadId).order("indice");
        const { data: posts } = await db.from("posts")
          .select("*, profiles:autor_id(id, nome, avatar_url), post_reactions(id, emoji, user_id, profiles:user_id(nome))")
          .eq("squad_id", squadId).order("created_at", { ascending: false }).limit(30);
        const { data: fotos } = await db.from("weekly_photos")
          .select("*, profiles:user_id(id, nome, avatar_url), photo_confirmations(id, user_id)")
          .eq("squad_id", squadId).order("created_at", { ascending: false });
        const { data: convites } = await db.from("squad_invites")
          .select("*, invite_approvals(id, user_id, aprovado)")
          .eq("squad_id", squadId).in("status", ["pendente", "aceito"]);

        return ok({
          squad, membros: membros ?? [], periodos: periodos ?? [],
          posts: posts ?? [], fotos: fotos ?? [], convites: convites ?? [],
          semanal: SEMANAIS.includes(squad?.tipo),
          sou_criador: squad?.criado_por === user.id,
        });
      }

      if (!souMembro && seg.length > 2) return erro("Você não participa deste squad.", 403);

      // POST /squads/:id/ativar
      if (seg[2] === "ativar" && metodo === "POST") {
        const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode começar o ciclo.", 403);
        if (squad.status === "ativo") return erro("Este squad já está em andamento.");
        const { count } = await db.from("squad_members")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squadId).eq("status", "ativo");
        if ((count ?? 0) < 3) return erro("São necessárias pelo menos 3 pessoas para abrir o card.");

        const { error } = await db.rpc("gerar_periodos", { p_squad: squadId });
        if (error) return erro(error.message);

        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", squadId).eq("status", "ativo");
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "O ciclo começou", `O squad ${squad.nome} está ativo. Bora manter o streak!`, `/squad/${squadId}`);

        const { data: atualizado } = await db.from("v_squad_resumo").select("*").eq("id", squadId).single();
        return ok({ squad: atualizado });
      }

      // POST /squads/:id/convidar { email }
      if (seg[2] === "convidar" && metodo === "POST") {
        const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode convidar.", 403);
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!email) return erro("Informe o e-mail de quem você quer convidar.");

        const { count } = await db.from("squad_members")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squadId).eq("status", "ativo");
        if ((count ?? 0) >= squad.max_membros) {
          return erro(`Este squad já tem ${squad.max_membros} pessoas, o máximo permitido.`);
        }

        const { data: perfil } = await db.from("profiles")
          .select("id, nome").ilike("email", email).maybeSingle();

        const { data: conv, error } = await db.from("squad_invites").insert({
          squad_id: squadId, email, user_id: perfil?.id ?? null, convidado_por: user.id,
        }).select().single();
        if (error) return erro(error.message);

        if (perfil?.id) {
          await notificar(db, [perfil.id], "Convite para um squad",
            `Você foi convidado para o squad ${squad.nome}.`, `/convites`);
        }
        return ok({ convite: conv, cadastrado: !!perfil }, 201);
      }

      // POST /squads/:id/artigo
      if (seg[2] === "artigo" && metodo === "POST") {
        const { period_id, titulo, referencia, conteudo } = body;
        if (!period_id) return erro("Período não informado.");
        const texto = String(conteudo ?? "").trim();
        if (texto.length < 200) {
          return erro(`O texto precisa ter pelo menos 200 caracteres. Faltam ${200 - texto.length}.`);
        }
        const { data: periodo } = await db.from("squad_periods")
          .select("*").eq("id", period_id).eq("squad_id", squadId).single();
        if (!periodo) return erro("Período não encontrado.");
        if (periodo.autor_id !== user.id) return erro("Hoje não é a sua vez na escala.", 403);

        const { data: post, error } = await db.from("posts").insert({
          squad_id: squadId, period_id, autor_id: user.id, titulo, referencia, conteudo: texto,
        }).select().single();
        if (error) return erro(error.message.includes("duplicate") ? "O artigo deste dia já foi publicado." : error.message);

        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", squadId).eq("status", "ativo").neq("user_id", user.id);
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "Artigo do dia publicado", "Leia e reaja para manter o streak do squad.", `/squad/${squadId}`);

        const { data: st } = await db.rpc("avaliar_periodo", { p_period: period_id });
        return ok({ post, streak: st }, 201);
      }

      // POST /squads/:id/foto
      if (seg[2] === "foto" && metodo === "POST") {
        const { period_id, foto_url, legenda } = body;
        if (!period_id || !foto_url) return erro("Envie a foto e informe a semana.");
        const { data: foto, error } = await db.from("weekly_photos").insert({
          squad_id: squadId, period_id, user_id: user.id, foto_url, legenda,
        }).select().single();
        if (error) return erro(error.message.includes("duplicate") ? "Você já enviou sua foto desta semana." : error.message);

        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", squadId).eq("status", "ativo").neq("user_id", user.id);
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "Nova foto na galeria", "Confirme a presença do seu squad.", `/squad/${squadId}`);

        const { data: st } = await db.rpc("avaliar_periodo", { p_period: period_id });
        return ok({ foto, streak: st }, 201);
      }

      // GET /squads/:id/galeria
      if (seg[2] === "galeria" && metodo === "GET") {
        const { data } = await db.from("weekly_photos")
          .select("*, profiles:user_id(id, nome, avatar_url), photo_confirmations(id, user_id), squad_periods:period_id(indice, data_inicio, data_fim)")
          .eq("squad_id", squadId).order("created_at", { ascending: false });
        return ok({ fotos: data ?? [] });
      }

      // GET /squads/:id/calendario
      if (seg[2] === "calendario" && metodo === "GET") {
        const { data: squad } = await db.from("v_squad_resumo").select("*").eq("id", squadId).single();
        const { data: periodos } = await db.from("squad_periods")
          .select("id, indice, data_inicio, data_fim, status, pontos, autor_id, profiles:autor_id(nome, avatar_url)")
          .eq("squad_id", squadId).order("indice");
        return ok({
          streak_atual: squad?.streak_atual ?? 0,
          streak_recorde: squad?.streak_recorde ?? 0,
          selo_dourado: squad?.selo_dourado ?? false,
          pontos_total: squad?.pontos_total ?? 0,
          valor_periodo: squad?.valor_periodo ?? 0,
          periodos: periodos ?? [],
        });
      }

      // DELETE /squads/:id/sair
      if (seg[2] === "sair" && metodo === "DELETE") {
        const { data: squad } = await db.from("squads").select("criado_por").eq("id", squadId).single();
        if (squad.criado_por === user.id) return erro("Quem criou o squad não pode sair. Encerre o ciclo.", 400);
        await db.from("squad_members").update({ status: "saiu" })
          .eq("squad_id", squadId).eq("user_id", user.id);
        return ok({ sucesso: true });
      }
    }

    // ============ REAÇÕES ============
    if (seg[0] === "posts" && seg[2] === "reagir" && metodo === "POST") {
      const postId = seg[1];
      const emoji = String(body.emoji ?? "");
      if (!emoji) return erro("Escolha uma reação.");
      const { data: post } = await db.from("posts").select("squad_id, autor_id").eq("id", postId).single();
      if (!post) return erro("Artigo não encontrado.", 404);
      if (post.autor_id === user.id) return erro("Você escreveu este artigo. A reação é dos outros.", 400);

      const { data: membro } = await db.from("squad_members").select("id")
        .eq("squad_id", post.squad_id).eq("user_id", user.id).eq("status", "ativo").maybeSingle();
      if (!membro) return erro("Você não participa deste squad.", 403);

      const { data, error } = await db.from("post_reactions").upsert({
        post_id: postId, squad_id: post.squad_id, user_id: user.id, emoji,
      }, { onConflict: "post_id,user_id" }).select().single();
      if (error) return erro(error.message);

      const { data: periodo } = await db.from("posts").select("period_id").eq("id", postId).single();
      const { data: st } = await db.rpc("avaliar_periodo", { p_period: periodo.period_id });
      return ok({ reacao: data, streak: st });
    }

    // ============ CONFIRMAR FOTO ============
    if (seg[0] === "fotos" && seg[2] === "confirmar" && metodo === "POST") {
      const fotoId = seg[1];
      const { data: foto } = await db.from("weekly_photos")
        .select("squad_id, user_id, period_id").eq("id", fotoId).single();
      if (!foto) return erro("Foto não encontrada.", 404);
      if (foto.user_id === user.id) return erro("Esta foto é sua. A confirmação é dos outros.", 400);

      const { data: membro } = await db.from("squad_members").select("id")
        .eq("squad_id", foto.squad_id).eq("user_id", user.id).eq("status", "ativo").maybeSingle();
      if (!membro) return erro("Você não participa deste squad.", 403);

      const { error } = await db.from("photo_confirmations")
        .upsert({ photo_id: fotoId, user_id: user.id }, { onConflict: "photo_id,user_id" });
      if (error) return erro(error.message);

      const { data: st } = await db.rpc("avaliar_periodo", { p_period: foto.period_id });
      return ok({ sucesso: true, streak: st });
    }

    // ============ CONVITES ============
    if (seg[0] === "convites") {
      // GET /convites -> os meus + os que preciso aprovar
      if (!seg[1] && metodo === "GET") {
        const email = (user.email ?? "").toLowerCase();
        const { data: paraMim } = await db.from("squad_invites")
          .select("*, squads(id, nome, tipo, objetivo, data_inicio, data_fim), profiles:convidado_por(nome)")
          .or(`user_id.eq.${user.id},email.ilike.${email}`)
          .eq("status", "pendente");

        const { data: meusSquads } = await db.from("squad_members")
          .select("squad_id").eq("user_id", user.id).eq("status", "ativo");
        const ids = meusSquads?.map((m: any) => m.squad_id) ?? [];
        let paraAprovar: any[] = [];
        if (ids.length) {
          const { data } = await db.from("squad_invites")
            .select("*, squads(id, nome, tipo), invite_approvals(user_id, aprovado)")
            .in("squad_id", ids).eq("status", "aceito");
          paraAprovar = (data ?? []).filter(
            (c: any) => c.user_id !== user.id &&
              !c.invite_approvals?.some((a: any) => a.user_id === user.id),
          );
        }
        return ok({ para_mim: paraMim ?? [], para_aprovar: paraAprovar });
      }

      const conviteId = seg[1];

      // POST /convites/:id/responder { aceitar: true|false }
      if (seg[2] === "responder" && metodo === "POST") {
        const aceitar = body.aceitar === true;
        const { data: conv } = await db.from("squad_invites").select("*").eq("id", conviteId).single();
        if (!conv) return erro("Convite não encontrado.", 404);
        const meuEmail = (user.email ?? "").toLowerCase();
        if (conv.user_id !== user.id && conv.email.toLowerCase() !== meuEmail) {
          return erro("Este convite não é seu.", 403);
        }
        if (!aceitar) {
          await db.from("squad_invites").update({ status: "recusado" }).eq("id", conviteId);
          return ok({ status: "recusado" });
        }
        await db.from("squad_invites").update({
          status: "aceito", user_id: user.id, aceito_em: new Date().toISOString(),
        }).eq("id", conviteId);

        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", conv.squad_id).eq("status", "ativo");
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "Alguém quer entrar no squad", "Confirme para liberar a entrada.", `/convites`);

        return ok({ status: "aceito", aguardando: "aprovação de todos os membros" });
      }

      // POST /convites/:id/aprovar { aprovado: true|false }
      if (seg[2] === "aprovar" && metodo === "POST") {
        const aprovado = body.aprovado !== false;
        const { data: conv } = await db.from("squad_invites").select("*").eq("id", conviteId).single();
        if (!conv) return erro("Convite não encontrado.", 404);
        const { data: membro } = await db.from("squad_members").select("id")
          .eq("squad_id", conv.squad_id).eq("user_id", user.id).eq("status", "ativo").maybeSingle();
        if (!membro) return erro("Você não participa deste squad.", 403);

        const { error } = await db.from("invite_approvals")
          .upsert({ invite_id: conviteId, user_id: user.id, aprovado }, { onConflict: "invite_id,user_id" });
        if (error) return erro(error.message);

        const { data: final } = await db.from("squad_invites").select("status").eq("id", conviteId).single();
        if (final?.status === "aprovado" && conv.user_id) {
          await notificar(db, [conv.user_id], "Bem-vindo ao squad",
            "Todos aprovaram sua entrada.", `/squad/${conv.squad_id}`);
        }
        return ok({ status: final?.status });
      }
    }

    // ============ NOTIFICAÇÕES ============
    if (seg[0] === "notificacoes") {
      if (!seg[1] && metodo === "GET") {
        const { data } = await db.from("notifications")
          .select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
        return ok({ notificacoes: data ?? [] });
      }
      if (seg[1] === "ler" && metodo === "POST") {
        await db.from("notifications").update({ lida: true }).eq("user_id", user.id).eq("lida", false);
        return ok({ sucesso: true });
      }
    }

    return erro("Rota não encontrada.", 404);
  } catch (e) {
    console.error(e);
    return erro("Algo deu errado no servidor. Tente de novo.", 500);
  }
});

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
        let { data: perfil } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (!perfil) {
          // conta criada antes do gatilho: cria o perfil agora
          const { data: novo } = await db.from("profiles").insert({
            id: user.id,
            nome: (user.user_metadata?.nome as string) || (user.email ?? "").split("@")[0],
            email: user.email ?? "",
          }).select().single();
          perfil = novo;
        }
        const { data: squads } = await db.from("v_squad_resumo")
          .select("*")
          .in("id",
            (await db.from("squad_members").select("squad_id")
              .eq("user_id", user.id).eq("status", "ativo")).data?.map((m: any) => m.squad_id) ?? ["00000000-0000-0000-0000-000000000000"],
          );
        const { count: naoLidas } = await db.from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id).eq("lida", false);

        // convites de verdade: os que esperam por mim
        const meuEmail = (user.email ?? "").toLowerCase();
        const { data: convParaMim } = await db.from("squad_invites")
          .select("id").or(`user_id.eq.${user.id},email.ilike.${meuEmail}`).eq("status", "pendente");

        return ok({
          perfil, squads: squads ?? [],
          admin: perfil?.admin === true,
          senha_provisoria: perfil?.senha_provisoria === true,
          notificacoes_nao_lidas: naoLidas ?? 0,
          convites_pendentes: (convParaMim?.length ?? 0) + (await (async () => {
            const { data: meusSq } = await db.from("squads")
              .select("id").eq("criado_por", user.id).in("status", ["rascunho", "ativo"]);
            const ids = (meusSq ?? []).map((x: any) => x.id);
            if (!ids.length) return 0;
            const { count } = await db.from("solicitacoes")
              .select("*", { count: "exact", head: true })
              .in("squad_id", ids).eq("status", "pendente");
            return count ?? 0;
          })()),
        });
      }
      if (metodo === "PATCH") {
        const campos: any = {};
        for (const k of ["nome", "avatar_url", "bio", "timezone", "igreja", "ministerios",
                         "data_nascimento", "instagram", "facebook", "tiktok", "youtube",
                         "perfil_publico"]) {
          if (body[k] !== undefined) campos[k] = body[k];
        }
        campos.updated_at = new Date().toISOString();
        const { data, error } = await db.from("profiles")
          .update(campos).eq("id", user.id).select().single();
        if (error) return erro(error.message);
        return ok({ perfil: data });
      }
    }

    // ============ MINHA SENHA ============
    if (seg[0] === "me" && seg[1] === "senha" && metodo === "POST") {
      const nova = String(body.senha ?? "");
      if (nova.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
      if (nova === "Mudar@123") return erro("Escolha uma senha diferente da provisória.");

      const { error } = await db.auth.admin.updateUserById(user.id, { password: nova });
      if (error) return erro(error.message);
      await db.from("profiles")
        .update({ senha_provisoria: false, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      return ok({ sucesso: true });
    }

    // ============ ADMINISTRAÇÃO ============
    if (seg[0] === "admin") {
      const { data: euAdmin } = await db.from("profiles")
        .select("admin").eq("id", user.id).maybeSingle();
      if (euAdmin?.admin !== true) return erro("Área restrita aos administradores.", 403);

      // GET /admin/painel
      if (seg[1] === "painel" && metodo === "GET") {
        const { data: numeros, error } = await db.rpc("numeros_plataforma");
        if (error) return erro(error.message);

        const { data: squads } = await db.from("v_squad_resumo")
          .select("*").order("pontos_total", { ascending: false }).limit(50);

        const { data: recentes } = await db.from("profiles")
          .select("id, nome, email, avatar_url, igreja, pontos_total, admin, created_at")
          .order("created_at", { ascending: false }).limit(10);

        return ok({ numeros, squads: squads ?? [], recentes: recentes ?? [] });
      }

      // GET /admin/usuarios?q=
      if (seg[1] === "usuarios" && !seg[2] && metodo === "GET") {
        const q = (url.searchParams.get("q") ?? "").trim();
        let consulta = db.from("profiles").select("*").order("nome");
        if (q) consulta = consulta.or(`nome.ilike.%${q}%,email.ilike.%${q}%,igreja.ilike.%${q}%`);
        const { data, error } = await consulta;
        if (error) return erro(error.message);
        return ok({ usuarios: data ?? [] });
      }

      // GET /admin/usuarios/:id
      if (seg[1] === "usuarios" && seg[2] && !seg[3] && metodo === "GET") {
        const { data: p } = await db.from("profiles").select("*").eq("id", seg[2]).maybeSingle();
        if (!p) return erro("Pessoa não encontrada.", 404);
        const { data: vinculos } = await db.from("squad_members")
          .select("papel, status, squads(id, nome, tipo, status, streak_atual)")
          .eq("user_id", seg[2]);
        return ok({ usuario: p, squads: vinculos ?? [] });
      }

      // PATCH /admin/usuarios/:id
      if (seg[1] === "usuarios" && seg[2] && !seg[3] && metodo === "PATCH") {
        const campos: any = {};
        for (const k of ["nome", "bio", "igreja", "ministerios", "data_nascimento",
                         "instagram", "facebook", "tiktok", "youtube",
                         "perfil_publico", "avatar_url", "timezone", "admin", "pontos_total"]) {
          if (body[k] !== undefined) campos[k] = body[k];
        }
        if (!Object.keys(campos).length) return erro("Nada para alterar.");
        campos.updated_at = new Date().toISOString();

        const { data, error } = await db.from("profiles")
          .update(campos).eq("id", seg[2]).select().single();
        if (error) return erro(error.message);

        if (body.email) {
          const { error: e2 } = await db.auth.admin.updateUserById(seg[2], { email: body.email });
          if (e2) return erro(`Dados salvos, mas o e-mail não mudou: ${e2.message}`);
          await db.from("profiles").update({ email: body.email }).eq("id", seg[2]);
        }
        return ok({ usuario: data });
      }

      // POST /admin/usuarios/:id/resetar-senha
      if (seg[1] === "usuarios" && seg[2] && seg[3] === "resetar-senha" && metodo === "POST") {
        const { error } = await db.auth.admin.updateUserById(seg[2], { password: "Mudar@123" });
        if (error) return erro(error.message);
        await db.from("profiles")
          .update({ senha_provisoria: true, updated_at: new Date().toISOString() })
          .eq("id", seg[2]);
        await notificar(db, [seg[2]], "Sua senha foi redefinida",
          "Entre com a senha provisória e cadastre uma nova.", "/perfil");
        return ok({ sucesso: true, senha: "Mudar@123" });
      }

      // DELETE /admin/usuarios/:id
      if (seg[1] === "usuarios" && seg[2] && metodo === "DELETE") {
        if (seg[2] === user.id) return erro("Você não pode excluir a própria conta por aqui.");
        const { error } = await db.auth.admin.deleteUser(seg[2]);
        if (error) return erro(error.message);
        return ok({ excluido: true });
      }

      // DELETE /admin/squads/:id
      if (seg[1] === "squads" && seg[2] && metodo === "DELETE") {
        await db.from("squads").delete().eq("id", seg[2]);
        return ok({ excluido: true });
      }

      return erro("Rota de administração não encontrada.", 404);
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
        if (jaTem) return erro("Você já tem um squad aberto. Encerre, conclua ou exclua ele para criar outro.");

        let inicio = data_inicio;
        if (SEMANAIS.includes(tipo)) inicio = proximaSegunda(new Date(data_inicio + "T12:00:00Z"));
        const dias = Math.floor((+new Date(data_fim) - +new Date(inicio)) / 86400000) + 1;
        if (SEMANAIS.includes(tipo)) {
          if (Math.floor(dias / 7) < 4) {
            return erro("O ciclo precisa ter no mínimo 4 encontros.");
          }
        } else if (dias < 21) {
          return erro("O ciclo precisa ter no mínimo 21 dias corridos.");
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

        const { data: exclusao } = await db.from("squad_exclusoes")
          .select("*, exclusao_votos(user_id, aprovado), profiles:solicitado_por(nome)")
          .eq("squad_id", squadId).eq("status", "pendente").maybeSingle();

        const { count: meusDiasSquad } = await db.from("dias_cumpridos")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squadId).eq("user_id", user.id);

        return ok({
          squad, membros: membros ?? [], periodos: periodos ?? [],
          meus_dias: meusDiasSquad ?? 0,
          posts: posts ?? [], fotos: fotos ?? [], convites: convites ?? [],
          exclusao: exclusao ?? null,
          semanal: SEMANAIS.includes(squad?.tipo),
          sou_criador: squad?.criado_por === user.id,
        });
      }

      if (!souMembro && seg.length > 2) return erro("Você não participa deste squad.", 403);

      // PATCH /squads/:id -> ajustar antes de começar
      if (seg.length === 2 && metodo === "PATCH") {
        const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
        if (!squad) return erro("Squad não encontrado.", 404);
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode editar.", 403);
        if (squad.status !== "rascunho") return erro("O ciclo já começou. Não dá para mudar as datas.");

        const campos: any = {};
        for (const k of ["nome", "objetivo", "descricao"]) {
          if (body[k] !== undefined) campos[k] = body[k];
        }

        let inicio = body.data_inicio ?? squad.data_inicio;
        const fim = body.data_fim ?? squad.data_fim;
        if (SEMANAIS.includes(squad.tipo)) inicio = proximaSegunda(new Date(inicio + "T12:00:00Z"));
        const dias = Math.floor((+new Date(fim) - +new Date(inicio)) / 86400000) + 1;
        if (SEMANAIS.includes(squad.tipo)) {
          const encontros = Math.floor(dias / 7);
          if (encontros < 4) return erro(`O ciclo precisa ter no mínimo 4 encontros. O seu tem ${encontros}.`);
        } else if (dias < 21) {
          return erro(`O ciclo precisa ter no mínimo 21 dias corridos. O seu tem ${dias}.`);
        }
        campos.data_inicio = inicio;
        campos.data_fim = fim;
        campos.updated_at = new Date().toISOString();

        const { data, error } = await db.from("squads").update(campos).eq("id", squadId).select().single();
        if (error) return erro(error.message);
        return ok({ squad: data });
      }

      // POST /squads/:id/ativar
      if (seg[2] === "ativar" && metodo === "POST") {
        const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode começar o ciclo.", 403);
        if (squad.status === "ativo") return erro("Este squad já está em andamento.");
        const { count } = await db.from("squad_members")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squadId).eq("status", "ativo");
        if ((count ?? 0) < 2) return erro("São necessárias pelo menos 2 pessoas para abrir o card.");

        const diasCiclo = Math.floor(
          (+new Date(squad.data_fim) - +new Date(squad.data_inicio)) / 86400000) + 1;
        if (SEMANAIS.includes(squad.tipo)) {
          const encontros = Math.floor(diasCiclo / 7);
          if (encontros < 4) {
            return erro(`Este ciclo tem só ${encontros} encontros. Ajuste as datas para no mínimo 4 antes de começar.`);
          }
        } else if (diasCiclo < 21) {
          return erro(`Este ciclo tem só ${diasCiclo} dias. Ajuste as datas para no mínimo 21 antes de começar.`);
        }

        const { error } = await db.rpc("gerar_periodos", { p_squad: squadId });
        if (error) return erro(error.message);

        // convites que ficaram em aberto não valem mais
        await db.from("squad_invites").update({ status: "expirado" })
          .eq("squad_id", squadId).in("status", ["pendente", "aceito"]);

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
        if (squad.status !== "rascunho") {
          return erro("O ciclo já começou. Não dá para incluir gente depois do início.");
        }
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!email) return erro("Informe o e-mail de quem você quer convidar.");

        const { data: perfil } = await db.from("profiles")
          .select("id, nome").ilike("email", email).maybeSingle();

        const { data: conv, error } = await db.from("squad_invites").insert({
          squad_id: squadId, email, user_id: perfil?.id ?? null, convidado_por: user.id,
        }).select().single();
        if (error) return erro(error.message);

        if (perfil?.id) {
          await notificar(db, [perfil.id], "Convite para um squad",
            `Você foi convidado para o squad ${squad.nome}.`, "/convites");
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

        const hoje = new Date().toISOString().slice(0, 10);
        if (periodo.data_inicio > hoje) {
          return erro("Esse dia ainda não chegou. Volte quando for a data dele.");
        }
        if (periodo.data_fim < hoje) {
          return erro("Esse dia já passou e não pode mais receber artigo.");
        }

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
        const { data: periodoFoto } = await db.from("squad_periods")
          .select("data_inicio, data_fim").eq("id", period_id).eq("squad_id", squadId).single();
        if (!periodoFoto) return erro("Semana não encontrada.");
        const hojeF = new Date().toISOString().slice(0, 10);
        if (periodoFoto.data_inicio > hojeF) {
          return erro("Essa semana ainda não começou. Volte na segunda-feira dela.");
        }
        if (periodoFoto.data_fim < hojeF) {
          return erro("Essa semana já fechou e não recebe mais fotos.");
        }

        const texto = String(legenda ?? "").trim();
        if (texto.length < 200) {
          return erro(`Conte o que você percebeu em pelo menos 200 caracteres. Faltam ${200 - texto.length}.`);
        }
        const { data: foto, error } = await db.from("weekly_photos").insert({
          squad_id: squadId, period_id, user_id: user.id, foto_url, legenda: texto,
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

        const { count: meusDias } = await db.from("dias_cumpridos")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squadId).eq("user_id", user.id);
        return ok({
          streak_atual: squad?.streak_atual ?? 0,
          streak_recorde: squad?.streak_recorde ?? 0,
          selo_dourado: squad?.selo_dourado ?? false,
          pontos_total: squad?.pontos_total ?? 0,
          valor_periodo: squad?.valor_periodo ?? 0,
          meus_dias: meusDias ?? 0,
          periodos: periodos ?? [],
        });
      }

      // DELETE /squads/:id/convites/:conviteId  -> cancelar convite
      if (seg[2] === "convites" && seg[3] && metodo === "DELETE") {
        const { data: squad } = await db.from("squads").select("criado_por").eq("id", squadId).single();
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode cancelar convites.", 403);
        await db.from("squad_invites").delete().eq("id", seg[3]).eq("squad_id", squadId);
        return ok({ sucesso: true });
      }

      // POST /squads/:id/encerrar -> encerra sem creditar pontos
      if (seg[2] === "encerrar" && metodo === "POST") {
        const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode encerrar.", 403);
        if (!["rascunho", "ativo"].includes(squad.status)) return erro("Este squad já está encerrado.");
        const { error } = await db.rpc("encerrar_squad", { p_squad: squadId });
        if (error) return erro(error.message);
        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", squadId).eq("status", "ativo");
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "Squad encerrado", `O ciclo de ${squad.nome} foi encerrado antes do fim. Os pontos não foram somados.`,
          "/historico");
        return ok({ encerrado: true });
      }

      // POST /squads/:id/finalizar -> credita os pontos do ciclo concluído
      if (seg[2] === "finalizar" && metodo === "POST") {
        const { data, error } = await db.rpc("finalizar_squad", { p_squad: squadId });
        if (error) return erro(error.message);
        return ok(data);
      }

      // DELETE /squads/:id -> excluir (direto se não começou, votação se já começou)
      if (seg.length === 2 && metodo === "DELETE") {
        const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
        if (!squad) return erro("Squad não encontrado.", 404);
        if (squad.criado_por !== user.id) return erro("Só quem criou o squad pode excluir.", 403);

        if (squad.status === "rascunho") {
          await db.from("squads").delete().eq("id", squadId);
          return ok({ excluido: true });
        }

        const { data: existente } = await db.from("squad_exclusoes")
          .select("id").eq("squad_id", squadId).eq("status", "pendente").maybeSingle();
        if (existente) return erro("Já existe um pedido de exclusão aguardando o squad.");

        const { data: pedido, error } = await db.from("squad_exclusoes").insert({
          squad_id: squadId, solicitado_por: user.id, motivo: body.motivo ?? null,
        }).select().single();
        if (error) return erro(error.message);

        await db.from("exclusao_votos").insert({
          exclusao_id: pedido.id, user_id: user.id, aprovado: true,
        });

        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", squadId).eq("status", "ativo").neq("user_id", user.id);
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "Pedido para excluir o squad",
          `${squad.nome} pode ser apagado. Sua confirmação é necessária.`, `/squad/${squadId}`);

        return ok({ pedido, aguardando_votos: true });
      }

      // POST /squads/:id/exclusao/votar { aprovado }
      if (seg[2] === "exclusao" && seg[3] === "votar" && metodo === "POST") {
        const { data: pedido } = await db.from("squad_exclusoes")
          .select("*").eq("squad_id", squadId).eq("status", "pendente").maybeSingle();
        if (!pedido) return erro("Não há pedido de exclusão em aberto.");

        const { error } = await db.from("exclusao_votos").upsert({
          exclusao_id: pedido.id, user_id: user.id, aprovado: body.aprovado !== false,
        }, { onConflict: "exclusao_id,user_id" });
        if (error) return erro(error.message);

        const { data: aindaExiste } = await db.from("squads").select("id").eq("id", squadId).maybeSingle();
        return ok({ excluido: !aindaExiste });
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

        const { data: meusSquads } = await db.from("squads")
          .select("id").eq("criado_por", user.id).in("status", ["rascunho", "ativo"]);
        const idsMeus = (meusSquads ?? []).map((s: any) => s.id);
        let pedidos: any[] = [];
        if (idsMeus.length) {
          const { data } = await db.from("solicitacoes")
            .select("*, squads(id, nome, tipo), profiles:user_id(id, nome, avatar_url, igreja)")
            .in("squad_id", idsMeus).eq("status", "pendente");
          pedidos = data ?? [];
        }
        return ok({ para_mim: paraMim ?? [], para_aprovar: [], pedidos });
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

        const { data: squadConv } = await db.from("squads")
          .select("status, nome").eq("id", conv.squad_id).single();
        if (squadConv && squadConv.status !== "rascunho") {
          await db.from("squad_invites").update({ status: "expirado" }).eq("id", conviteId);
          return erro(`O ciclo do squad ${squadConv.nome} já começou. Este convite não vale mais.`);
        }
        if (!aceitar) {
          await db.from("squad_invites").update({ status: "recusado" }).eq("id", conviteId);
          return ok({ status: "recusado" });
        }
        // limite: até 2 squads abertos como convidado
        const { data: meusVinculos } = await db.from("squad_members")
          .select("squad_id, squads(status, criado_por, nome)")
          .eq("user_id", user.id).eq("status", "ativo");
        const comoConvidado = (meusVinculos ?? []).filter((v: any) =>
          v.squads && v.squads.criado_por !== user.id &&
          ["rascunho", "ativo"].includes(v.squads.status));
        if (comoConvidado.length >= 2) {
          const nomes = comoConvidado.map((v: any) => v.squads.nome).join(" e ");
          return erro(`Você já participa de ${nomes}. O limite é de dois squads como convidado — espere um deles terminar.`);
        }

        await db.from("squad_invites").update({
          status: "aceito", user_id: user.id, aceito_em: new Date().toISOString(),
        }).eq("id", conviteId);

        const { data: eu } = await db.from("profiles").select("nome").eq("id", user.id).maybeSingle();
        const { data: membros } = await db.from("squad_members")
          .select("user_id").eq("squad_id", conv.squad_id).eq("status", "ativo")
          .neq("user_id", user.id);
        await notificar(db, membros?.map((m: any) => m.user_id) ?? [],
          "Gente nova no squad",
          `${eu?.nome ?? "Alguém"} entrou no squad ${squadConv?.nome ?? ""}.`.trim(),
          `/squad/${conv.squad_id}`);

        return ok({ status: "aprovado", entrou: true });
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

    // ============ CONQUISTAS ============
    if (seg[0] === "conquistas" && metodo === "GET") {
      const alvo = url.searchParams.get("de") ?? user.id;

      if (alvo !== user.id) {
        const { data: eu } = await db.from("profiles")
          .select("perfil_publico").eq("id", user.id).maybeSingle();
        const { data: dele } = await db.from("profiles")
          .select("perfil_publico").eq("id", alvo).maybeSingle();
        if (!dele) return erro("Prayer não encontrado.", 404);
        if (eu?.perfil_publico === false || dele.perfil_publico === false) {
          return erro("As conquistas só aparecem quando os dois perfis estão visíveis.", 403);
        }
      } else {
        await db.rpc("conceder_conquistas", { p_user: user.id });
      }

      const { data: catalogo } = await db.from("conquistas")
        .select("*").eq("ativo", true).order("ordem");
      const { data: minhas } = await db.from("conquistas_usuario")
        .select("codigo, conquistado_em").eq("user_id", alvo);

      const mapa = new Map((minhas ?? []).map((m: any) => [m.codigo, m.conquistado_em]));
      const selos = (catalogo ?? []).map((c: any) => ({
        ...c,
        conquistado: mapa.has(c.codigo),
        conquistado_em: mapa.get(c.codigo) ?? null,
      }));

      return ok({ selos });
    }

    // ============ EXPLORAR ============
    if (seg[0] === "explorar" && metodo === "GET") {
      const { data, error } = await db.rpc("explorar_squads");
      if (error) return erro(error.message);

      const { data: meus } = await db.from("squad_members")
        .select("squad_id").eq("user_id", user.id).eq("status", "ativo");
      const meusIds = (meus ?? []).map((m: any) => m.squad_id);

      const { data: pedidos } = await db.from("solicitacoes")
        .select("squad_id, status").eq("user_id", user.id);

      const squads = (data ?? []).map((sq: any) => ({
        ...sq,
        sou_membro: meusIds.includes(sq.id),
        meu_pedido: pedidos?.find((p: any) => p.squad_id === sq.id)?.status ?? null,
      }));

      const abertos = (await db.from("squad_members")
        .select("squad_id, squads(status, criado_por)")
        .eq("user_id", user.id).eq("status", "ativo")).data ?? [];
      const comoConvidado = abertos.filter((v: any) =>
        v.squads && v.squads.criado_por !== user.id &&
        ["rascunho", "ativo"].includes(v.squads.status)).length;

      return ok({ squads, vagas_convidado: Math.max(0, 2 - comoConvidado) });
    }

    // POST /squads/:id/solicitar
    if (seg[0] === "squads" && seg[2] === "solicitar" && metodo === "POST") {
      const squadId = seg[1];
      const { data: squad } = await db.from("squads").select("*").eq("id", squadId).single();
      if (!squad) return erro("Squad não encontrado.", 404);
      if (squad.status !== "rascunho") {
        return erro("Este squad já começou o ciclo e não recebe mais gente.");
      }

      const { data: jaSou } = await db.from("squad_members").select("id")
        .eq("squad_id", squadId).eq("user_id", user.id).eq("status", "ativo").maybeSingle();
      if (jaSou) return erro("Você já participa deste squad.");

      const abertos = (await db.from("squad_members")
        .select("squad_id, squads(status, criado_por)")
        .eq("user_id", user.id).eq("status", "ativo")).data ?? [];
      const comoConvidado = abertos.filter((v: any) =>
        v.squads && v.squads.criado_por !== user.id &&
        ["rascunho", "ativo"].includes(v.squads.status)).length;
      if (comoConvidado >= 2) {
        return erro("Você já está em dois squads de outras pessoas. Espere um deles terminar.");
      }

      const { data: pedido, error } = await db.from("solicitacoes").insert({
        squad_id: squadId, user_id: user.id, mensagem: body.mensagem ?? null,
      }).select().single();
      if (error) {
        return erro(error.message.includes("duplicate")
          ? "Você já pediu para entrar neste squad. Aguarde a resposta."
          : error.message);
      }

      const { data: eu } = await db.from("profiles").select("nome").eq("id", user.id).maybeSingle();
      await notificar(db, [squad.criado_por], "Pedido para entrar no squad",
        `${eu?.nome ?? "Alguém"} quer entrar em ${squad.nome}.`, "/convites");

      return ok({ pedido }, 201);
    }

    // POST /solicitacoes/:id/responder { aprovado }
    if (seg[0] === "solicitacoes" && seg[1] && seg[2] === "responder" && metodo === "POST") {
      const { data: pedido } = await db.from("solicitacoes")
        .select("*, squads(nome, criado_por, status)").eq("id", seg[1]).maybeSingle();
      if (!pedido) return erro("Pedido não encontrado.", 404);
      if (pedido.squads.criado_por !== user.id) {
        return erro("Só quem criou o squad responde os pedidos.", 403);
      }
      if (pedido.status !== "pendente") return erro("Este pedido já foi respondido.");

      const aprovado = body.aprovado !== false;
      if (aprovado && pedido.squads.status !== "rascunho") {
        return erro("O ciclo já começou. Não dá para incluir gente agora.");
      }

      const { error } = await db.from("solicitacoes")
        .update({ status: aprovado ? "aprovado" : "recusado" }).eq("id", seg[1]);
      if (error) return erro(error.message);

      await notificar(db, [pedido.user_id],
        aprovado ? "Pedido aprovado" : "Pedido recusado",
        aprovado
          ? `Você entrou no squad ${pedido.squads.nome}.`
          : `Seu pedido para entrar em ${pedido.squads.nome} não foi aceito desta vez.`,
        aprovado ? `/squad/${pedido.squad_id}` : "/explorar");

      return ok({ status: aprovado ? "aprovado" : "recusado" });
    }

    // ============ REDE ============
    if (seg[0] === "rede" && !seg[1] && metodo === "GET") {
      const termo = url.searchParams.get("q") ?? "";
      const lista = url.searchParams.get("lista") ?? "geral";

      const { data: eu } = await db.from("profiles")
        .select("perfil_publico").eq("id", user.id).maybeSingle();
      const souPublico = eu?.perfil_publico !== false;

      const { data: favs } = await db.from("favoritos").select("alvo_id").eq("user_id", user.id);
      const idsFav = (favs ?? []).map((f: any) => f.alvo_id);

      if (lista === "favoritos") {
        if (!idsFav.length) return ok({ prayers: [], sou_publico: souPublico });
        const { data } = await db.from("profiles")
          .select("id, nome, avatar_url, bio, igreja, pontos_total, perfil_publico")
          .in("id", idsFav).order("nome");
        const filtrados = (data ?? [])
          .filter((p: any) => !termo || `${p.nome} ${p.igreja ?? ""}`.toLowerCase().includes(termo.toLowerCase()))
          .map((p: any) => ({ ...p, favorito: true }));
        return ok({ prayers: filtrados, sou_publico: souPublico });
      }

      const { data, error } = await db.rpc("buscar_prayers", { termo });
      if (error) return erro(error.message);
      const prayers = (data ?? [])
        .filter((p: any) => p.id !== user.id)
        .map((p: any) => ({ ...p, favorito: idsFav.includes(p.id) }));
      return ok({ prayers, sou_publico: souPublico });
    }

    // POST /rede/favoritar/:id  { favorito: true|false }
    if (seg[0] === "rede" && seg[1] === "favoritar" && seg[2] && metodo === "POST") {
      const alvo = seg[2];
      if (alvo === user.id) return erro("Você não pode favoritar a si mesmo.");

      const { data: eu } = await db.from("profiles")
        .select("perfil_publico").eq("id", user.id).maybeSingle();
      if (eu?.perfil_publico === false) {
        return erro("Deixe seu perfil visível para poder favoritar outras pessoas.");
      }

      const { data: alvoPerfil } = await db.from("profiles")
        .select("perfil_publico, nome").eq("id", alvo).maybeSingle();
      if (!alvoPerfil) return erro("Prayer não encontrado.", 404);
      if (alvoPerfil.perfil_publico === false) {
        return erro(`${alvoPerfil.nome} está com o perfil fechado e não pode ser favoritado.`);
      }

      if (body.favorito === false) {
        await db.from("favoritos").delete().eq("user_id", user.id).eq("alvo_id", alvo);
        return ok({ favorito: false });
      }

      const { error } = await db.from("favoritos")
        .upsert({ user_id: user.id, alvo_id: alvo }, { onConflict: "user_id,alvo_id" });
      if (error) return erro(error.message);
      return ok({ favorito: true });
    }

    if (seg[0] === "prayer" && seg[1] && metodo === "GET") {
      const alvo = seg[1];
      const { data: p } = await db.from("profiles").select("*").eq("id", alvo).maybeSingle();
      if (!p) return erro("Prayer não encontrado.", 404);

      const { data: eu } = await db.from("profiles")
        .select("perfil_publico").eq("id", user.id).maybeSingle();
      if (eu && eu.perfil_publico === false && p.id !== user.id) {
        return ok({
          restrito: true, motivo: "meu_perfil_fechado",
          prayer: { id: p.id, nome: p.nome, avatar_url: p.avatar_url },
        });
      }

      if (!p.perfil_publico && p.id !== user.id) {
        return ok({
          restrito: true, motivo: "perfil_dele_fechado",
          prayer: { id: p.id, nome: p.nome, avatar_url: p.avatar_url },
        });
      }

      const { data: squadsIds } = await db.from("squad_members")
        .select("squad_id").eq("user_id", alvo).eq("status", "ativo");
      const lista = squadsIds?.map((m: any) => m.squad_id) ?? [];
      let squads: any[] = [];
      if (lista.length) {
        const { data } = await db.from("v_squad_resumo")
          .select("id, nome, tipo, streak_atual, streak_recorde, selo_dourado, status, pontos_total, criado_por")
          .in("id", lista);
        squads = data ?? [];
      }

      const { data: catalogo } = await db.from("conquistas")
        .select("*").eq("ativo", true).order("ordem");
      const { data: dele } = await db.from("conquistas_usuario")
        .select("codigo, conquistado_em").eq("user_id", alvo);
      const mapaC = new Map((dele ?? []).map((m: any) => [m.codigo, m.conquistado_em]));
      const selos = (catalogo ?? []).map((c: any) => ({
        ...c,
        conquistado: mapaC.has(c.codigo),
        conquistado_em: mapaC.get(c.codigo) ?? null,
      }));

      return ok({ restrito: false, prayer: p, squads, selos });
    }

    // ============ HISTÓRICO ============
    if (seg[0] === "historico" && metodo === "GET") {
      const { data: ids } = await db.from("squad_members")
        .select("squad_id").eq("user_id", user.id).eq("status", "ativo");
      const lista = ids?.map((m: any) => m.squad_id) ?? [];
      if (!lista.length) return ok({ squads: [], total: 0 });

      const { data: squads } = await db.from("v_historico").select("*").in("id", lista);
      const { data: extrato } = await db.from("points_ledger")
        .select("*, squads(nome, tipo)")
        .eq("user_id", user.id).is("period_id", null)
        .order("created_at", { ascending: false });

      const total = (extrato ?? []).reduce((a: number, l: any) => a + Number(l.pontos), 0);
      return ok({ squads: squads ?? [], extrato: extrato ?? [], total });
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

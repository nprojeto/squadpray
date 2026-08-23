-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 7
--  Limpeza dos testes + perfil de administrador
--  Rodar inteiro no SQL Editor do Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1. Campos novos
-- ------------------------------------------------------------
alter table public.profiles add column if not exists admin boolean not null default false;
alter table public.profiles add column if not exists senha_provisoria boolean not null default false;

-- ------------------------------------------------------------
-- 2. LIMPEZA: apaga tudo que foi criado em teste
-- ------------------------------------------------------------
delete from public.exclusao_votos;
delete from public.squad_exclusoes;
delete from public.photo_confirmations;
delete from public.weekly_photos;
delete from public.post_reactions;
delete from public.posts;
delete from public.squad_periods;
delete from public.invite_approvals;
delete from public.squad_invites;
delete from public.squad_members;
delete from public.points_ledger;
delete from public.squads;
delete from public.notifications;
delete from public.favoritos;

-- zera a pontuação de quem ficar
update public.profiles set pontos_total = 0;

-- ------------------------------------------------------------
-- 3. Apaga todos os cadastros, menos os dois administradores
-- ------------------------------------------------------------
delete from auth.users
 where lower(email) not in ('ernanejguedes@gmail.com', 'fernan99da@gmail.com');

-- ------------------------------------------------------------
-- 4. Promove os dois a administradores
-- ------------------------------------------------------------
update public.profiles
   set admin = true, perfil_publico = true, updated_at = now()
 where lower(email) in ('ernanejguedes@gmail.com', 'fernan99da@gmail.com');

-- ------------------------------------------------------------
-- 5. Painel do administrador: números da plataforma
-- ------------------------------------------------------------
create or replace function public.sou_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.numeros_plataforma()
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'pessoas',            (select count(*) from public.profiles),
    'pessoas_publicas',   (select count(*) from public.profiles where perfil_publico),
    'admins',             (select count(*) from public.profiles where admin),
    'squads',             (select count(*) from public.squads),
    'squads_ativos',      (select count(*) from public.squads where status = 'ativo'),
    'squads_rascunho',    (select count(*) from public.squads where status = 'rascunho'),
    'squads_concluidos',  (select count(*) from public.squads where status = 'concluido'),
    'squads_cancelados',  (select count(*) from public.squads where status = 'cancelado'),
    'artigos',            (select count(*) from public.posts),
    'reacoes',            (select count(*) from public.post_reactions),
    'fotos',              (select count(*) from public.weekly_photos),
    'convites_pendentes', (select count(*) from public.squad_invites where status in ('pendente','aceito')),
    'periodos_cumpridos', (select count(*) from public.squad_periods where status = 'concluido'),
    'periodos_perdidos',  (select count(*) from public.squad_periods where status = 'falhou'),
    'maior_streak',       (select coalesce(max(streak_recorde), 0) from public.squads),
    'pontos_distribuidos',(select coalesce(sum(pontos_total), 0) from public.profiles),
    'por_tipo',           (select coalesce(jsonb_object_agg(tipo, qtd), '{}'::jsonb)
                             from (select tipo::text as tipo, count(*) as qtd
                                     from public.squads group by tipo) t)
  );
$$;

-- ------------------------------------------------------------
-- 6. Administrador enxerga e edita todo mundo
-- ------------------------------------------------------------
drop policy if exists "admin ve tudo" on public.profiles;
create policy "admin ve tudo" on public.profiles for select to authenticated
  using (public.sou_admin());

drop policy if exists "admin edita tudo" on public.profiles;
create policy "admin edita tudo" on public.profiles for update to authenticated
  using (public.sou_admin());

drop policy if exists "admin ve squads" on public.squads;
create policy "admin ve squads" on public.squads for select to authenticated
  using (public.sou_admin());

-- FIM

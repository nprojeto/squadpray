-- ============================================================
--  SQUADPRAY — ATUALIZAÇÃO 2
--  Rodar inteiro no SQL Editor do Supabase (depois do schema.sql)
-- ============================================================

-- 1. Pontos só entram na carteira quando o ciclo termina
alter table public.squads
  add column if not exists pontos_creditados boolean not null default false;

-- evita creditar o mesmo squad duas vezes
create unique index if not exists ledger_credito_ciclo
  on public.points_ledger (user_id, squad_id)
  where period_id is null;

-- 2. Ciclo mínimo de 21 dias corridos
alter table public.squads drop constraint if exists squads_ciclo_minimo;
alter table public.squads
  add constraint squads_ciclo_minimo check (data_fim - data_inicio >= 20) not valid;

-- 3. Avaliar período: acumula no squad, NÃO credita ainda
create or replace function public.avaliar_periodo(p_period uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p record; s record; membros uuid[]; n int;
  qtd_reacoes int; tem_post boolean;
  qtd_fotos int; fotos_ok int; completo boolean := false;
  res jsonb;
begin
  select * into p from public.squad_periods where id = p_period;
  if p is null then return jsonb_build_object('erro','Período não encontrado'); end if;
  select * into s from public.squads where id = p.squad_id;

  select array_agg(user_id) into membros
    from public.squad_members where squad_id = p.squad_id and status = 'ativo';
  n := coalesce(array_length(membros,1),0);
  if n = 0 then return jsonb_build_object('erro','Squad sem membros'); end if;

  if public.is_semanal(s.tipo) then
    select count(*) into qtd_fotos from public.weekly_photos where period_id = p_period;
    select count(*) into fotos_ok from (
      select wp.id from public.weekly_photos wp
      join public.photo_confirmations pc on pc.photo_id = wp.id
      where wp.period_id = p_period
      group by wp.id
      having count(distinct pc.user_id) >= n - 1
    ) t;
    completo := (qtd_fotos = n and fotos_ok = n);
  else
    select exists(select 1 from public.posts where period_id = p_period) into tem_post;
    select count(distinct user_id) into qtd_reacoes
      from public.post_reactions pr
      join public.posts po on po.id = pr.post_id
      where po.period_id = p_period and pr.user_id <> po.autor_id;
    completo := tem_post and qtd_reacoes >= n - 1;
  end if;

  if completo and p.status <> 'concluido' then
    update public.squad_periods
       set status = 'concluido', pontos = s.valor_periodo, concluido_em = now()
     where id = p_period;

    update public.squads
       set streak_atual   = streak_atual + 1,
           streak_recorde = greatest(streak_recorde, streak_atual + 1),
           selo_dourado   = (streak_atual + 1) >= 7,
           pontos_total   = pontos_total + s.valor_periodo,
           updated_at     = now()
     where id = p.squad_id;
  end if;

  select jsonb_build_object(
    'completo', completo, 'streak', sq.streak_atual,
    'selo_dourado', sq.selo_dourado, 'pontos_squad', sq.pontos_total
  ) into res from public.squads sq where sq.id = p.squad_id;

  return res;
end $$;

-- 4. Finalizar ciclo: agora sim os pontos vão para a carteira
create or replace function public.finalizar_squad(p_squad uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s record; membros uuid[]; m uuid; total numeric(12,4);
begin
  select * into s from public.squads where id = p_squad;
  if s is null then return jsonb_build_object('erro','Squad não encontrado'); end if;
  if s.pontos_creditados then
    return jsonb_build_object('ja_creditado', true, 'pontos', s.pontos_total);
  end if;
  if s.status = 'cancelado' then
    return jsonb_build_object('erro','Squad encerrado antes do fim. Sem pontos.');
  end if;
  if current_date <= s.data_fim then
    return jsonb_build_object('erro','O ciclo ainda não terminou.');
  end if;

  total := s.pontos_total;

  select array_agg(user_id) into membros
    from public.squad_members where squad_id = p_squad and status = 'ativo';

  if membros is not null and total > 0 then
    foreach m in array membros loop
      insert into public.points_ledger (user_id, squad_id, period_id, pontos, motivo)
      values (m, p_squad, null, total, 'Ciclo concluído')
      on conflict do nothing;

      update public.profiles
         set pontos_total = pontos_total + total, updated_at = now()
       where id = m;
    end loop;
  end if;

  update public.squads
     set status = 'concluido', pontos_creditados = true, updated_at = now()
   where id = p_squad;

  return jsonb_build_object('creditado', true, 'pontos', total);
end $$;

-- 5. Encerrar squad no meio do caminho: nada é creditado
create or replace function public.encerrar_squad(p_squad uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.squads
     set status = 'cancelado', selo_dourado = false, updated_at = now()
   where id = p_squad and status in ('rascunho','ativo');
  return jsonb_build_object('encerrado', true);
end $$;

-- 6. Rotina diária: fecha períodos e credita ciclos terminados
create or replace function public.fechar_periodos_vencidos()
returns int language plpgsql security definer set search_path = public as $$
declare p record; s record; qtd int := 0; limite date;
begin
  for p in
    select sp.* from public.squad_periods sp
      join public.squads s on s.id = sp.squad_id
     where sp.status in ('aguardando','em_andamento') and s.status = 'ativo'
  loop
    limite := p.data_fim + 1;
    if current_date > limite then
      perform public.avaliar_periodo(p.id);
      if (select status from public.squad_periods where id = p.id) <> 'concluido' then
        update public.squad_periods set status = 'falhou' where id = p.id;
        update public.squads
           set streak_atual = 0, selo_dourado = false, updated_at = now()
         where id = p.squad_id;
        qtd := qtd + 1;
      end if;
    end if;
  end loop;

  for s in
    select id from public.squads
     where status = 'ativo' and data_fim < current_date - 1 and not pontos_creditados
  loop
    perform public.finalizar_squad(s.id);
  end loop;

  return qtd;
end $$;

-- 7. Cancelar convite enviado
drop policy if exists "cancelo convite" on public.squad_invites;
create policy "cancelo convite" on public.squad_invites for delete to authenticated
  using (public.sou_criador(squad_id));

-- 8. Histórico: view dos ciclos encerrados
create or replace view public.v_historico as
select
  s.id, s.nome, s.tipo, s.status, s.data_inicio, s.data_fim,
  s.pontos_total, s.streak_recorde, s.total_periodos, s.pontos_creditados,
  (select count(*) from public.squad_periods p
     where p.squad_id = s.id and p.status = 'concluido') as periodos_concluidos,
  (select count(*) from public.squad_members m
     where m.squad_id = s.id and m.status = 'ativo') as qtd_membros
from public.squads s
where s.status in ('concluido','cancelado');

-- 9. Um squad ativo por pessoa: o índice passa a ignorar cancelados
drop index if exists squads_um_por_criador;
create unique index squads_um_por_criador
  on public.squads (criado_por)
  where status in ('rascunho','ativo');

-- FIM

-- ============================================================
--  SQUADPRAY — ATUALIZAÇÃO 3
--  Quem convida não precisa aprovar. Rodar no SQL Editor.
-- ============================================================

-- 1. Função única que decide se o convite pode virar membro
create or replace function public.verificar_convite(p_invite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare inv record; n_membros int; n_aprov int; n_reject int;
begin
  select * into inv from public.squad_invites where id = p_invite;
  if inv is null then return; end if;

  -- só avalia depois que a pessoa aceitou e já tem cadastro
  if inv.status <> 'aceito' or inv.user_id is null then return; end if;

  -- quem precisa aprovar: membros ativos, menos quem enviou o convite
  select count(*) into n_membros
    from public.squad_members
   where squad_id = inv.squad_id and status = 'ativo'
     and user_id <> inv.convidado_por;

  select count(*) filter (where aprovado and user_id <> inv.convidado_por),
         count(*) filter (where not aprovado)
    into n_aprov, n_reject
    from public.invite_approvals where invite_id = p_invite;

  if n_reject > 0 then
    update public.squad_invites set status = 'rejeitado' where id = p_invite;
  elsif n_aprov >= n_membros then
    update public.squad_invites set status = 'aprovado' where id = p_invite;
    insert into public.squad_members (squad_id, user_id, papel, status)
    values (inv.squad_id, inv.user_id, 'membro', 'ativo')
    on conflict (squad_id, user_id) do nothing;
  end if;
end $$;

-- 2. Gatilhos: ao aprovar e ao aceitar
create or replace function public.trg_check_aprovacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.verificar_convite(new.invite_id);
  return new;
end $$;

drop trigger if exists trg_aprovacao on public.invite_approvals;
create trigger trg_aprovacao after insert or update on public.invite_approvals
  for each row execute function public.trg_check_aprovacao();

create or replace function public.trg_convite_aceito()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aceito' then perform public.verificar_convite(new.id); end if;
  return new;
end $$;

drop trigger if exists trg_convite_aceito on public.squad_invites;
create trigger trg_convite_aceito after update on public.squad_invites
  for each row execute function public.trg_convite_aceito();

-- 3. Destrava os convites que ficaram parados
do $$
declare c record;
begin
  for c in select id from public.squad_invites where status = 'aceito' loop
    perform public.verificar_convite(c.id);
  end loop;
end $$;

-- FIM

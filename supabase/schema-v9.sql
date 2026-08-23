-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 9
--  Entrar no squad passa a exigir só o aceite do convidado
--  Rodar no SQL Editor do Supabase
-- ============================================================

-- O convite vira membro assim que a pessoa aceita
create or replace function public.verificar_convite(p_invite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from public.squad_invites where id = p_invite;
  if inv is null then return; end if;
  if inv.status <> 'aceito' or inv.user_id is null then return; end if;

  update public.squad_invites set status = 'aprovado' where id = p_invite;

  insert into public.squad_members (squad_id, user_id, papel, status)
  values (inv.squad_id, inv.user_id, 'membro', 'ativo')
  on conflict (squad_id, user_id) do nothing;
end $$;

-- Destrava quem tinha aceitado e ficou esperando aprovação
do $$
declare c record;
begin
  for c in select id from public.squad_invites where status = 'aceito' loop
    perform public.verificar_convite(c.id);
  end loop;
end $$;

-- FIM

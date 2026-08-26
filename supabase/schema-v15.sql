-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 15
--  Texto do aviso de conquista
--  Rodar no SQL Editor do Supabase
-- ============================================================

create or replace function public.trg_avisar_conquista()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select titulo, sub into c from public.conquistas where codigo = new.codigo;
  insert into public.notifications (user_id, titulo, mensagem, link)
  values (
    new.user_id,
    'Você conquistou o selo ' || coalesce(c.titulo, new.codigo),
    coalesce(c.sub, 'Um selo novo entrou para a sua coleção.'),
    '/conquistas'
  );
  return new;
end $$;

-- ajusta os avisos que já foram enviados
update public.notifications
   set titulo = replace(titulo, 'Você conquistou ', 'Você conquistou o selo ')
 where titulo like 'Você conquistou %'
   and titulo not like 'Você conquistou o selo %';

-- FIM

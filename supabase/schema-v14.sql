-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 14
--  Aviso de conquista + celebração na tela
--  Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Marca se a pessoa já viu a celebração
alter table public.conquistas_usuario
  add column if not exists visto boolean not null default false;

-- as conquistas antigas já contam como vistas
update public.conquistas_usuario set visto = true where visto = false;

-- 2. Notificação automática ao conquistar
create or replace function public.trg_avisar_conquista()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select titulo, sub into c from public.conquistas where codigo = new.codigo;
  insert into public.notifications (user_id, titulo, mensagem, link)
  values (
    new.user_id,
    'Você conquistou ' || coalesce(c.titulo, new.codigo),
    coalesce(c.sub, 'Um selo novo entrou para a sua coleção.'),
    '/conquistas'
  );
  return new;
end $$;

drop trigger if exists trg_conquista_aviso on public.conquistas_usuario;
create trigger trg_conquista_aviso after insert on public.conquistas_usuario
  for each row execute function public.trg_avisar_conquista();

-- 3. Pode marcar a própria celebração como vista
drop policy if exists "marco conquista vista" on public.conquistas_usuario;
create policy "marco conquista vista" on public.conquistas_usuario for update to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 4. TESTE: uma conquista fictícia para ernanejguedes@gmail.com
--    (5 estrelas, para ver a animação completa)
-- ============================================================
insert into public.conquistas_usuario (user_id, codigo, visto)
select p.id, 'de_armadura_completa', false
  from public.profiles p
 where lower(p.email) = 'ernanejguedes@gmail.com'
on conflict (user_id, codigo) do update set visto = false;

-- ------------------------------------------------------------
-- Para tirar a fictícia depois, rode:
--   delete from public.conquistas_usuario
--    where codigo = 'de_armadura_completa'
--      and user_id = (select id from public.profiles
--                      where lower(email) = 'ernanejguedes@gmail.com');
-- ------------------------------------------------------------

-- FIM

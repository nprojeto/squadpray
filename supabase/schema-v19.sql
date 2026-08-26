-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 19
--  Privacidade: perfis fechados e fotos protegidas
--  Rodar no SQL Editor do Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1. PERFIS
--    Só devolve o cadastro inteiro para você mesmo, para quem
--    está com o perfil aberto, para gente do mesmo squad e
--    para os administradores.
-- ------------------------------------------------------------
drop policy if exists "perfis visiveis" on public.profiles;
drop policy if exists "admin ve tudo"   on public.profiles;

create policy "perfis visiveis" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or perfil_publico
  or public.sou_admin()
  or exists (
    select 1
      from public.squad_members meu
      join public.squad_members outro on outro.squad_id = meu.squad_id
     where meu.user_id = auth.uid() and meu.status = 'ativo'
       and outro.user_id = profiles.id and outro.status = 'ativo'
  )
);

-- Só nome e foto de quem mantém o perfil fechado
create or replace view public.v_prayers as
select
  p.id,
  p.nome,
  p.avatar_url,
  p.perfil_publico,
  case when p.perfil_publico then p.bio          end as bio,
  case when p.perfil_publico then p.igreja       end as igreja,
  case when p.perfil_publico then p.ministerios  end as ministerios,
  case when p.perfil_publico then p.pontos_total end as pontos_total
from public.profiles p;

grant select on public.v_prayers to authenticated;

-- A busca da rede também respeita o perfil fechado
create or replace function public.buscar_prayers(termo text)
returns table (
  id uuid, nome text, avatar_url text, bio text, igreja text,
  pontos_total numeric, perfil_publico boolean
) language sql security definer stable set search_path = public as $$
  select p.id, p.nome, p.avatar_url,
         case when p.perfil_publico then p.bio    else null end,
         case when p.perfil_publico then p.igreja else null end,
         case when p.perfil_publico then p.pontos_total else 0 end,
         p.perfil_publico
  from public.profiles p
  where coalesce(termo, '') = ''
     or p.nome ilike '%' || termo || '%'
     or (p.perfil_publico and p.igreja ilike '%' || termo || '%')
  order by p.perfil_publico desc, p.pontos_total desc, p.nome
  limit 40;
$$;

-- ------------------------------------------------------------
-- 2. FOTOS
--    O balde deixa de ser público: as imagens passam a exigir
--    login e são abertas por um endereço temporário.
-- ------------------------------------------------------------
update storage.buckets set public = false where id = 'galeria';

drop policy if exists "galeria leitura"  on storage.objects;
drop policy if exists "galeria envio"    on storage.objects;
drop policy if exists "galeria remover"  on storage.objects;

create policy "galeria leitura" on storage.objects
  for select to authenticated using (bucket_id = 'galeria');

create policy "galeria envio" on storage.objects
  for insert to authenticated with check (bucket_id = 'galeria');

create policy "galeria remover" on storage.objects
  for delete to authenticated using (bucket_id = 'galeria' and owner = auth.uid());

-- FIM

-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 12
--  Selos de conquista
--  Rodar no SQL Editor do Supabase
-- ============================================================

create table if not exists public.conquistas (
  codigo  text primary key,
  titulo  text not null,
  frase   text not null,
  regra   text not null,
  ordem   int  not null default 0,
  ativo   boolean not null default true
);

create table if not exists public.conquistas_usuario (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  codigo        text not null references public.conquistas(codigo) on delete cascade,
  conquistado_em timestamptz not null default now(),
  unique (user_id, codigo)
);

create index if not exists idx_conquistas_user on public.conquistas_usuario(user_id);

-- ------------------------------------------------------------
-- Catálogo
-- ------------------------------------------------------------
insert into public.conquistas (codigo, titulo, frase, regra, ordem) values
 ('zerando_capitulos',     'Zerando Capítulos',     'Cada capítulo: algo novo mudando em nós.',        'Primeiro grupo de leitura de livro', 1),
 ('no_secreto',            'No Secreto',            'Antes de tudo, oração.',                          'Primeiro grupo de oração', 2),
 ('a_mesa',                'A Mesa',                'Ninguém faz nada grande sozinho.',                'Completou 10 squads com mais de 50 pessoas diferentes', 3),
 ('aprovados_pelo_ceu',    'Aprovados pelo Céu',    'Toda grande história começa com um sim.',         '100 dias de streak', 4),
 ('incendiando_tudo',      'Incendiando Tudo',      'Uma faísca de cada vez.',                         'Criou e finalizou 3 squads', 5),
 ('que_galera_boa',        'Que Galera Boa!',       'Juntos a gente chega mais longe.',                'Squad com mais de 5 amigos finalizado com 100% de streak', 6),
 ('mestre_da_palavra',     'Mestre da Palavra',     'Um versículo por vez.',                           'Primeiro grupo de leitura bíblica', 7),
 ('buscando_a_lenha',      'Buscando a Lenha',      'Só mantém o fogo quem põe lenha.',                'Primeiro grupo de GDC', 8),
 ('mantendo_aceso',        'Mantendo Aceso',        'Um dia de cada vez, todo dia.',                   'Iniciou um squad em sequência', 9),
 ('plantando_alvo_novo',   'Plantando Alvo Novo',   'Toda mudança começa pequena.',                    'Completou 1 squad criado e 2 como convidado ao mesmo tempo', 10),
 ('de_armadura_completa',  'De Armadura Completa',  'Menos distração. Mais propósito.',                'Participou de squads de todas as práticas', 11),
 ('o_foco_e_jesus',        'O Foco é Jesus!',       'Deus permanece, quem muda sou eu.',               'Primeiro grupo de jejum', 12),
 ('constantes',            'Constantes',            'Constância também é conquista.',                  '50 dias de streak', 13),
 ('dupla_retete',          'Dupla Reteté',          'Melhor ser dois do que um.',                      'Primeiro grupo em dupla', 14),
 ('enraizados',            'Enraizados',            'Quem cria raiz não vive de fase.',                'Primeiro grupo de devocional', 15),
 ('da_galera',             'Da Galera',             'Sabedoria é andar com gente parecida com Jesus.', 'Aceitou convites de 5 squads', 16),
 ('ninguem_sozinho',       'Ninguém Sozinho',       'Se é pra chegar: chegamos juntos.',               'Fez mais de 80 convites para amigos', 17),
 ('tudo_comeca_na_semente','Tudo Começa na Semente','Plantando sementes por aí.',                      'Primeiro grupo de celebração', 18)
on conflict (codigo) do update
  set titulo = excluded.titulo, frase = excluded.frase,
      regra = excluded.regra, ordem = excluded.ordem;

-- ------------------------------------------------------------
-- TESTE: metade das conquistas para ernanejguedes@gmail.com
-- (para zerar depois, rode o bloco do fim deste arquivo)
-- ------------------------------------------------------------
insert into public.conquistas_usuario (user_id, codigo)
select p.id, c.codigo
  from public.profiles p
  cross join public.conquistas c
 where lower(p.email) = 'ernanejguedes@gmail.com'
   and c.ordem % 2 = 1
on conflict do nothing;

-- ------------------------------------------------------------
-- Segurança
-- ------------------------------------------------------------
alter table public.conquistas         enable row level security;
alter table public.conquistas_usuario enable row level security;

drop policy if exists "vejo catalogo" on public.conquistas;
create policy "vejo catalogo" on public.conquistas for select to authenticated using (true);

drop policy if exists "vejo minhas conquistas" on public.conquistas_usuario;
create policy "vejo minhas conquistas" on public.conquistas_usuario for select to authenticated
  using (user_id = auth.uid() or public.sou_admin());

-- ============================================================
--  PARA ZERAR O TESTE DEPOIS, rode apenas a linha abaixo:
--  delete from public.conquistas_usuario;
-- ============================================================

-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 10
--  Novas reações
--  Rodar no SQL Editor do Supabase
-- ============================================================

update public.reaction_emojis set nome = 'AMÉM!',            descricao = 'Concordo e recebo'          where codigo = 'amem';
update public.reaction_emojis set nome = 'TÔ ORANDO',        descricao = 'Estou orando por isso'      where codigo = 'oracao';
update public.reaction_emojis set nome = 'EU CREIO',         descricao = 'Creio junto com você'       where codigo = 'cruz';
update public.reaction_emojis set nome = 'A PAZ!',           descricao = 'Que a paz esteja aí'        where codigo = 'pomba';
update public.reaction_emojis set nome = 'BORA DE VIGÍLIA',  descricao = 'Isso acende o coração'      where codigo = 'fogo';
update public.reaction_emojis set nome = 'RECEBI',           descricao = 'Li e guardei comigo'        where codigo = 'luz';
update public.reaction_emojis set nome = 'GLÓRIA A DEUS!',   descricao = 'Toda a glória a Ele'        where codigo = 'coroa';
update public.reaction_emojis set nome = 'VAI MULTIPLICAR',  descricao = 'Isso vai render fruto'      where codigo = 'semente';

-- FIM

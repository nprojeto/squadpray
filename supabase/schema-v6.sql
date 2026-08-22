-- ============================================================
--  ELEVESQUAD — ATUALIZAÇÃO 6
--  Novos nomes das reações, alinhados ao catálogo de ícones
--  Rodar no SQL Editor do Supabase
-- ============================================================

update public.reaction_emojis set nome = 'Amém',          descricao = 'Concordo e recebo'        where codigo = 'amem';
update public.reaction_emojis set nome = 'Intercessão',   descricao = 'Estou orando por isso'    where codigo = 'oracao';
update public.reaction_emojis set nome = 'Fé',            descricao = 'Cristo no centro'         where codigo = 'cruz';
update public.reaction_emojis set nome = 'Paz',           descricao = 'Paz e Espírito Santo'     where codigo = 'pomba';
update public.reaction_emojis set nome = 'Vigília',       descricao = 'Isso me manteve acordado' where codigo = 'fogo';
update public.reaction_emojis set nome = 'Palavra',       descricao = 'A Escritura me falou'     where codigo = 'luz';
update public.reaction_emojis set nome = 'Glória',        descricao = 'Glória ao Rei'            where codigo = 'coroa';
update public.reaction_emojis set nome = 'Multiplicação', descricao = 'Isso vai render fruto'    where codigo = 'semente';

-- FIM

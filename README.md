# SquadPray

Plataforma de streaks de fé em squad: oração, leitura bíblica, devocional, jejum, livros, celebração e GDC.

O streak é coletivo — só conta quando **todos** cumprem no mesmo período.

## Como funciona

- Squad de **3 a 6** pessoas. Cada pessoa cria **1** squad, mas participa de vários.
- **Diários** (leitura, livros, devocional, oração, jejum): escala rotativa automática. O da vez escreve um artigo de no mínimo 200 caracteres, os outros leem e reagem com um emoji cristão.
- **Semanais** (celebração, GDC): ciclo de segunda a domingo. Cada um envia uma foto e todos confirmam. As fotos ficam na galeria do squad.
- **Pontos**: o ciclo inteiro vale 100. Cada período cumprido vale `100 ÷ total de períodos`. Pontos são acumulativos e nunca se perdem.
- **Streak**: quebrou, volta a zero. Com 7 seguidos, o squad ganha o selo dourado com coroa.
- **Entrada**: o criador convida → a pessoa aceita → todos os membros aprovam.

## Stack

- Frontend: Nuxt 3 (site estático) publicado no GitHub Pages
- Backend: Supabase — Postgres, Auth, Storage e Edge Functions
- Toda comunicação passa por `lib/api.ts`

## Estrutura

```
lib/api.ts                     conversa com o Supabase
pages/                         telas
components/                    calendário vitral, emojis, cartões
supabase/schema.sql            banco (rodar no SQL Editor)
supabase/functions/api/        Edge Function
.github/workflows/deploy.yml   publicação automática
```

## Configuração

No GitHub, em **Settings → Secrets and variables → Actions**, crie:

| Secret | Valor |
|---|---|
| `NUXT_PUBLIC_SUPABASE_URL` | URL do projeto no Supabase |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon public` do Supabase |

Em **Settings → Pages**, escolha **GitHub Actions** como origem.

Todo push na branch `main` publica o site sozinho.

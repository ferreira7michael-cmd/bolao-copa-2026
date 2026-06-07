# Bolao da Copa 2026

Sistema web mobile-first para bolao da Copa 2026 com login/senha, palpites, resultados, ranking e painel administrativo.

## Pontuacao

- 10 pontos por placar exato
- 5 pontos por acertar vencedor ou empate
- 2 pontos por acertar saldo de gols
- 1 ponto por acertar gols do mandante
- 1 ponto por acertar gols do visitante
- Pontuacao parcial limitada a 9 quando nao for placar exato

## Rodar localmente

1. Crie um projeto gratuito no Supabase.
2. Abra o SQL Editor do Supabase e execute `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local` e preencha as variaveis.
4. Instale dependencias e rode:

```bash
npm install
npm run dev
```

## Publicar gratis

### Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto Free.
2. Em SQL Editor, execute o arquivo `supabase/schema.sql`.
3. Em Project Settings > API, copie:
   - Project URL para `SUPABASE_URL`
   - service_role key para `SUPABASE_SERVICE_ROLE_KEY`

### Vercel

1. Suba este projeto para um repositorio no GitHub.
2. Acesse [vercel.com](https://vercel.com), importe o repositorio e selecione o plano Hobby.
3. Configure as variaveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_NAME`
4. Clique em Deploy.

Depois do deploy, entre com o usuario admin configurado e crie os participantes.

## Observacao sobre a tabela da Copa

O schema ja suporta todos os 104 jogos. Depois de entrar como admin, use o botao **Carregar Copa 2026 completa** na aba Admin para substituir a carga inicial pela tabela completa do Mundial.

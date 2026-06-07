# Deploy gratuito do Bolao da Copa 2026

Este projeto foi preparado para:

- Vercel Hobby para hospedar o site.
- Supabase Free para banco de dados.
- GitHub para versionamento e deploy automatico.

## 1. Criar o banco no Supabase

1. Acesse `https://supabase.com`.
2. Entre na sua conta.
3. Clique em New project.
4. Nome sugerido: `bolao-copa-2026`.
5. Escolha uma senha forte para o banco e guarde em local seguro.
6. Crie o projeto no plano Free.
7. Abra SQL Editor.
8. Cole e execute todo o conteudo de `supabase/schema.sql`.

Depois, va em Project Settings > API e copie:

- Project URL
- `service_role` key

Importante: a `service_role` key nunca deve ir para o GitHub. Ela vai apenas nas variaveis de ambiente da Vercel.

## 2. Criar o repositorio no GitHub

1. Acesse `https://github.com/new`.
2. Nome sugerido: `bolao-copa-2026`.
3. Pode deixar Public ou Private.
4. Nao marque README, gitignore ou license, porque o projeto ja tem arquivos locais.
5. Crie o repositorio.

Depois rode localmente, trocando a URL pela URL do seu repositorio:

```bash
git remote add origin https://github.com/Michaeltf7/bolao-copa-2026.git
git branch -M main
git push -u origin main
```

## 3. Publicar na Vercel

1. Acesse `https://vercel.com/new`.
2. Conecte a conta do GitHub.
3. Importe o repositorio `bolao-copa-2026`.
4. Framework Preset: Next.js.
5. Build Command: `next build`.
6. Install Command: `npm install`.
7. Output Directory: deixar em branco.

Em Environment Variables, cadastre:

```text
NEXT_PUBLIC_APP_NAME=Bolao da Copa 2026
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SESSION_SECRET=uma-frase-grande-secreta-com-mais-de-24-caracteres
ADMIN_USERNAME=admin
ADMIN_PASSWORD=uma-senha-forte-para-voce
```

Depois clique em Deploy.

## 4. Primeiro acesso

1. Abra a URL gerada pela Vercel.
2. Entre com:
   - usuario: valor de `ADMIN_USERNAME`
   - senha: valor de `ADMIN_PASSWORD`
3. Abra a aba Admin.
4. Crie os participantes com usuario e senha.
5. Cadastre ou ajuste os jogos.

## 5. Atualizacoes futuras

Depois que o GitHub estiver conectado na Vercel, o fluxo fica automatico:

```bash
git add .
git commit -m "Atualiza bolao"
git push
```

Cada `git push` para a branch `main` dispara um novo deploy na Vercel.

## 6. Limites do plano gratuito

Para 5 a 10 participantes, o plano gratuito deve ser suficiente. O Supabase Free pode pausar projeto por inatividade. Durante a Copa, com uso frequente, isso normalmente nao deve atrapalhar.

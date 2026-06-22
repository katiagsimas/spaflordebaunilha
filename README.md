# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4ab8e7e7-c223-46f5-926a-ab78109a36aa

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4ab8e7e7-c223-46f5-926a-ab78109a36aa) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4ab8e7e7-c223-46f5-926a-ab78109a36aa) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Monitoramento de erros (Sentry)

Este projeto integra o [Sentry](https://sentry.io) para captura automática de erros em produção.

### Como configurar em um novo ambiente

1. Acesse [sentry.io](https://sentry.io) e crie (ou abra) um projeto do tipo **React**.
2. Em **Settings → Projects → [seu projeto] → Client Keys (DSN)**, copie o valor do **DSN**.
3. Defina a variável de ambiente `VITE_SENTRY_DSN` com esse valor:
   - **Local:** adicione `VITE_SENTRY_DSN=...` ao arquivo `.env` (veja `.env.example`).
   - **Produção (Lovable / Vercel / outro host):** cadastre `VITE_SENTRY_DSN` como variável de ambiente do build.
4. Faça um novo build/deploy. Se o DSN estiver ausente ou vazio, o Sentry simplesmente não é inicializado — o app continua funcionando normalmente.

### O que é capturado

- Erros JavaScript não tratados (`window.error` e `unhandledrejection`).
- Erros lançados em chamadas ao Supabase / Edge Functions (via `logarErro` em `src/lib/errorLogger.ts`).
- Falhas registradas manualmente via `capturarErroNoSentry(...)`.

### Filtros de privacidade aplicados

- Senhas, tokens, chaves de API, dados de cartão e cabeçalhos `Authorization` são **mascarados** antes do envio.
- Campos de formulário sensíveis são automaticamente mascarados pelo Session Replay (`maskAllInputs`, `maskAllText`, `blockAllMedia`).
- O **corpo das respostas do Supabase** é removido dos breadcrumbs HTTP (mantemos apenas URL, método e status), evitando vazamento de dados pessoais.
- `sendDefaultPii: false` e o `user` enviado contém apenas `id`.
- Ambiente: `production` quando `import.meta.env.PROD === true`, `development` caso contrário. Em desenvolvimento, a taxa de amostragem é 10%.

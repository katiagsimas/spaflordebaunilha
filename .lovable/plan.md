## Plano: Integrar "Imersão A Receita que Faltava" ao Caixa de Açúcar

### Resumo das decisões já alinhadas
- **Modelo:** novo plano **"Aluna da Imersão"** que libera os mesmos módulos do Caixa Business por **30 dias**.
- **Conteúdo da imersão** (gravações, Playbook, etc.) fica **fora do app**, na Hotmart Club / Drive — o sistema não hospeda vídeos nem PDFs da imersão.
- **Provisionamento manual** pela equipe (NÃO passa pelo webhook Hotmart) — formulário no painel admin.
- **Pós 30 dias:** conta vira **inativa** (sem plano, sem acesso), mas usuário e todos os dados são preservados para reativação futura.

---

### 1. Banco de dados (migração única)

**Inserir novo plano na tabela `planos`:**
- `id = 'aluna_imersao'`
- `nome = 'Aluna da Imersão'`
- Mesmas permissões/acessos que `negocio` para fins de RLS.

**Atualizar função `user_has_financial_access(uuid)`** para incluir `'aluna_imersao'` ao lado de `'negocio'`/`'start'` — assim a aluna acessa Meu Dinheiro, Estoque, Conversa Doce, Organização Doce, etc.

**Adicionar coluna opcional em `profiles`:**
- `imersao_turma TEXT NULL` — para registrar a turma da aluna (ex.: "Turma 01 — Set/2026").

Nenhuma alteração em `historico_planos` (já registra plano_id arbitrário).
Nenhum novo bucket ou tabela auxiliar.

---

### 2. Edge function `criar-usuario`

A função já aceita `plano_id` e `plano_fim`. Garantir que:
- Aceita `plano_id = 'aluna_imersao'`.
- Quando o admin escolhe "Aluna da Imersão", o frontend envia `plano_fim = hoje + 30 dias` e `imersao_turma`.
- Email de boas-vindas usa template específico mencionando a imersão e os 30 dias.

Nenhuma mudança no webhook Hotmart — Imersão é fluxo paralelo, manual.

---

### 3. Painel admin (`/configuracoes` → Gestão de Usuários)

No modal de criação de usuário, adicionar a opção **"Aluna da Imersão"** no seletor de plano. Quando selecionada:
- Mostra campo "Turma" (texto livre, ex.: "Turma 01 — Out/2026").
- `plano_fim` é calculado automaticamente como hoje + 30 dias (somente leitura, com aviso).
- Botão de envio chama `criar-usuario` com `plano_id='aluna_imersao'`, `plano_fim` e `imersao_turma`.

Na listagem de usuários, exibir badge **"Aluna da Imersão"** com contagem de dias restantes (reusa o componente de período de acesso já existente).

Filtro adicional: "Origem = Imersão" (consulta `plano_id='aluna_imersao'` OU histórico).

---

### 4. UX da aluna dentro do app

- **Sidebar / UserMenu:** badge "Aluna da Imersão · expira em N dias" (reaproveita lógica de plano_fim).
- **Modal de boas-vindas (1º acesso):** card explicando que ela tem 30 dias de Business e links externos para as gravações/Playbook (URLs configuráveis em `system_settings` ou hardcoded por enquanto).
- **Banner discreto** nos últimos 7 dias antes da expiração: "Seu acesso à plataforma encerra em X dias. Quer continuar? Fale com a Ká." (link WhatsApp).

Nenhuma rota nova `/imersao` — gravações ficam fora do app.

---

### 5. Expiração e reativação

A lógica atual do `AuthContext` já bloqueia login quando `plano_fim < hoje` — comportamento desejado. Nada a mudar.

Para reativar (renovação ou upgrade), o admin altera manualmente o plano da aluna (fluxo já existente) e ela recupera acesso aos mesmos dados.

---

### 6. Documentação

- `docs/AUDITORIA.md`: registrar nova feature.
- Atualizar memória `mem://integrations/hotmart-provisioning` mencionando que Imersão é **fora do Hotmart webhook** (provisionamento manual).
- Criar `mem://features/imersao-receita-que-faltava` com o resumo do produto e regras de acesso.

---

### Fora do escopo (registrar como decisões para depois)

- Hospedagem de gravações/Playbook no app (decidido: fica no Hotmart Club).
- Integração automática com Hotmart caso, no futuro, a Imersão passe a ser vendida por lá — basta adicionar uma keyword no `resolverPlano()`.
- Página pública de captação/checkout da Imersão (escopo da landing externa, não deste app).
- Métricas de conversão Imersão → Business (pode virar dashboard depois das primeiras turmas).

---

### Detalhes técnicos (referência)

- `planos`: INSERT simples.
- `user_has_financial_access`: trocar `plano_id IN ('negocio','start')` por `plano_id IN ('negocio','start','aluna_imersao')`.
- `profiles.imersao_turma`: `ALTER TABLE ADD COLUMN`.
- Frontend admin: estender `CriarUsuarioModal` (selector + cálculo automático de plano_fim).
- Lógica de "30 dias" centralizada numa constante `IMERSAO_DIAS_ACESSO = 30` (fácil ajustar depois).

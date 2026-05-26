## Renovação automática das alunas da Imersão

Aluna compra Caixa Lite ou Caixa Business pelos links de renovação da Hotmart. O webhook detecta, converte o plano e mantém todos os dados.

### Ofertas Hotmart (já cadastradas)

| Plano destino   | productId | offerCode  |
|-----------------|-----------|------------|
| Caixa Lite anual    | 7449074   | `6yjlyf2i` |
| Caixa Business anual| 7448785   | `oytrdfwm` |

Já inseridas em `hotmart_produtos` — o webhook resolve via match `(product_id + offer_code)`.

---

### O que já funciona

O `hotmart-webhook` em `PURCHASE_APPROVED` para usuária existente:
- Identifica pelo e-mail
- Atualiza `profiles`: `plano_id`, `plano_tipo`, `plano_inicio = hoje`, `plano_fim = hoje+365`, `ativo = true`
- Preserva `id`, grupo, cadastros, histórico
- Registra em `historico_planos` com `tipo_evento = 'criacao'`

Logo, qualquer aluna da Imersão que comprar via essas duas ofertas já é renovada automaticamente.

---

### O que vamos adicionar

#### 1. Detectar "renovação a partir de Imersão" no webhook
Em `supabase/functions/hotmart-webhook/index.ts`, no bloco `existingProfile`:
- Antes do `UPDATE`, ler `plano_id` atual
- Se atual = `aluna_imersao` e novo ∈ {`base`, `negocio`}:
  - Gravar `historico_planos` com `tipo_evento = 'renovacao_imersao'` e observação `Renovação Imersão → {novoPlano}`
  - Disparar e-mail dedicado para a aluna (`enviarEmailRenovacaoAluna`)
  - Disparar e-mail consolidado para a admin (`enviarEmailRenovacaoAdmin`)
- Caso contrário: comportamento atual

#### 2. E-mail para a aluna (Resend, HTML inline)
Função `enviarEmailRenovacaoAluna(email, nome, planoNovo, planoFim)`:
- Assunto: "🎉 Sua renovação foi confirmada — Bem-vinda ao Caixa {Lite|Business}!"
- Conteúdo: parabéns, plano contratado, validade até `plano_fim` formatado, garantia de que dados foram preservados
- CTA "Entrar no Caixa de Açúcar" → `https://caixa.umbrelladoce.com.br`
- Visual Vinho/Dourado (mesmo padrão de `enviar-recuperacao-senha`)

#### 3. E-mail para a admin
Função `enviarEmailRenovacaoAdmin(emailAluna, nome, planoNovo, planoFim, source)`:
- Destinatário: secret `EMAIL_ADMIN_IMERSAO`
- Assunto: "Aluna renovou: {nome} → Caixa {Lite|Business}"
- Conteúdo: nome, e-mail, plano antigo (Imersão), plano novo, nova validade, fonte (productId + offerCode)

#### 4. Toast in-app de boas-vindas
Em `AuthContext.signIn`, após validar perfil:
- Consultar último `historico_planos` do usuário (últimas 24h, `tipo_evento = 'renovacao_imersao'`)
- Se encontrar e flag `cda-renovacao-toast-{historico_id}` não estiver em `localStorage` → exibir toast "🎉 Renovação confirmada! Bem-vinda ao Caixa {plano}." e marcar a flag

---

### Arquivos

**Editar:**
- `supabase/functions/hotmart-webhook/index.ts` — detecção `aluna_imersao → base/negocio`, helpers de e-mail Resend, `tipo_evento = 'renovacao_imersao'`
- `src/contexts/AuthContext.tsx` — toast pós-renovação
- `docs/AUDITORIA.md` — registrar a lógica e as ofertas cadastradas
- `mem://features/imersao-receita-que-faltava` — atualizar com fluxo de renovação + offer codes

**Secrets:**
- `RESEND_API_KEY` ✅ já existente
- `EMAIL_ADMIN_IMERSAO` — já solicitada no fluxo anterior

---

### Fora de escopo
- Pró-rata pelos dias restantes (nova vigência sempre 365 dias a partir da compra)
- Notificação WhatsApp/push (apenas e-mail + toast)
- Tela visual de histórico de renovações (já consultável em `historico_planos`)

**Caixa de Açúcar**

Documentação Completa do Sistema

*Módulos, funcionalidades, regras de negócio e arquitetura*

by Umbrella Doce

*Atualizado em 24/05/2026*

**Sumário**

**1. Visão Geral do Sistema**

O Caixa de Açúcar é uma plataforma SaaS de gestão completa para confeitarias, doceiras, padarias artesanais e negócios de alimentação afins. Foi projetada para profissionalizar a operação de pequenos e médios produtores, oferecendo desde a precificação técnica de receitas até o acompanhamento financeiro consolidado, planejamento estratégico, controle de estoque e gestão de encomendas.

O sistema é uma marca operada pela Umbrella Doce. Foi originalmente lançado como “SugarBox” e renomeado para Caixa de Açúcar, mantendo a identidade visual baseada na paleta Pistache, Cloud Dancer, Preto Elegante e Dourado.

**1.1. Pilares de Negócio**

- **Precificação técnica:** cálculo real de custos e preços de venda com base em ingredientes, embalagens, mão de obra, custos fixos e impostos.

- **Gestão financeira:** contas a pagar e a receber, fluxo de caixa, DRE, conciliação bancária e fechamento de mês.

- **Operação comercial:** controle de encomendas com etapas de produção, entrega e pagamento, integradas ao financeiro.

- **Pró-labore saudável:** módulo Meu Salário que calcula a retirada sustentável a partir do resultado real do mês.

- **Planejamento e bem-estar:** metas, calendário, tarefas e diário de bem-estar para o empreendedor.

- **Governança e segurança:** multi-tenancy por grupo, permissões granulares, auditoria, backups e fechamento contábil.

**1.2. Stack Tecnológico**

|  |  |
|----|----|
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS 3, shadcn/ui |
| **Roteamento** | React Router DOM |
| **Estado/dados** | TanStack Query (React Query) |
| **Backend** | Lovable Cloud (Supabase) — Postgres + Auth + Storage + Edge Functions |
| **Autenticação** | Supabase Auth com e-mails customizados via Resend |
| **Pagamentos/Provisionamento** | Hotmart Webhook (compra, renovação e cancelamento) |
| **IA** | Lovable AI Gateway (Gemini / GPT) para análises e sugestões pontuais |
| **Design system** | Tokens HSL --cda-\*: Pistache, Cloud Dancer, Preto Elegante, Dourado, Coral, Pink Rosé |

**1.3. Planos Comerciais**

O acesso aos módulos é controlado por planos. Cada usuário possui um plano ativo com data de início e fim. Quando o plano expira, os módulos restritos são bloqueados automaticamente.

- **Lite:** acesso aos módulos básicos (precificação, encomendas, clientes/fornecedores e cadastros). Sem módulo financeiro e sem estoque.

- **Business:** todos os módulos do Lite + Financeiro completo (contas a pagar/receber, fluxo de caixa, DRE, bancos, fechamento de mês) + Estoque.

> _Plano **Start** foi descontinuado em 2026-05-25 e não está mais disponível._

**2. Autenticação e Acesso**

A autenticação utiliza Supabase Auth com fluxo customizado, suprimindo os e-mails nativos do Supabase e disparando todas as comunicações via Resend através de Edge Functions.

**2.1. Fluxos Disponíveis**

- **Login com e-mail e senha:** tela split-screen com branding à esquerda e formulário à direita.

- **Login com Google (OAuth):** configurado para acelerar o primeiro acesso.

- **Recuperação de senha:** link enviado por Edge Function via Resend; redireciona para tela de redefinição.

- **Primeiro acesso (convite manual):** Admin gera convite, sistema cria conta, envia e-mail com link de definição de senha. Marcador primeiro_acesso=true até o usuário completar.

**2.2. Inicialização da Sessão**

O AuthContext segue uma sequência rígida para evitar race conditions: primeiro chama getSession() de forma awaitada, armazena o usuário no estado, e somente então registra o listener de onAuthStateChange. Sem essa ordem, eventos podem chegar antes do estado inicial estar pronto, causando redirecionamentos e telas em branco intermitentes.

**2.3. Permissões e Papéis**

Existe uma separação clara entre papéis globais e papéis dentro de grupos, todos armazenados em tabelas dedicadas (nunca diretamente no profile, para evitar escaladas de privilégio).

- **MOTHER:** papel global. Tem visibilidade administrativa do ecossistema. Não interfere em dados operacionais a menos que entre em modo admin.

- **ADMIN do grupo:** controle total dentro do tenant (owner_group_id). Pode convidar usuários, definir permissões granulares, alterar planos.

- **USER do grupo:** acesso definido por permission_flags (precificacao, financeiro, estoque, encomendas, configuracoes etc.). Cada flag liberada por Admin.

**3. Arquitetura Multi-tenant**

Toda a base é organizada por grupos (owner_group_id). Cada dado operacional pertence a um grupo, permitindo que múltiplos usuários compartilhem a mesma confeitaria com permissões distintas, sem vazar dados entre grupos.

**3.1. Mecanismos de Isolamento**

- **RLS em todas as tabelas:** políticas baseadas em user_belongs_to_group(auth.uid(), owner_group_id) ou em usuario_id quando o dado é pessoal.

- **Função SECURITY DEFINER has_permission:** verifica role + permission_flags para autorizações de aplicação.

- **Sessão de grupo ativa:** tabela user_active_session armazena o group atual do usuário; trocar de grupo invalida queries e recarrega contexto.

**4. Módulo Precificação**

Coração técnico do sistema. Permite calcular o custo real e o preço de venda saudável de cada receita, considerando ingredientes, embalagens, pré-preparos, sub-receitas, mão de obra, custos fixos e despesas variáveis sobre a venda.

**4.1. Estrutura de Insumos**

- **Ingredientes:** matéria-prima com unidade de medida, quantidade da embalagem comprada e preço ativo. Sistema mantém histórico em precos e garante apenas um preço ativo por item.

- **Embalagens:** tipo de insumo dedicado, com mesma lógica de preço unitário derivado da quantidade da embalagem.

- **Pré-preparos:** blocos reutilizáveis (ex.: massa, ganache, recheio) que combinam ingredientes e calculam custo unitário automaticamente via trigger.

- **Sub-receitas:** agrupamentos de ingredientes e pré-preparos usados como componentes de receitas finais. Custos recalculados automaticamente.

**4.2. Receitas Finais**

A receita reúne ingredientes diretos, sub-receitas, pré-preparos e embalagens. Sobre o custo total são aplicados:

- Custo de mão de obra (perfis configuráveis com valor/hora).

- Rateio de custos fixos mensais (proporcional ao tempo de produção).

- Despesas variáveis sobre a venda (comissões, taxas de cartão, frete embutido, impostos).

- Margem de lucro desejada para chegar ao preço sugerido.

O sistema exibe lado a lado o custo total, o ponto de equilíbrio e o preço sugerido, permitindo simulações em tempo real.

**4.3. Configurações de Precificação**

- **Mão de obra:** perfis com histórico de alterações (criado, alterado, desativado). Apenas um perfil pode estar marcado como padrão.

- **Custos fixos mensais:** lista de despesas recorrentes que alimenta o rateio.

- **Despesas de venda:** percentuais aplicados sobre o preço final.

**5. Módulo Encomendas**

Centraliza a operação comercial: orçamentos, pedidos, entregas e integração com financeiro. Cada encomenda pertence a um cliente e possui itens (vinculados a receitas).

**5.1. Ciclo de Vida**

- Pendente → Em produção → Pronto → Entregue → Pago/Finalizado.

- Cada mudança de status alimenta dashboards e relatórios automaticamente.

- Encomendas com status entregue, pago, concluido ou finalizado contam para o faturamento do mês.

**5.2. Tags de Encomenda**

Sistema de etiquetas customizáveis para classificar pedidos (ex.: aniversário, casamento, urgente). Existem tags padrão protegidas (não podem ser excluídas pelo usuário) e tags personalizadas livres.

**5.3. Impressão de Pedidos**

Cada encomenda pode ser impressa em PDF com os dados do cliente, lista de itens, observações, valores, datas e área para assinatura. Permite gerar PDF para um pedido individual ou para múltiplos pedidos selecionados em lote.

**5.4. Integração com Financeiro**

Ao registrar pagamento de uma encomenda, é possível gerar uma conta a receber automaticamente, com parcelamento e plano de contas. O fluxo evita duplicidade entre módulos.

**6. Módulo Estoque**

Disponível para o plano Business. Controla entradas, saídas e ajustes, mantendo custo médio ponderado e visibilidade do que está disponível em cada momento.

**6.1. Funcionalidades**

- **Entrada de estoque:** registro de compras com fornecedor, nota, valor e quantidade. Atualiza custo médio.

- **Movimentações:** histórico completo de entradas, saídas e ajustes com data, motivo e usuário.

- **Ajuste manual:** correções de contagem com justificativa obrigatória.

- **Dashboard de estoque:** itens com saldo crítico, valor total imobilizado, giro estimado.

**6.2. Custo Médio**

Cada entrada recalcula o custo médio ponderado do item: (saldo_atual × custo_atual + entrada × custo_entrada) / (saldo + entrada). O custo médio é o valor usado nas receitas e relatórios de margem.

**7. Módulo Financeiro**

Conjunto mais robusto da plataforma, exclusivo do plano Business. Reúne contas a pagar, contas a receber, plano de contas, bancos, fluxo de caixa, DRE, fechamento de mês e configurações de juros.

**7.1. Contas a Receber**

- **Lançamentos parcelados:** cada conta pode ter N parcelas com data de vencimento, valor e status (pendente, recebida, vencida).

- **Pagamentos parciais:** uma parcela pode ter múltiplos pagamentos, cada um com banco de destino, comprovante, juros e multa calculados conforme configuração.

- **Estorno:** pagamentos podem ser estornados, sem deletar histórico.

**7.2. Contas a Pagar**

Mesma estrutura das contas a receber (parcelas + pagamentos + comprovantes), aplicada aos compromissos com fornecedores. Inclui categorização por plano de contas e tipo de documento (nota fiscal, recibo, boleto, PIX etc.).

**7.3. Plano de Contas**

Estrutura contábil em duas camadas: categorias (Receitas, CMV, Despesas com Pessoal, Despesas com Ocupação, Tributos, Investimentos, Transferências, Receitas/Despesas Financeiras etc.) e contas (linhas específicas dentro de cada categoria). Cada usuário inicia com um conjunto padrão pré-configurado e pode personalizá-lo.

**7.4. Bancos e Caixa**

Cada grupo possui contas bancárias e um Caixa Empresa criado automaticamente. Saldos iniciais por mês permitem partir de qualquer ponto histórico. Conciliação bancária via importação de extrato CSV/OFX, com matching automático e manual contra contas a pagar/receber.

**7.5. Fluxo de Caixa**

- **Diário:** visão por dia com entradas, saídas e saldo acumulado.

- **Mensal:** consolidação mês a mês com filtros por banco, categoria e tipo.

**7.6. DRE**

Demonstração de Resultados gerada automaticamente a partir do plano de contas, com receita bruta, deduções, CMV, lucro bruto, despesas operacionais, resultado financeiro, resultado não operacional e lucro líquido.

**7.7. Configuração de Juros e Multa**

Cada usuário define se cobra juros (diário ou mensal) e multa por atraso. A função calcular_juros_com_config aplica essa regra automaticamente em pagamentos atrasados.

**7.8. Fechamento de Mês**

Permite consolidar e travar um mês inteiro, congelando faturamento, custos, pró-labore saudável e retiradas em um snapshot imutável.

- **Checklist guiado:** 6 etapas obrigatórias (conferência de saldos, baixa de recebimentos/pagamentos, registro de pró-labore, revisão de lançamentos sem categoria, conferência de DRE e Fluxo de Caixa).

- **Trava total:** triggers em contas_receber, contas_pagar, parcelas e pagamentos bloqueiam INSERT/UPDATE/DELETE quando a data cai dentro de um mês fechado.

- **Reabertura com motivo:** qualquer usuário do grupo pode reabrir, mas precisa informar motivo obrigatório (mínimo 3 caracteres). Cada ação fica registrada em fechamento_logs com autor, snapshot e data.

- **Histórico de mudanças:** a página exibe a linha do tempo de fechamentos e reaberturas com motivo e valores consolidados na época.

**8. Módulo Meu Salário**

Calcula o pró-labore saudável da empreendedora com base no resultado real do último mês fechado, evitando que ela retire mais do que o negócio comporta.

**8.1. Cálculo**

Pró-labore saudável = max(0, Faturamento − Custos − Margem de Segurança). A margem de segurança padrão é 20% do faturamento, formando uma reserva para imprevistos.

Quando o mês está fechado, os valores são lidos do snapshot em fechamentos_mensais (imutáveis). Quando ainda está aberto, são calculados em tempo real a partir dos pagamentos do mês.

**8.2. Retiradas**

Registro de cada saque/retirada com data, valor e descrição. O saldo restante mostra quanto da retirada saudável ainda está disponível, evitando descapitalizar o caixa.

**8.3. Educativo**

Aba com explicações didáticas sobre pró-labore, margem de segurança, diferença entre lucro e retirada e por que registrar tudo importa.

**9. Módulo Planejamento**

Plataforma estratégica para a empreendedora estruturar o ano e a rotina. Disponível conforme o plano. Organiza-se em 4 abas integradas.

**9.1. Calendário**

Visão mensal/semanal de compromissos, datas comerciais, entregas previstas e tarefas. Permite criar eventos personalizados.

**9.2. Metas**

Definição de metas de faturamento mensais e anuais, com acompanhamento em tempo real do percentual atingido em relação às vendas realizadas.

**9.3. Tarefas**

Lista de tarefas com prazo, prioridade, status e responsável, organizadas em quadros simples para acompanhamento diário.

**9.4. Bem-Estar**

Diário de bem-estar com humor, energia, sono e observações. Estimula a empreendedora a cuidar de si tanto quanto cuida do negócio.

**10. Cadastros Base**

**10.1. Clientes**

Base completa de clientes com dados pessoais, endereço, datas (aniversário do cliente e de familiares), histórico de pedidos, preferências e tags. Visão de aniversariantes do mês para ações comerciais.

**10.2. Fornecedores**

Cadastro com dados de contato, prazo de pagamento, condições e datas de aniversário (próprio e de representantes). Vinculado a contas a pagar e a entradas de estoque.

**10.3. Categorias, Unidades de Medida e Tipos de Documento**

Listas base usadas pelos demais módulos. Cada usuário recebe um conjunto padrão na criação da conta (criar_categorias_padrao, criar_unidades_medida_padrao, criar_tipos_documento_padrao_para_usuario).

**11. Configurações**

**11.1. Seus Dados**

Perfil da confeitaria: nome, razão social, CPF/CNPJ, endereço completo, contatos, redes sociais (Instagram, WhatsApp), horários e dias de trabalho, metas, custo fixo mensal e logo. Esses dados alimentam relatórios, impressões e cálculos.

**11.2. Tags de Encomendas**

Gerencia tags personalizadas. Tags padrão do sistema não podem ser excluídas.

**11.3. Configurações Financeiras**

Plano de contas, categorias do plano de contas, bancos, tipos de documento e configurações de juros/multa.

**11.4. Configurações de Precificação**

Mão de obra, custos fixos e despesas variáveis padrão usadas pelas receitas.

**12. Sistema de Backup**

Cada usuário pode gerar backups manuais e/ou agendar backups automáticos diários, semanais, quinzenais ou mensais. O backup é um snapshot JSON de todas as tabelas relevantes do usuário.

**12.1. Funcionamento**

- **Tabela backups:** armazena cada snapshot com nome formatado CAIXA + iniciais do nome + DDMMAAAA e tamanho em KB.

- **Tabela backup_agendamentos:** guarda frequência, horário, próxima execução e último executado.

- **Edge Function executar-backups-agendados:** disparada a cada 30 minutos por pg_cron + pg_net. Lê agendamentos vencidos, gera snapshot, grava em backups e recalcula a próxima execução.

- **Restauração:** usuário pode baixar o backup ou restaurar dados a partir do snapshot, recuperando o estado do dia.

**13. Integração Hotmart**

O provisionamento e a renovação de planos são automáticos via Webhook Hotmart. O sistema mapeia palavras-chave no nome do produto vendido para identificar o plano (Lite ou Business) e a duração (mensal ou anual).

**13.1. Eventos Tratados**

- PURCHASE_APPROVED: cria/atualiza usuário e ativa plano.

- PURCHASE_REFUNDED / CANCELED: encerra o plano.

- SUBSCRIPTION_CANCELLATION: marca expiração ao fim do período pago.

- PURCHASE_DELAYED / CHARGEBACK: notifica e suspende conforme política.

**14. Admin e Governança**

**14.1. Dashboard Administrativo**

Reservada a usuários com role admin. Mostra estatísticas globais: total de usuários, ativos/inativos, distribuição por plano, origem de criação (Hotmart, manual, OAuth), últimos logins e crescimento mensal.

**14.2. Gestão de Usuários**

- **Filtros:** ativos, inativos, por plano, por origem.

- **Ações:** redefinir senha (e-mail via Resend), trocar plano, conceder/revogar permissões, desativar conta.

- **Proteção de plano:** trigger protect_plan_fields impede que não-admins alterem campos do próprio plano.

**14.3. Logs de Auditoria**

Toda ação administrativa relevante é registrada em admin_audit_log com ação, módulo, alvo, antigo/novo valor e motivo. Tokens de acesso administrativo (impersonificação) são emitidos via admin_access_tokens com expiração e podem ser revogados.

**15. Segurança e Conformidade**

- **RLS em todas as tabelas operacionais:** padrão default-deny.

- **Roles em tabela separada:** user_roles e user_group_roles — nunca no profile, evitando privilege escalation.

- **Funções SECURITY DEFINER com search_path fixo:** evitam escapes via shadowing de schema.

- **Storage privado:** buckets restritos por pasta do usuário e URLs assinadas curtas.

- **E-mails customizados via Resend:** Supabase native suprimido para padronizar templates e domínio remetente.

- **Tracking de origem:** campo origem_criacao em profiles diferencia hotmart, manual, oauth para auditoria.

- **Documentação contínua:** AUDITORIA.md e PENDENCIAS_SEGURANCA.md atualizados a cada mudança de RLS, SQL, Edge Function ou Auth.

**16. Padrões de UX e Design System**

**16.1. Identidade Visual**

|                             |                 |
|-----------------------------|-----------------|
| **Cor primária (Pistache)** | \#BFCFB8        |
| **Fundo (Cloud Dancer)**    | \#F5F4F1        |
| **Texto (Preto Elegante)**  | \#1C1C1C        |
| **Acento (Dourado)**        | \#C6A85A        |
| **Alerta (Coral)**          | tom coral suave |
| **Detalhe (Pink Rosé)**     | tom rosé pastel |

Tokens HSL com prefixo --cda-\* aplicados via Tailwind (classes cda-preto, cda-cloud, cda-pistache, cda-dourado, cda-coral, cda-pink). Componentes shadcn/ui adaptados para essa paleta.

**16.2. Padrões de Interação**

- Loading global: retorna null enquanto useGlobalLoading=true para evitar flashes de UI.

- Datas tratadas exclusivamente como YYYY-MM-DD ISO via src/lib/dateUtils.ts, evitando bugs de UTC -1 dia.

- Alertas seguem padrão visual: fundo dourado, texto preto, CTA coral.

- Splash screen e mascote dedicados ao estado de carregamento inicial.

**17. Integrações Técnicas**

**17.1. Edge Functions Principais**

- **executar-backups-agendados:** cron de backups.

- **hotmart-webhook:** provisionamento de planos.

- **send-auth-email:** Resend para confirmações, reset e convites.

- **admin-actions:** ações privilegiadas (reset, criação manual, impersonificação com token).

**17.2. Cron Jobs**

pg_cron + pg_net executam tarefas agendadas no banco. Atualmente: backups automáticos (a cada 30 min) e atualização de parcelas vencidas.

**18. Roadmap e Pendências**

O arquivo docs/PENDENCIAS_SEGURANCA.md mantém o backlog de melhorias de segurança que dependem de ação externa. O docs/AUDITORIA.md registra cronologicamente todas as correções de auditoria com data e descrição.

Direções futuras já mapeadas: relatórios fiscais automatizados, integração com emissores de NF-e, app mobile para registrar vendas no balcão, marketplace de receitas e templates de cardápio, e dashboards comparativos entre meses fechados.

**19. Conclusão**

O Caixa de Açúcar combina rigor financeiro com cuidado afetivo pelo dia a dia da empreendedora confeiteira. Cada módulo foi pensado para que a pessoa por trás do negócio possa enxergar a operação inteira em um só lugar, tomar decisões baseadas em dados reais e construir uma rotina sustentável — financeira e pessoalmente.

Esta documentação é um retrato vivo do sistema na data desta geração. À medida que novas funcionalidades forem implementadas, os arquivos DOCS\_\*.md específicos e o histórico em docs/AUDITORIA.md devem ser atualizados, e este documento pode ser regenerado para refletir o estado mais recente.

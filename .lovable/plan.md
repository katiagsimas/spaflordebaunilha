## Objetivo

Aplicar o padrão visual da imagem de referência (header vinho com texto creme + serifa, corpo creme com acentos dourado, ilustrações decorativas, CTA vinho com seta dourada) em **todo o Dashboard (`/dashboard`)** e refinar a **Sidebar** mantendo a paleta `--cda-*` já existente (Vinho `#5B1A2B`, Vinho Escuro `#3D0F1C`, Dourado `#C9A14A`, Creme `#FDF6EE`, Branco `#FFF9F5`).

Nenhuma lógica de negócio, query Supabase, hook ou cálculo será alterado — só estrutura visual / classes Tailwind / wrappers.

## 1. Assets

- Copiar `user-uploads://Imagens_e_Ícones_Caixa_de_Açúcar_1.png` → `src/assets/cda-illu-presente-vinho.png` (caixa de presente vinho com flores — usada como ornamento no canto superior direito do card de Aniversariantes).
- Copiar `user-uploads://Imagens_e_Ícones_Caixa_de_Açúcar-2.png` → `src/assets/cda-illu-calendario-rosa.png` (calendário rosa com macaron — usada como ornamento nos calendários de encomendas).

## 2. Padrão de card "Vinho Premium" (criar componente reusável)

Criar `src/components/dashboard/PremiumCard.tsx` com a estrutura espelhada da imagem:

```text
┌─────────────────────────────────────────────────┐
│  [icon]  Título serifa creme       [illustration]│  ← header vinho (--cda-vinho)
│          subtítulo dourado                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  conteúdo em fundo creme (--cda-creme)           │
│                                                  │
│  [ilustração opcional emoji/lucide]   [CTA vinho]│  ← footer com CTA opcional
└─────────────────────────────────────────────────┘
```

Props: `icon`, `title`, `subtitle`, `headerOrnament?` (img src), `footerNote?`, `footerCta?` ({label, onClick}), `children`. Bordas `rounded-2xl`, sombra suave, sem borda dura. Header: `bg-cda-vinho text-cda-creme`, título em `font-display` (serifa já no projeto), subtítulo em `text-cda-dourado/80 text-sm`.

## 3. Aplicação nos blocos do Dashboard

Substituir cada `<Card>` shadcn atual por `<PremiumCard>` mantendo o conteúdo:

| Bloco atual | Vira |
|---|---|
| Saudação + contadores topo | Header próprio fora do PremiumCard (faixa simples) |
| Alertas Financeiros (3 cards) | 1 `PremiumCard` "Alertas Financeiros" com 3 linhas internas (avatar circular vinho/dourado por tipo, mesmo padrão das linhas de aniversariantes da ref) |
| Calendários (3 meses) | `PremiumCard` "Calendário de Encomendas" com `cda-illu-calendario-rosa.png` no canto superior direito; conteúdo (3 mini-calendários) intacto, só ajustar cores das células para vinho/dourado |
| Aniversariantes | `PremiumCard` **espelho exato da imagem**: ornamento `cda-illu-presente-vinho.png`, avatares circulares vinho com iniciais douradas, dividers tracejados, contador lateral "X aniversariantes este mês", footer com 🎉 + "Pequenos gestos criam grandes lembranças." + CTA "VER TODOS →" |
| Visão Econômica (tabs mensal/anual) | `PremiumCard` "Visão Econômica" — tabs em pill dourado, gráficos com cores `--cda-vinho`/`--cda-dourado` |
| Top 5 Produtos + Ticket Médio | `PremiumCard` "Top Produtos" — ranking com badges circulares vinho/dourado |
| Vendas por mês (linha) | `PremiumCard` "Vendas por Mês" — linha em `--cda-vinho`, grid em `--cda-dourado/20` |
| Fluxo de caixa (linha) | `PremiumCard` "Fluxo de Caixa" — linha em `--cda-dourado` |

Grid mantido (responsivo, 2 colunas em desktop quando aplicável).

## 4. Refino da Sidebar

Mantém estrutura/menus atuais, só refina:

- `SidebarGroupLabel`: trocar para `font-display` (serifa), `tracking-[0.2em]`, dourado `text-cda-dourado/70`.
- Item ativo: já usa borda esquerda dourada — adicionar leve `bg-gradient-to-r from-cda-dourado/10 to-transparent`.
- Hover: `hover:bg-cda-dourado/5` (mais sutil) + transição de cor dourada no ícone.
- Separadores entre seções: já existem em dourado; manter mas aumentar margem vertical (`my-2`).
- Header da sidebar: trocar o texto "CAIXA DE AÇÚCAR" para `font-display` em creme, "by Umbrella Doce" em dourado claro.
- Badge "HOJE" das encomendas: trocar do vermelho para `bg-cda-dourado text-cda-vinho` (mantém alerta visual mas dentro da paleta).

## 5. Arquivos a alterar

- **criar**: `src/assets/cda-illu-presente-vinho.png`, `src/assets/cda-illu-calendario-rosa.png`, `src/components/dashboard/PremiumCard.tsx`
- **editar**: `src/pages/Dashboard.tsx` (substituições visuais nos blocos; zero mudança nas funções de carregamento), `src/components/AppSidebar.tsx` (refino de classes Tailwind)

## 6. Restrições / não-objetivos

- Nada de mudar SQL, RLS, hooks, Edge Functions, lógica financeira ou queries.
- Nada de mexer em outras rotas/módulos (Financeiro, Estoque, Encomendas etc.) — só `/dashboard` e a Sidebar global.
- Não introduzir cores fora dos tokens `cda-*`.
- Não alterar `src/index.css` (tokens já existem).
- Não alterar tipografia global; apenas usar as fontes já carregadas (`font-display` para serifa, `font-body` para sans).

## 7. QA

Após implementar, abrir o preview em `/dashboard` e validar:

1. Header da sidebar e itens ativos com refino dourado.
2. Card de Aniversariantes idêntico à imagem (ornamento, avatares, contador lateral, CTA).
3. Demais cards com header vinho + corpo creme consistentes.
4. Layout responsivo não quebra em 1020px (viewport atual do usuário).

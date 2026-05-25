## Alteração

Aplicar cor clara (creme) ao ícone do botão `SidebarTrigger` no header (App.tsx, linha 146), que hoje herda cor escura e fica praticamente invisível sobre o fundo vinho.

### Mudança

Em `src/App.tsx`, linha 146:

```tsx
<SidebarTrigger className="text-cda-creme hover:bg-cda-creme/10 hover:text-cda-creme transition-colors" />
```

E ajustar o divisor ao lado (linha 147) para usar `bg-cda-creme/30` em vez de `bg-border`, mantendo coerência sobre o fundo vinho.

Nenhuma outra alteração — apenas estilização visual do botão marcado na captura.
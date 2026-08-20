#!/usr/bin/env bash
# ============================================================
# check-umbrella-refs.sh
# Verifica que não existem referências ao "app Spa Flor de Baunilha"
# no código-fonte. Apenas "by Spa Flor de Baunilha" (marca da empresa),
# emails @spaflordebaunilha.com.br e domínio spa.spaflordebaunilha.com.br
# são permitidos.
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "🔍 Verificando referências proibidas ao app Spa Flor de Baunilha..."
echo ""

# 1. Tokens CSS antigos --umbrella-*
echo -n "  [1/6] Tokens CSS --umbrella-* ... "
HITS=$(rg --count-matches -- '--umbrella-' src/ tailwind.config.ts index.html 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC}"
  rg -n -- '--umbrella-' src/ tailwind.config.ts index.html 2>/dev/null || true
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 2. Logo antiga umbrella-logo-*
echo -n "  [2/6] Logo umbrella-logo-* ... "
HITS=$(find public/ src/assets/ -name 'umbrella-logo-*' 2>/dev/null | head -1)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC} — $HITS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 3. Link gestao.spaflordebaunilha.com.br (app antigo)
echo -n "  [3/6] Link gestao.spaflordebaunilha.com.br ... "
HITS=$(rg -rn 'gestao\.umbrelladoce' src/ supabase/ index.html 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC}"
  echo "$HITS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 4. Iframe app.spaflordebaunilha.com.br
echo -n "  [4/6] Iframe app.spaflordebaunilha.com.br ... "
HITS=$(rg -rn 'app\.umbrelladoce' src/ supabase/ index.html 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC}"
  echo "$HITS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 5. Classes Tailwind umbrella-* (ex: text-umbrella-dourado)
echo -n "  [5/6] Classes Tailwind umbrella-* ... "
HITS=$(rg -rn 'umbrella-preto\|umbrella-cloud\|umbrella-pistache\|umbrella-dourado\|umbrella-coral\|umbrella-pink' src/ tailwind.config.ts 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC}"
  echo "$HITS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 6. Texto "app Spa Flor de Baunilha" (menção ao app como produto separado)
echo -n "  [6/6] Texto 'app Spa Flor de Baunilha' ... "
HITS=$(rg -rni 'app Spa Flor de Baunilha' src/ supabase/ index.html DOCS_MESTRE.md DOCS_AUTENTICACAO.md 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC}"
  echo "$HITS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 7. Strings em PDFs exportados (exportarReceitaPDF, exportarPrePreparoPDF, gerarReciboPagamento, templates)
echo -n "  [7/7] Texto 'app Spa Flor de Baunilha' em geradores de PDF ... "
HITS=$(rg -rni 'app Spa Flor de Baunilha' src/utils/exportar*.ts src/utils/gerar*.ts supabase/functions/*/index.ts 2>/dev/null | grep -vi 'by Spa Flor de Baunilha' || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FALHOU${NC}"
  echo "$HITS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

echo ""

# Verificação informativa (não bloqueia)
echo -e "${YELLOW}ℹ️  Referências legítimas mantidas (empresa):${NC}"
echo "  - 'by Spa Flor de Baunilha' (branding)"
echo "  - Emails @spaflordebaunilha.com.br"  
echo "  - Domínio spa.spaflordebaunilha.com.br"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}❌ $ERRORS verificação(ões) falharam!${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Todas as verificações passaram — nenhuma referência proibida encontrada.${NC}"
  exit 0
fi

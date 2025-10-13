import { useState, useEffect } from "react";
import { Plus, Pencil, FolderTree, ChevronDown, ChevronRight, Search, Trash2, AlertTriangle, Package, Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { ExportImport } from "@/components/ExportImport";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone: string;
  ativo: boolean;
}

interface PlanoConta {
  id: string;
  nome: string;
  descricao?: string;
  categoriaId: string;
  tipo: 'receita' | 'despesa';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Planos de contas pré-configurados
const planosContasPreConfigurados: PlanoConta[] = [
  // RECEITAS COM VENDAS
  {
    id: 'pc-rec-001',
    nome: 'Receitas com Produtos',
    descricao: 'Vendas de bolos, doces, tortas, etc',
    categoriaId: 'cat-rec-001', // Receitas com Vendas
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-002',
    nome: 'Receitas com Encomendas',
    descricao: 'Encomendas personalizadas',
    categoriaId: 'cat-rec-001', // Receitas com Vendas
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-003',
    nome: 'Receitas com Delivery',
    descricao: 'Vendas por delivery (iFood, Rappi, etc)',
    categoriaId: 'cat-rec-001', // Receitas com Vendas
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // RECEITAS COM SERVIÇOS
  {
    id: 'pc-rec-004',
    nome: 'Receitas com Cursos',
    descricao: 'Aulas e workshops de confeitaria',
    categoriaId: 'cat-rec-002', // Receitas com Serviços
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-005',
    nome: 'Receitas com Consultoria',
    descricao: 'Serviços de consultoria em confeitaria',
    categoriaId: 'cat-rec-002', // Receitas com Serviços
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-006',
    nome: 'Receitas com Degustação',
    descricao: 'Eventos de degustação',
    categoriaId: 'cat-rec-002', // Receitas com Serviços
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // RECEITAS FINANCEIRAS
  {
    id: 'pc-rec-007',
    nome: 'Juros Recebidos',
    descricao: 'Juros de aplicações financeiras',
    categoriaId: 'cat-rec-003', // Receitas Financeiras
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-008',
    nome: 'Rendimentos de Investimentos',
    descricao: 'Rendimentos de poupança, CDB, etc',
    categoriaId: 'cat-rec-003', // Receitas Financeiras
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // RECEITAS NÃO OPERACIONAIS
  {
    id: 'pc-rec-009',
    nome: 'Venda de Equipamentos',
    descricao: 'Venda de equipamentos usados',
    categoriaId: 'cat-rec-004', // Receitas não Operacionais
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-010',
    nome: 'Receitas Eventuais',
    descricao: 'Receitas não recorrentes',
    categoriaId: 'cat-rec-004',
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // OUTRAS RECEITAS
  {
    id: 'pc-rec-011',
    nome: 'Descontos Obtidos',
    descricao: 'Descontos recebidos de fornecedores',
    categoriaId: 'cat-rec-009', // Outras Receitas
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-rec-012',
    nome: 'Bonificações',
    descricao: 'Bonificações e brindes recebidos',
    categoriaId: 'cat-rec-009',
    tipo: 'receita',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // CUSTOS DE PRODUÇÃO
  {
    id: 'pc-desp-001',
    nome: 'Custo com Ingredientes',
    descricao: 'Farinha, açúcar, ovos, etc',
    categoriaId: 'cat-desp-008', // Custos de Produção
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-002',
    nome: 'Custo com Embalagens',
    descricao: 'Caixas, formas, sacos, etc',
    categoriaId: 'cat-desp-008', // Custos de Produção
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-003',
    nome: 'Mão de Obra Direta',
    descricao: 'Confeiteiros e auxiliares de produção',
    categoriaId: 'cat-desp-003', // Despesas com Pessoal
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS FIXAS
  {
    id: 'pc-desp-004',
    nome: 'Aluguel',
    descricao: 'Aluguel do estabelecimento',
    categoriaId: 'cat-desp-001', // Despesas Fixas
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-005',
    nome: 'Água',
    descricao: 'Conta de água',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-006',
    nome: 'Luz',
    descricao: 'Conta de energia elétrica',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-007',
    nome: 'Internet',
    descricao: 'Serviço de internet',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-008',
    nome: 'Telefone',
    descricao: 'Conta de telefone fixo/celular',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-009',
    nome: 'Gás',
    descricao: 'Gás de cozinha',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-010',
    nome: 'Contador',
    descricao: 'Honorários contábeis',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-011',
    nome: 'Condomínio',
    descricao: 'Taxa de condomínio',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-012',
    nome: 'IPTU',
    descricao: 'Imposto predial e territorial urbano',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-013',
    nome: 'Seguro',
    descricao: 'Seguro do estabelecimento',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-014',
    nome: 'Alarme/Segurança',
    descricao: 'Sistema de segurança',
    categoriaId: 'cat-desp-001',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS VARIÁVEIS
  {
    id: 'pc-desp-015',
    nome: 'Embalagens',
    descricao: 'Caixas, sacolas, fitas, tags',
    categoriaId: 'cat-desp-002', // Despesas Variáveis
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-016',
    nome: 'Material de Limpeza',
    descricao: 'Produtos de limpeza e higiene',
    categoriaId: 'cat-desp-002',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-017',
    nome: 'Material de Escritório',
    descricao: 'Papelaria em geral',
    categoriaId: 'cat-desp-002',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-018',
    nome: 'Descartáveis',
    descricao: 'Copos, pratos, talheres descartáveis',
    categoriaId: 'cat-desp-002',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM PESSOAL
  {
    id: 'pc-desp-019',
    nome: 'Salários',
    descricao: 'Folha de pagamento',
    categoriaId: 'cat-desp-003', // Despesas com Pessoal
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-020',
    nome: 'Pró-labore',
    descricao: 'Retirada dos sócios',
    categoriaId: 'cat-desp-003',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-021',
    nome: 'Encargos Sociais',
    descricao: 'INSS, FGTS, férias, 13º',
    categoriaId: 'cat-desp-003',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-022',
    nome: 'Vale Transporte',
    descricao: 'Auxílio transporte funcionários',
    categoriaId: 'cat-desp-003',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-023',
    nome: 'Vale Alimentação',
    descricao: 'Auxílio alimentação funcionários',
    categoriaId: 'cat-desp-003',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-024',
    nome: 'Uniformes',
    descricao: 'Uniformes para equipe',
    categoriaId: 'cat-desp-003',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS ADMINISTRATIVAS
  {
    id: 'pc-desp-025',
    nome: 'Assessoria Jurídica',
    descricao: 'Honorários advocatícios',
    categoriaId: 'cat-desp-004', // Despesas Administrativas
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-026',
    nome: 'Serviços de Terceiros',
    descricao: 'Prestadores de serviço diversos',
    categoriaId: 'cat-desp-004',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-027',
    nome: 'Cartório',
    descricao: 'Taxas e serviços cartoriais',
    categoriaId: 'cat-desp-004',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM MARKETING
  {
    id: 'pc-desp-028',
    nome: 'Anúncios Facebook/Instagram',
    descricao: 'Investimento em ads nas redes sociais',
    categoriaId: 'cat-desp-005', // Despesas com Marketing
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-029',
    nome: 'Google Ads',
    descricao: 'Anúncios no Google',
    categoriaId: 'cat-desp-005',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-030',
    nome: 'Material Gráfico',
    descricao: 'Cartões de visita, flyers, banners',
    categoriaId: 'cat-desp-005',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-031',
    nome: 'Fotografia',
    descricao: 'Fotos profissionais de produtos',
    categoriaId: 'cat-desp-005',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-032',
    nome: 'Mídias Sociais',
    descricao: 'Gestão de redes sociais',
    categoriaId: 'cat-desp-005',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-033',
    nome: 'Eventos e Feiras',
    descricao: 'Participação em eventos',
    categoriaId: 'cat-desp-005',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM VENDAS
  {
    id: 'pc-desp-034',
    nome: 'Taxa iFood',
    descricao: 'Comissão plataforma iFood',
    categoriaId: 'cat-desp-006', // Despesas com Vendas
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-035',
    nome: 'Taxa Rappi',
    descricao: 'Comissão plataforma Rappi',
    categoriaId: 'cat-desp-006',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-036',
    nome: 'Frete e Entregas',
    descricao: 'Custos com entregas',
    categoriaId: 'cat-desp-006',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-037',
    nome: 'Comissões',
    descricao: 'Comissões de vendedores/representantes',
    categoriaId: 'cat-desp-006',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-038',
    nome: 'Amostras Grátis',
    descricao: 'Degustações e amostras promocionais',
    categoriaId: 'cat-desp-006',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS FINANCEIRAS
  {
    id: 'pc-desp-039',
    nome: 'Juros de Empréstimos',
    descricao: 'Juros de financiamentos',
    categoriaId: 'cat-desp-007', // Despesas Financeiras
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-040',
    nome: 'Tarifas Bancárias',
    descricao: 'Taxas de manutenção de conta',
    categoriaId: 'cat-desp-007',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-041',
    nome: 'Taxa Maquininha',
    descricao: 'Taxas de cartão de crédito/débito',
    categoriaId: 'cat-desp-007',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-042',
    nome: 'IOF',
    descricao: 'Imposto sobre operações financeiras',
    categoriaId: 'cat-desp-007',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-043',
    nome: 'Multas e Juros',
    descricao: 'Multas por atraso de pagamentos',
    categoriaId: 'cat-desp-007',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // CUSTOS DE PRODUÇÃO
  {
    id: 'pc-desp-044',
    nome: 'Ingredientes',
    descricao: 'Matérias-primas (farinha, açúcar, ovos, etc)',
    categoriaId: 'cat-desp-008', // Custos de Produção
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-045',
    nome: 'Recheios e Coberturas',
    descricao: 'Chocolates, doces de leite, geleias',
    categoriaId: 'cat-desp-008',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-046',
    nome: 'Confeitos e Decorações',
    descricao: 'Sprinkles, pérolas, corantes, essências',
    categoriaId: 'cat-desp-008',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-047',
    nome: 'Utensílios de Produção',
    descricao: 'Formas, saco de confeitar, espátulas',
    categoriaId: 'cat-desp-008',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM IMPOSTOS
  {
    id: 'pc-desp-048',
    nome: 'MEI',
    descricao: 'DAS Microempreendedor Individual',
    categoriaId: 'cat-desp-009', // Despesas com Impostos
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-049',
    nome: 'Simples Nacional',
    descricao: 'DAS Simples Nacional',
    categoriaId: 'cat-desp-009',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-048',
    nome: 'ISS',
    descricao: 'Imposto sobre serviços',
    categoriaId: 'cat-desp-009',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM TRANSPORTE
  {
    id: 'pc-desp-049',
    nome: 'Combustível',
    descricao: 'Gasolina para entregas',
    categoriaId: 'cat-desp-010', // Despesas com Transporte
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-050',
    nome: 'Manutenção de Veículo',
    descricao: 'Revisão, troca de óleo, pneus',
    categoriaId: 'cat-desp-010',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-051',
    nome: 'IPVA',
    descricao: 'Imposto sobre veículo',
    categoriaId: 'cat-desp-010',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-052',
    nome: 'Seguro de Veículo',
    descricao: 'Seguro do carro/moto',
    categoriaId: 'cat-desp-010',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-053',
    nome: 'Estacionamento',
    descricao: 'Taxas de estacionamento',
    categoriaId: 'cat-desp-010',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM MANUTENÇÃO
  {
    id: 'pc-desp-054',
    nome: 'Manutenção de Equipamentos',
    descricao: 'Conserto de fornos, batedeiras, etc',
    categoriaId: 'cat-desp-011', // Despesas com Manutenção
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-055',
    nome: 'Manutenção Predial',
    descricao: 'Reparos no imóvel',
    categoriaId: 'cat-desp-011',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-056',
    nome: 'Pintura',
    descricao: 'Pintura e reformas',
    categoriaId: 'cat-desp-011',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM TECNOLOGIA
  {
    id: 'pc-desp-057',
    nome: 'Software/Sistemas',
    descricao: 'Assinaturas de sistemas e aplicativos',
    categoriaId: 'cat-desp-012', // Despesas com Tecnologia
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-058',
    nome: 'Hospedagem de Site',
    descricao: 'Servidor e domínio',
    categoriaId: 'cat-desp-012',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-059',
    nome: 'Equipamentos de TI',
    descricao: 'Computadores, tablets, impressoras',
    categoriaId: 'cat-desp-012',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-060',
    nome: 'Suporte Técnico',
    descricao: 'Manutenção de equipamentos de informática',
    categoriaId: 'cat-desp-012',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // DESPESAS COM SEGUROS
  {
    id: 'pc-desp-061',
    nome: 'Seguro Empresarial',
    descricao: 'Seguro do estabelecimento',
    categoriaId: 'cat-desp-013', // Despesas com Seguros
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-062',
    nome: 'Seguro de Equipamentos',
    descricao: 'Seguro de fornos e equipamentos',
    categoriaId: 'cat-desp-013',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // OUTRAS DESPESAS
  {
    id: 'pc-desp-063',
    nome: 'Perdas e Quebras',
    descricao: 'Produtos perdidos ou quebrados',
    categoriaId: 'cat-desp-015', // Outras Despesas
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-064',
    nome: 'Doações',
    descricao: 'Doações e contribuições',
    categoriaId: 'cat-desp-015',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'pc-desp-065',
    nome: 'Despesas Eventuais',
    descricao: 'Despesas não recorrentes',
    categoriaId: 'cat-desp-015',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
];

const STORAGE_KEY = 'sugarbox_planos_contas';

export default function PlanosContas() {
  const [planosContas, setPlanosContas] = useLocalStorage<PlanoConta[]>(STORAGE_KEY, []);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todas');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [editingPlanoConta, setEditingPlanoConta] = useState<PlanoConta | null>(null);
  const [deletingPlanoConta, setDeletingPlanoConta] = useState<PlanoConta | null>(null);
  const [selectedCategoriaForNew, setSelectedCategoriaForNew] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoriaId: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    ativo: true,
  });
  const { toast } = useToast();

  // Inicializar com planos pré-configurados se estiver vazio
  useEffect(() => {
    if (planosContas.length === 0) {
      setPlanosContas(planosContasPreConfigurados);
      toast({
        title: "Sistema Inicializado",
        description: "✓ Sistema inicializado com 65 planos de contas padrão!",
        duration: 5000,
      });
    }
    
    // Carregar categorias financeiras
    const categoriasStr = localStorage.getItem('sugarbox_categorias_financeiras');
    if (categoriasStr) {
      setCategorias(JSON.parse(categoriasStr));
    }
  }, []);

  const toggleCategory = (categoriaId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }));
  };

  const handleOpenDialog = (planoConta?: PlanoConta, categoriaId?: string) => {
    if (planoConta) {
      setEditingPlanoConta(planoConta);
      setFormData({
        nome: planoConta.nome,
        descricao: planoConta.descricao || '',
        categoriaId: planoConta.categoriaId,
        tipo: planoConta.tipo,
        ativo: planoConta.ativo,
      });
    } else {
      setEditingPlanoConta(null);
      setFormData({
        nome: '',
        descricao: '',
        categoriaId: categoriaId || selectedCategoriaForNew || '',
        tipo: 'despesa',
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlanoConta(null);
    setFormData({
      nome: '',
      descricao: '',
      categoriaId: '',
      tipo: 'despesa',
      ativo: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.nome.length > 100) {
      toast({
        title: "Erro",
        description: "Nome deve ter no máximo 100 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!formData.categoriaId) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria",
        variant: "destructive",
      });
      return;
    }

    // Verificar se categoria existe e está ativa
    const categoria = categorias.find(c => c.id === formData.categoriaId);
    if (!categoria) {
      toast({
        title: "Erro",
        description: "Categoria não encontrada",
        variant: "destructive",
      });
      return;
    }

    if (!categoria.ativo) {
      toast({
        title: "Erro",
        description: "Não é possível vincular a uma categoria inativa",
        variant: "destructive",
      });
      return;
    }

    // Verificar nome duplicado na mesma categoria
    const nomeExiste = planosContas.find(
      pc => pc.nome.toLowerCase() === formData.nome.trim().toLowerCase() 
        && pc.categoriaId === formData.categoriaId
        && pc.id !== editingPlanoConta?.id
    );

    if (nomeExiste) {
      toast({
        title: "Erro",
        description: "Já existe um plano com este nome nesta categoria",
        variant: "destructive",
      });
      return;
    }

    if (formData.descricao && formData.descricao.length > 200) {
      toast({
        title: "Erro",
        description: "Descrição deve ter no máximo 200 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Atualizar tipo com base na categoria
    formData.tipo = categoria.tipo;

    if (editingPlanoConta) {
      const updated = planosContas.map(pc =>
        pc.id === editingPlanoConta.id
          ? { 
              ...pc, 
              nome: formData.nome.trim(),
              descricao: formData.descricao?.trim() || '',
              categoriaId: formData.categoriaId,
              tipo: formData.tipo,
              ativo: formData.ativo,
              updatedAt: new Date().toISOString() 
            }
          : pc
      );
      
      // Ordenar por categoria e nome
      updated.sort((a, b) => {
        if (a.categoriaId !== b.categoriaId) {
          return a.categoriaId.localeCompare(b.categoriaId);
        }
        return a.nome.localeCompare(b.nome);
      });
      
      setPlanosContas(updated);
      toast({
        title: "Sucesso",
        description: "✓ Plano de conta atualizado com sucesso!",
      });
    } else {
      const newPlanoConta: PlanoConta = {
        id: `pc-${Date.now()}`,
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || '',
        categoriaId: formData.categoriaId,
        tipo: formData.tipo,
        ativo: formData.ativo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updated = [...planosContas, newPlanoConta];
      
      // Ordenar por categoria e nome
      updated.sort((a, b) => {
        if (a.categoriaId !== b.categoriaId) {
          return a.categoriaId.localeCompare(b.categoriaId);
        }
        return a.nome.localeCompare(b.nome);
      });
      
      setPlanosContas(updated);
      toast({
        title: "Sucesso",
        description: "✓ Plano de conta criado com sucesso!",
      });
    }

    handleCloseDialog();
  };

  const handleDelete = (planoConta: PlanoConta) => {
    // TODO: Verificar se tem lançamentos vinculados quando módulo financeiro existir
    // const lancamentos = getLancamentos();
    // const temLancamentos = lancamentos.some(l => l.planoContaId === planoConta.id);
    
    // Por enquanto, permite excluir diretamente
    setDeletingPlanoConta(planoConta);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingPlanoConta) {
      const updated = planosContas.filter(pc => pc.id !== deletingPlanoConta.id);
      setPlanosContas(updated);
      toast({
        title: "Sucesso",
        description: "✓ Plano de contas excluído com sucesso!",
      });
      setIsDeleteDialogOpen(false);
      setDeletingPlanoConta(null);
    }
  };

  const handleDeactivate = () => {
    if (deletingPlanoConta) {
      const updated = planosContas.map(pc =>
        pc.id === deletingPlanoConta.id
          ? { ...pc, ativo: false, updatedAt: new Date().toISOString() }
          : pc
      );
      setPlanosContas(updated);
      toast({
        title: "Sucesso",
        description: "✓ Plano de contas desativado com sucesso!",
      });
      setIsDeactivateDialogOpen(false);
      setDeletingPlanoConta(null);
    }
  };

  const getCategoriaNome = (categoriaId: string): string => {
    const categorias = JSON.parse(localStorage.getItem('sugarbox_categorias_financeiras') || '[]');
    const categoria = categorias.find((c: any) => c.id === categoriaId);
    return categoria ? categoria.nome : 'Categoria não encontrada';
  };

  // Filtrar planos de contas
  const filteredPlanos = planosContas.filter(pc => {
    const matchSearch = pc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (pc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchTipo = filterTipo === 'todos' || pc.tipo === filterTipo;
    const matchCategoria = filterCategoria === 'todas' || pc.categoriaId === filterCategoria;
    
    return matchSearch && matchTipo && matchCategoria;
  });

  // Agrupar planos por categoria
  const groupedByCategoria = categorias.map(categoria => ({
    categoria,
    contas: filteredPlanos.filter(pc => pc.categoriaId === categoria.id)
  })).filter(group => group.contas.length > 0);

  // Estatísticas
  const totalReceitas = planosContas.filter(pc => pc.tipo === 'receita').length;
  const totalDespesas = planosContas.filter(pc => pc.tipo === 'despesa').length;
  const total = planosContas.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton to="/configuracoes" label="Voltar para Configurações" />
        <ExportImport 
          storageKey="sugarbox_planos_contas"
          dataLabel="Planos de Contas"
        />
      </div>
      
      <PageHeader
        title="Planos de Contas"
        description="Detalhamento das categorias financeiras"
        actions={
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Plano de Conta
          </Button>
        }
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Receitas</p>
            <p className="text-3xl font-bold text-success">{totalReceitas} contas</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Despesas</p>
            <p className="text-3xl font-bold text-destructive">{totalDespesas} contas</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold text-foreground">{total} contas</p>
          </div>
        </Card>
      </div>

      {/* Barra de Ferramentas */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plano de contas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as any)}
            className="px-4 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="todos">Tipo: Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>
      </div>

      {/* Estado vazio quando não há planos */}
      {groupedByCategoria.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          {searchTerm ? (
            <>
              <SearchIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum plano encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Nenhum resultado para "{searchTerm}"
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Limpar Busca
              </Button>
            </>
          ) : (
            <>
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum plano de contas ainda
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Comece adicionando seu primeiro plano de contas
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Plano
              </Button>
            </>
          )}
        </div>
      )}

      {/* Lista Agrupada por Categoria */}
      <div className="space-y-3">
        {groupedByCategoria.map(({ categoria, contas }) => {
          const isExpanded = expandedCategories[categoria.id] ?? true;
          const bgColor = categoria.cor;
          
          return (
            <Collapsible
              key={categoria.id}
              open={isExpanded}
              onOpenChange={() => toggleCategory(categoria.id)}
            >
              <Card className="overflow-hidden">
                {/* Header do Grupo */}
                <CollapsibleTrigger className="w-full">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200"
                    style={{
                      background: `linear-gradient(to right, ${bgColor}15 10%, white)`,
                      borderLeft: `4px solid ${bgColor}`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" style={{ color: bgColor }} />
                      ) : (
                        <ChevronRight className="h-4 w-4" style={{ color: bgColor }} />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground">
                          {categoria.nome}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({contas.length} {contas.length === 1 ? 'conta' : 'contas'})
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(undefined, categoria.id);
                      }}
                      style={{ borderColor: bgColor, color: bgColor }}
                      className="hover:bg-opacity-10"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CollapsibleTrigger>

                {/* Lista de Contas */}
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 bg-white">
                    {contas.map((conta) => (
                      <div
                        key={conta.id}
                        className="p-3 ml-6 mr-2 border border-border rounded-lg hover:shadow-sm transition-all duration-200"
                        style={{
                          borderColor: isExpanded ? bgColor + '20' : undefined
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base text-foreground">
                              {conta.nome}
                            </h4>
                            <p className="text-sm text-muted-foreground italic">
                              {conta.descricao || 'Sem descrição'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(conta)}
                              className="hover:bg-[#F5E6E0]"
                              title="Editar plano de contas"
                            >
                              <Pencil className="h-4 w-4" style={{ color: '#D89B8C' }} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(conta)}
                              className="hover:bg-red-50"
                              title="Excluir plano de contas"
                            >
                              <Trash2 className="h-4 w-4" style={{ color: '#D88B8B' }} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {groupedByCategoria.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma conta encontrada com os filtros aplicados</p>
        </div>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlanoConta ? 'Editar Plano de Conta' : 'Novo Plano de Conta'}
            </DialogTitle>
            <DialogDescription>
              {editingPlanoConta
                ? 'Altere os dados do plano de conta'
                : 'Preencha os dados para criar um novo plano de conta'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoriaId}
                onValueChange={(value) => {
                  const categoria = categorias.find(c => c.id === value);
                  if (categoria) {
                    setFormData({ 
                      ...formData, 
                      categoriaId: value,
                      tipo: categoria.tipo
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-background z-50">
                  {/* Receitas */}
                  <SelectGroup>
                    <SelectLabel className="text-success font-semibold">🟢 Receitas</SelectLabel>
                    {categorias
                      .filter(c => c.tipo === 'receita' && c.ativo)
                      .map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))
                    }
                  </SelectGroup>
                  
                  {/* Despesas */}
                  <SelectGroup>
                    <SelectLabel className="text-destructive font-semibold">🔴 Despesas</SelectLabel>
                    {categorias
                      .filter(c => c.tipo === 'despesa' && c.ativo)
                      .map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo (readonly) */}
            {formData.categoriaId && (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div>
                  <Badge 
                    variant={formData.tipo === 'receita' ? 'default' : 'destructive'}
                    className={formData.tipo === 'receita' ? 'bg-success hover:bg-success' : ''}
                  >
                    {formData.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preenchido automaticamente pela categoria
                  </p>
                </div>
              </div>
            )}

            {/* Nome do Plano de Contas */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Plano de Contas *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Água, Luz, Internet, Receitas com Produtos"
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                Máximo 100 caracteres
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Conta de água da Sabesp, Receitas de encomendas especiais"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Máximo 200 caracteres
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <TooltipProvider>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, ativo: checked as boolean })
                    }
                  />
                  <Label 
                    htmlFor="ativo" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Plano ativo
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Planos inativos não aparecem em novos lançamentos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPlanoConta ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano de contas "{deletingPlanoConta?.nome}"?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Desativação (para quando houver lançamentos) */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <AlertDialogTitle>Plano de Contas em Uso</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                Este plano possui lançamentos financeiros vinculados. Você pode:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Desativar o plano (recomendado)</li>
                <li>Reclassificar os lançamentos para outro plano e depois excluir</li>
              </ol>
              <p className="font-medium">
                Deseja desativar este plano de contas?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

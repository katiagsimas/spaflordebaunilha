import { useState, useEffect } from "react";
import { Plus, Pencil, FolderTree } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
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
import { SelectCategoria } from "@/components/SelectCategoria";

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
    id: 'pc-desp-050',
    nome: 'IRPJ',
    descricao: 'Imposto de renda pessoa jurídica',
    categoriaId: 'cat-desp-009',
    tipo: 'despesa',
    ativo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
];

const STORAGE_KEY = 'sugarbox_planos_contas';

export default function PlanosContas() {
  const [planosContas, setPlanosContas] = useLocalStorage<PlanoConta[]>(STORAGE_KEY, []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlanoConta, setEditingPlanoConta] = useState<PlanoConta | null>(null);
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
    }
  }, []);

  const handleOpenDialog = (planoConta?: PlanoConta) => {
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
        categoriaId: '',
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

    if (!formData.categoriaId) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria",
        variant: "destructive",
      });
      return;
    }

    // Buscar categoria das categorias financeiras
    const categorias = JSON.parse(localStorage.getItem('sugarbox_categorias_financeiras') || '[]');
    const categoria = categorias.find((c: any) => c.id === formData.categoriaId);
    if (categoria) {
      formData.tipo = categoria.tipo as 'receita' | 'despesa';
    }

    if (editingPlanoConta) {
      const updated = planosContas.map(pc =>
        pc.id === editingPlanoConta.id
          ? { 
              ...pc, 
              ...formData,
              updatedAt: new Date().toISOString() 
            }
          : pc
      );
      setPlanosContas(updated);
      toast({
        title: "Sucesso",
        description: "Plano de conta atualizado com sucesso",
      });
    } else {
      const newPlanoConta: PlanoConta = {
        id: `pc-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlanosContas([...planosContas, newPlanoConta]);
      toast({
        title: "Sucesso",
        description: "Plano de conta criado com sucesso",
      });
    }

    handleCloseDialog();
  };

  const getCategoriaNome = (categoriaId: string): string => {
    const categorias = JSON.parse(localStorage.getItem('sugarbox_categorias_financeiras') || '[]');
    const categoria = categorias.find((c: any) => c.id === categoriaId);
    return categoria ? categoria.nome : 'Categoria não encontrada';
  };

  // Agrupar por tipo
  const planosReceitas = planosContas.filter(pc => pc.tipo === 'receita');
  const planosDespesas = planosContas.filter(pc => pc.tipo === 'despesa');

  return (
    <div className="space-y-6">
      <BackButton to="/configuracoes" label="Voltar para Configurações" />
      
      <PageHeader
        title="Planos de Contas"
        description="Gerencie as subcategorias das suas contas financeiras"
        actions={
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Receitas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-success" />
            <h2 className="text-xl font-semibold text-foreground">Receitas</h2>
            <Badge variant="secondary" className="bg-success/10 text-success">
              {planosReceitas.length}
            </Badge>
          </div>

          {planosReceitas.length > 0 ? (
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planosReceitas.map((planoConta) => (
                    <TableRow key={planoConta.id}>
                      <TableCell className="font-medium">{planoConta.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {planoConta.descricao || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getCategoriaNome(planoConta.categoriaId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={planoConta.ativo ? "default" : "secondary"}>
                          {planoConta.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(planoConta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta de receita cadastrada
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground">Despesas</h2>
            <Badge variant="secondary" className="bg-destructive/10 text-destructive">
              {planosDespesas.length}
            </Badge>
          </div>

          {planosDespesas.length > 0 ? (
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planosDespesas.map((planoConta) => (
                    <TableRow key={planoConta.id}>
                      <TableCell className="font-medium">{planoConta.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {planoConta.descricao || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getCategoriaNome(planoConta.categoriaId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={planoConta.ativo ? "default" : "secondary"}>
                          {planoConta.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(planoConta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta de despesa cadastrada
            </div>
          )}
        </div>
      </div>

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Água, Luz, Receitas com Produtos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição adicional (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <SelectCategoria
                value={formData.categoriaId}
                onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                label="Categoria *"
                placeholder="Selecione a categoria"
                required
              />
            </div>

            <DialogFooter>
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
    </div>
  );
}

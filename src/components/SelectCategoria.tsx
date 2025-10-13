import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCategoriasParaLancamento, formatarCategoriaCompleta } from "@/utils/categoriasPlanoContas";
import { getCategoriasPorTipo } from "@/pages/financeiro/CategoriasFinanceiras";

/**
 * Componente de seleção de categoria financeira (versão simplificada)
 * Para uso em lançamentos que usam categorias financeiras diretas, sem planos de contas
 */
export function SelectCategoriaSimples({
  tipo,
  value,
  onChange,
  label,
  placeholder = 'Selecione uma categoria...',
  required = false,
  disabled = false,
}: {
  tipo: 'receita' | 'despesa';
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const categorias = getCategoriasPorTipo(tipo);

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled || categorias.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {categorias.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhuma categoria {tipo === 'receita' ? 'de receita' : 'de despesa'} disponível
            </div>
          ) : (
            categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

interface SelectCategoriaProps {
  tipo?: 'receita' | 'despesa';
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * Componente de seleção de categoria de planos de contas (versão completa)
 * Para uso em lançamentos que usam a estrutura hierárquica de planos de contas
 * 
 * @param tipo - Tipo de categoria (receita ou despesa) - filtra automaticamente
 * @param value - ID da categoria selecionada
 * @param onValueChange - Callback quando categoria é alterada
 * @param label - Label do campo (opcional)
 * @param placeholder - Placeholder do select (padrão: "Selecione uma categoria...")
 * @param required - Se o campo é obrigatório
 * @param className - Classes CSS adicionais
 */
export function SelectCategoria({
  tipo,
  value,
  onValueChange,
  label = "Categoria",
  placeholder = "Selecione uma categoria...",
  required = false,
  className = ""
}: SelectCategoriaProps) {
  const categorias = getCategoriasParaLancamento(tipo);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="categoria">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="categoria" className="h-11">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-card max-h-[300px]">
          {categorias.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhuma categoria disponível.
              <br />
              Cadastre categorias em Configurações → Categorias de Planos de Contas.
            </div>
          ) : (
            categorias.map(categoria => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {formatarCategoriaCompleta(categoria)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {tipo && (
        <p className="text-xs text-muted-foreground">
          Mostrando apenas categorias de {tipo === 'receita' ? 'receita' : 'despesa'}
        </p>
      )}
    </div>
  );
}

export default SelectCategoria;

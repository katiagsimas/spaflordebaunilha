-- ============================================
-- MÓDULO DE ESTOQUE INTEGRADO - DONNA'S BOX
-- ============================================

-- 1. TABELA ITENS (Catálogo Mestre)
-- ============================================
create table if not exists public.itens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  
  -- Identificação
  tipo text not null check (tipo in ('ingrediente', 'embalagem')),
  categoria text,
  nome text not null,
  descricao text,
  
  -- Unidades e conversões
  unidade_base text not null,
  quantidade_por_embalagem numeric not null default 1,
  conversoes jsonb default '{}'::jsonb,
  
  -- Controle de estoque
  rastrear_estoque boolean not null default false,
  ponto_de_pedido numeric,
  localizacao text,
  
  -- Metadados
  fornecedor_padrao text,
  imagem_url text,
  ativo boolean not null default true,
  observacoes text,
  
  -- Timestamps
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_itens_usuario_id on public.itens(usuario_id);
create index if not exists idx_itens_tipo on public.itens(tipo);
create index if not exists idx_itens_categoria on public.itens(categoria);
create index if not exists idx_itens_rastrear_estoque on public.itens(rastrear_estoque);
create index if not exists idx_itens_ativo on public.itens(ativo);

-- RLS (Row Level Security)
alter table public.itens enable row level security;

create policy "Usuários podem ver seus próprios itens"
  on public.itens for select
  using (auth.uid() = usuario_id);

create policy "Usuários podem inserir seus próprios itens"
  on public.itens for insert
  with check (auth.uid() = usuario_id);

create policy "Usuários podem atualizar seus próprios itens"
  on public.itens for update
  using (auth.uid() = usuario_id);

create policy "Usuários podem deletar seus próprios itens"
  on public.itens for delete
  using (auth.uid() = usuario_id);

-- 2. TABELA PRECOS (Histórico de Preços)
-- ============================================
create table if not exists public.precos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  
  -- Informações do preço
  marca text not null,
  fornecedor text,
  
  -- Valores
  preco_total_embalagem numeric not null check (preco_total_embalagem > 0),
  quantidade_embalagem numeric not null check (quantidade_embalagem > 0),
  custo_unitario numeric generated always as 
    (preco_total_embalagem / quantidade_embalagem) stored,
  
  -- Status
  ativo boolean not null default true,
  data_coleta timestamptz not null default now(),
  
  -- Extras
  link_compra text,
  observacao text,
  
  -- Timestamps
  criado_em timestamptz not null default now()
);

-- Índices
create index if not exists idx_precos_usuario_id on public.precos(usuario_id);
create index if not exists idx_precos_item_id on public.precos(item_id);
create index if not exists idx_precos_ativo on public.precos(ativo);
create index if not exists idx_precos_data_coleta on public.precos(data_coleta desc);

-- RLS
alter table public.precos enable row level security;

create policy "Usuários podem ver seus próprios preços"
  on public.precos for select
  using (auth.uid() = usuario_id);

create policy "Usuários podem inserir seus próprios preços"
  on public.precos for insert
  with check (auth.uid() = usuario_id);

create policy "Usuários podem atualizar seus próprios preços"
  on public.precos for update
  using (auth.uid() = usuario_id);

create policy "Usuários podem deletar seus próprios preços"
  on public.precos for delete
  using (auth.uid() = usuario_id);

-- Trigger para garantir apenas um preço ativo por item
create or replace function public.garantir_um_preco_ativo()
returns trigger as $$
begin
  if new.ativo = true then
    update public.precos 
    set ativo = false 
    where item_id = new.item_id 
      and usuario_id = new.usuario_id
      and id != new.id 
      and ativo = true;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trigger_garantir_um_preco_ativo
  before insert or update on public.precos
  for each row execute procedure public.garantir_um_preco_ativo();

-- 3. TABELA MOVIMENTOS_ESTOQUE (Movimentações)
-- ============================================
create table if not exists public.movimentos_estoque_v2 (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  
  -- Tipo de movimento
  tipo text not null check (tipo in ('entrada', 'saida', 'perda', 'ajuste')),
  subtipo text,
  
  -- Quantidade e valores
  quantidade numeric not null check (quantidade != 0),
  custo_unitario numeric,
  valor_total numeric,
  
  -- Rastreabilidade
  data timestamptz not null default now(),
  referencia_id uuid,
  referencia_tipo text,
  
  -- Informações adicionais
  responsavel text,
  observacao text,
  
  -- Timestamps
  criado_em timestamptz not null default now()
);

-- Índices
create index if not exists idx_movimentos_v2_usuario_id on public.movimentos_estoque_v2(usuario_id);
create index if not exists idx_movimentos_v2_item_id on public.movimentos_estoque_v2(item_id);
create index if not exists idx_movimentos_v2_tipo on public.movimentos_estoque_v2(tipo);
create index if not exists idx_movimentos_v2_data on public.movimentos_estoque_v2(data desc);
create index if not exists idx_movimentos_v2_referencia on public.movimentos_estoque_v2(referencia_id, referencia_tipo);

-- RLS
alter table public.movimentos_estoque_v2 enable row level security;

create policy "Usuários podem ver seus próprios movimentos"
  on public.movimentos_estoque_v2 for select
  using (auth.uid() = usuario_id);

create policy "Usuários podem inserir seus próprios movimentos"
  on public.movimentos_estoque_v2 for insert
  with check (auth.uid() = usuario_id);

create policy "Usuários podem atualizar seus próprios movimentos"
  on public.movimentos_estoque_v2 for update
  using (auth.uid() = usuario_id);

create policy "Usuários podem deletar seus próprios movimentos"
  on public.movimentos_estoque_v2 for delete
  using (auth.uid() = usuario_id);

-- Trigger para calcular valor_total automaticamente
create or replace function public.calcular_valor_total_movimento()
returns trigger as $$
begin
  if new.custo_unitario is not null then
    new.valor_total = abs(new.quantidade) * new.custo_unitario;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trigger_calcular_valor_total
  before insert or update on public.movimentos_estoque_v2
  for each row execute procedure public.calcular_valor_total_movimento();

-- 4. VIEW ESTOQUE_ATUAL_V2 (Saldo e Custo Médio)
-- ============================================
create or replace view public.estoque_atual_v2 as
select 
  i.id as item_id,
  i.usuario_id,
  i.nome,
  i.tipo,
  i.categoria,
  i.unidade_base,
  i.ponto_de_pedido,
  
  -- Saldo atual (entradas - saídas)
  coalesce(sum(
    case 
      when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 then m.quantidade
      when m.tipo in ('saida', 'perda', 'ajuste') and m.quantidade < 0 then m.quantidade
      when m.tipo = 'saida' then -m.quantidade
      when m.tipo = 'perda' then -m.quantidade
      else 0
    end
  ), 0) as saldo,
  
  -- Custo médio ponderado
  case 
    when sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 then m.quantidade
        else 0
      end
    ) > 0
    then sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 and m.custo_unitario is not null
        then m.quantidade * m.custo_unitario
        else 0
      end
    ) / sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 then m.quantidade
        else 0
      end
    )
    else 0
  end as custo_medio,
  
  -- Valor total do estoque
  case 
    when sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 then m.quantidade
        else 0
      end
    ) > 0
    then (coalesce(sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 then m.quantidade
        when m.tipo in ('saida', 'perda') then -m.quantidade
        else 0
      end
    ), 0)) * (sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 and m.custo_unitario is not null
        then m.quantidade * m.custo_unitario
        else 0
      end
    ) / sum(
      case 
        when m.tipo in ('entrada', 'ajuste') and m.quantidade > 0 then m.quantidade
        else 0
      end
    ))
    else 0
  end as valor_estoque,
  
  -- Data da última movimentação
  max(m.data) as ultima_movimentacao

from public.itens i
left join public.movimentos_estoque_v2 m on i.id = m.item_id and i.usuario_id = m.usuario_id
where i.rastrear_estoque = true and i.ativo = true
group by i.id, i.usuario_id, i.nome, i.tipo, i.categoria, i.unidade_base, i.ponto_de_pedido;

-- 5. FUNCTION PARA STATUS DO ESTOQUE
-- ============================================
create or replace function public.get_status_estoque(
  p_saldo numeric,
  p_ponto_pedido numeric
)
returns text as $$
begin
  if p_saldo is null or p_ponto_pedido is null then
    return 'sem_rastreio';
  elsif p_saldo <= 0 then
    return 'zerado';
  elsif p_saldo <= p_ponto_pedido then
    return 'baixo';
  elsif p_saldo <= (p_ponto_pedido * 1.2) then
    return 'atencao';
  else
    return 'ok';
  end if;
end;
$$ language plpgsql immutable security definer set search_path = public;

-- 6. TRIGGER PARA ATUALIZAR updated_at
-- ============================================
create trigger update_itens_updated_at 
  before update on public.itens
  for each row 
  execute procedure public.update_updated_at_column();
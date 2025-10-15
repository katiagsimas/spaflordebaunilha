export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bancos: {
        Row: {
          created_at: string
          id: string
          nome: string
          saldo_inicial: number
          tipo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          saldo_inicial?: number
          tipo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      categorias_estoque: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          data_aniversario: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          observacoes: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_aniversario?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_aniversario?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          banco_id: string | null
          categoria_id: string | null
          cliente_documento: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          data_emissao: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          id: string
          numero_documento: string | null
          observacoes: string | null
          plano_conta_id: string | null
          status: string
          tipo_documento_id: string | null
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          banco_id?: string | null
          categoria_id?: string | null
          cliente_documento?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_emissao?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          plano_conta_id?: string | null
          status?: string
          tipo_documento_id?: string | null
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          banco_id?: string | null
          categoria_id?: string | null
          cliente_documento?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_emissao?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          plano_conta_id?: string | null
          status?: string
          tipo_documento_id?: string | null
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_fixos: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
      embalagens: {
        Row: {
          created_at: string
          data_atualizacao: string
          id: string
          marca: string | null
          nome: string
          preco: number
          quantidade: number
          unidade_medida: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string
          id?: string
          marca?: string | null
          nome: string
          preco: number
          quantidade: number
          unidade_medida: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string
          id?: string
          marca?: string | null
          nome?: string
          preco?: number
          quantidade?: number
          unidade_medida?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      encomenda_itens: {
        Row: {
          created_at: string
          encomenda_id: string
          id: string
          produto: string
          quantidade: number
          receita_id: string
          subtotal: number
          unidade_medida: string
          updated_at: string
          usuario_id: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          encomenda_id: string
          id?: string
          produto: string
          quantidade: number
          receita_id: string
          subtotal: number
          unidade_medida: string
          updated_at?: string
          usuario_id: string
          valor_unitario: number
        }
        Update: {
          created_at?: string
          encomenda_id?: string
          id?: string
          produto?: string
          quantidade?: number
          receita_id?: string
          subtotal?: number
          unidade_medida?: string
          updated_at?: string
          usuario_id?: string
          valor_unitario?: number
        }
        Relationships: []
      }
      encomendas: {
        Row: {
          cep: string | null
          cliente: string
          created_at: string
          data_entrega: string
          data_pedido: string
          desconto_percentual: number | null
          desconto_valor: number | null
          endereco: string | null
          hora_entrega: string | null
          id: string
          numero: string | null
          observacoes: string | null
          outros: number | null
          pagamentos: Json | null
          saldo_restante: number | null
          status: string
          taxa_entrega: number | null
          telefone: string | null
          topo_aniversariante: string | null
          topo_bolo: number | null
          topo_idade: string | null
          topo_imagens: Json | null
          topo_obs: string | null
          topo_tema: string | null
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          cep?: string | null
          cliente: string
          created_at?: string
          data_entrega: string
          data_pedido: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          endereco?: string | null
          hora_entrega?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          outros?: number | null
          pagamentos?: Json | null
          saldo_restante?: number | null
          status?: string
          taxa_entrega?: number | null
          telefone?: string | null
          topo_aniversariante?: string | null
          topo_bolo?: number | null
          topo_idade?: string | null
          topo_imagens?: Json | null
          topo_obs?: string | null
          topo_tema?: string | null
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          cep?: string | null
          cliente?: string
          created_at?: string
          data_entrega?: string
          data_pedido?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          endereco?: string | null
          hora_entrega?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          outros?: number | null
          pagamentos?: Json | null
          saldo_restante?: number | null
          status?: string
          taxa_entrega?: number | null
          telefone?: string | null
          topo_aniversariante?: string | null
          topo_bolo?: number | null
          topo_idade?: string | null
          topo_imagens?: Json | null
          topo_obs?: string | null
          topo_tema?: string | null
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
      entradas_detalhadas: {
        Row: {
          created_at: string
          custo_unitario: number
          data_entrada: string
          id: string
          item_id: string
          movimentacao_entrada_id: string | null
          quantidade_inicial: number
          quantidade_restante: number
          status: Database["public"]["Enums"]["status_entrada"]
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          usuario_id: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          custo_unitario: number
          data_entrada: string
          id?: string
          item_id: string
          movimentacao_entrada_id?: string | null
          quantidade_inicial: number
          quantidade_restante: number
          status?: Database["public"]["Enums"]["status_entrada"]
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          usuario_id: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          custo_unitario?: number
          data_entrada?: string
          id?: string
          item_id?: string
          movimentacao_entrada_id?: string | null
          quantidade_inicial?: number
          quantidade_restante?: number
          status?: Database["public"]["Enums"]["status_entrada"]
          tipo_item?: Database["public"]["Enums"]["tipo_item_estoque"]
          usuario_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entradas_detalhadas_movimentacao_entrada_id_fkey"
            columns: ["movimentacao_entrada_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_atual: {
        Row: {
          custo_medio: number
          id: string
          item_id: string
          quantidade_atual: number
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          ultima_atualizacao: string
          usuario_id: string
          valor_total: number
        }
        Insert: {
          custo_medio?: number
          id?: string
          item_id: string
          quantidade_atual?: number
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          ultima_atualizacao?: string
          usuario_id: string
          valor_total?: number
        }
        Update: {
          custo_medio?: number
          id?: string
          item_id?: string
          quantidade_atual?: number
          tipo_item?: Database["public"]["Enums"]["tipo_item_estoque"]
          ultima_atualizacao?: string
          usuario_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          contato: string | null
          cpf_cnpj: string | null
          created_at: string
          data_aniversario_contato: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string | null
          tipo_fornecedor: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_aniversario_contato?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_fornecedor?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_aniversario_contato?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_fornecedor?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      ingredientes: {
        Row: {
          created_at: string
          data_atualizacao: string
          id: string
          marca: string | null
          nome: string
          preco: number
          quantidade: number
          unidade_medida: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_atualizacao?: string
          id?: string
          marca?: string | null
          nome: string
          preco: number
          quantidade: number
          unidade_medida: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_atualizacao?: string
          id?: string
          marca?: string | null
          nome?: string
          preco?: number
          quantidade?: number
          unidade_medida?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          custo_total: number
          custo_unitario: number
          data: string
          id: string
          item_id: string
          local_compra: string | null
          motivo: string | null
          observacoes: string | null
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          unidade: string
          updated_at: string
          usuario_id: string
          validade: string | null
          vinculo_pedido_id: string | null
        }
        Insert: {
          created_at?: string
          custo_total: number
          custo_unitario: number
          data: string
          id?: string
          item_id: string
          local_compra?: string | null
          motivo?: string | null
          observacoes?: string | null
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          unidade: string
          updated_at?: string
          usuario_id: string
          validade?: string | null
          vinculo_pedido_id?: string | null
        }
        Update: {
          created_at?: string
          custo_total?: number
          custo_unitario?: number
          data?: string
          id?: string
          item_id?: string
          local_compra?: string | null
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          tipo_item?: Database["public"]["Enums"]["tipo_item_estoque"]
          unidade?: string
          updated_at?: string
          usuario_id?: string
          validade?: string | null
          vinculo_pedido_id?: string | null
        }
        Relationships: []
      }
      planos_contas: {
        Row: {
          aceita_lancamento: boolean | null
          ativo: boolean | null
          categoria: string | null
          codigo: string
          conta_pai_id: string | null
          created_at: string | null
          id: string
          natureza: string | null
          nivel: number
          nome: string
          tipo: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          aceita_lancamento?: boolean | null
          ativo?: boolean | null
          categoria?: string | null
          codigo: string
          conta_pai_id?: string | null
          created_at?: string | null
          id?: string
          natureza?: string | null
          nivel?: number
          nome: string
          tipo: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          aceita_lancamento?: boolean | null
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string
          conta_pai_id?: string | null
          created_at?: string | null
          id?: string
          natureza?: string | null
          nivel?: number
          nome?: string
          tipo?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_contas_conta_pai_id_fkey"
            columns: ["conta_pai_id"]
            isOneToOne: false
            referencedRelation: "planos_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          email: string
          endereco: string | null
          estado: string | null
          id: string
          instagram: string | null
          nome_completo: string | null
          nome_confeitaria: string | null
          primeiro_acesso: boolean | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          endereco?: string | null
          estado?: string | null
          id: string
          instagram?: string | null
          nome_completo?: string | null
          nome_confeitaria?: string | null
          primeiro_acesso?: boolean | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          instagram?: string | null
          nome_completo?: string | null
          nome_confeitaria?: string | null
          primeiro_acesso?: boolean | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      tipos_documento: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      tipos_embalagens: {
        Row: {
          codigo: number
          created_at: string
          descricao: string
          id: string
          quantidade_embalagem: number
          unidade_medida_id: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          codigo?: number
          created_at?: string
          descricao: string
          id?: string
          quantidade_embalagem: number
          unidade_medida_id?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          codigo?: number
          created_at?: string
          descricao?: string
          id?: string
          quantidade_embalagem?: number
          unidade_medida_id?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_embalagens_unidade_medida_id_fkey"
            columns: ["unidade_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_insumos: {
        Row: {
          codigo: number
          created_at: string
          descricao: string
          id: string
          quantidade_embalagem: number
          unidade_medida_id: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          codigo?: number
          created_at?: string
          descricao: string
          id?: string
          quantidade_embalagem: number
          unidade_medida_id?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          codigo?: number
          created_at?: string
          descricao?: string
          id?: string
          quantidade_embalagem?: number
          unidade_medida_id?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_insumos_unidade_medida_id_fkey"
            columns: ["unidade_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_medida: {
        Row: {
          created_at: string
          id: string
          nome: string
          sigla: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sigla: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sigla?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      status_entrada: "ATIVO" | "CONSUMIDO"
      tipo_item_estoque: "INSUMO" | "EMBALAGEM"
      tipo_movimentacao: "ENTRADA" | "SAIDA"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      status_entrada: ["ATIVO", "CONSUMIDO"],
      tipo_item_estoque: ["INSUMO", "EMBALAGEM"],
      tipo_movimentacao: ["ENTRADA", "SAIDA"],
    },
  },
} as const

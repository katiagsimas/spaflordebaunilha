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
      categorias_estoque: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          updated_at?: string
          usuario_id?: string | null
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
          valor_total: number
        }
        Insert: {
          custo_medio?: number
          id?: string
          item_id: string
          quantidade_atual?: number
          tipo_item: Database["public"]["Enums"]["tipo_item_estoque"]
          ultima_atualizacao?: string
          valor_total?: number
        }
        Update: {
          custo_medio?: number
          id?: string
          item_id?: string
          quantidade_atual?: number
          tipo_item?: Database["public"]["Enums"]["tipo_item_estoque"]
          ultima_atualizacao?: string
          valor_total?: number
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
          usuario_id: string | null
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
          usuario_id?: string | null
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
          usuario_id?: string | null
          validade?: string | null
          vinculo_pedido_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      status_entrada: ["ATIVO", "CONSUMIDO"],
      tipo_item_estoque: ["INSUMO", "EMBALAGEM"],
      tipo_movimentacao: ["ENTRADA", "SAIDA"],
    },
  },
} as const

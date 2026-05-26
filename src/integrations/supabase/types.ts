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
      admin_logs: {
        Row: {
          acao: string
          admin_email: string
          admin_id: string
          created_at: string | null
          detalhes: Json | null
          id: string
          usuario_afetado_email: string | null
          usuario_afetado_id: string | null
        }
        Insert: {
          acao: string
          admin_email: string
          admin_id: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          usuario_afetado_email?: string | null
          usuario_afetado_id?: string | null
        }
        Update: {
          acao?: string
          admin_email?: string
          admin_id?: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          usuario_afetado_email?: string | null
          usuario_afetado_id?: string | null
        }
        Relationships: []
      }
      ai_usage_quotas: {
        Row: {
          created_at: string
          id: string
          periodo: string
          requests_count: number
          tokens_in: number
          tokens_out: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          periodo: string
          requests_count?: number
          tokens_in?: number
          tokens_out?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          periodo?: string
          requests_count?: number
          tokens_in?: number
          tokens_out?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_agendamentos: {
        Row: {
          ativo: boolean
          created_at: string
          frequencia: string
          horario: string
          id: string
          proximo_execucao_em: string | null
          ultimo_executado_em: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          frequencia?: string
          horario?: string
          id?: string
          proximo_execucao_em?: string | null
          ultimo_executado_em?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          frequencia?: string
          horario?: string
          id?: string
          proximo_execucao_em?: string | null
          ultimo_executado_em?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          dados: Json | null
          id: string
          nome: string
          owner_group_id: string | null
          storage_path: string | null
          tamanho: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          dados?: Json | null
          id?: string
          nome: string
          owner_group_id?: string | null
          storage_path?: string | null
          tamanho?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          dados?: Json | null
          id?: string
          nome?: string
          owner_group_id?: string | null
          storage_path?: string | null
          tamanho?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backups_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos: {
        Row: {
          codigo: string
          created_at: string
          e_banco_oficial: boolean | null
          e_customizado: boolean | null
          habilitado: boolean | null
          id: string
          nome: string
          owner_group_id: string | null
          saldo_inicial: number
          tipo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          e_banco_oficial?: boolean | null
          e_customizado?: boolean | null
          habilitado?: boolean | null
          id?: string
          nome: string
          owner_group_id?: string | null
          saldo_inicial?: number
          tipo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          e_banco_oficial?: boolean | null
          e_customizado?: boolean | null
          habilitado?: boolean | null
          id?: string
          nome?: string
          owner_group_id?: string | null
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bancos_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          owner_group_id: string | null
          padrao_sistema: boolean | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          owner_group_id?: string | null
          padrao_sistema?: boolean | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          owner_group_id?: string | null
          padrao_sistema?: boolean | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_plano_contas: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          descricao: string
          e_padrao: boolean | null
          faixa_dre: string
          id: string
          indicador: string
          ordem: number
          owner_group_id: string | null
          padrao_sistema: boolean
          subfaixa_dre: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          descricao: string
          e_padrao?: boolean | null
          faixa_dre: string
          id?: string
          indicador: string
          ordem?: number
          owner_group_id?: string | null
          padrao_sistema?: boolean
          subfaixa_dre?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          e_padrao?: boolean | null
          faixa_dre?: string
          id?: string
          indicador?: string
          ordem?: number
          owner_group_id?: string | null
          padrao_sistema?: boolean
          subfaixa_dre?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_plano_contas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_familiares: {
        Row: {
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          data_nascimento: string
          id: string
          nome: string
          observacoes: string | null
          parentesco: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          data_nascimento: string
          id?: string
          nome: string
          observacoes?: string | null
          parentesco: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          data_nascimento?: string
          id?: string
          nome?: string
          observacoes?: string | null
          parentesco?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_familiares_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
          owner_group_id: string | null
          quantidade_pedidos: number | null
          telefone: string | null
          tipo: string | null
          total_compras: number | null
          ultima_compra: string | null
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
          owner_group_id?: string | null
          quantidade_pedidos?: number | null
          telefone?: string | null
          tipo?: string | null
          total_compras?: number | null
          ultima_compra?: string | null
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
          owner_group_id?: string | null
          quantidade_pedidos?: number | null
          telefone?: string | null
          tipo?: string | null
          total_compras?: number | null
          ultima_compra?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_juros: {
        Row: {
          aliquota_simples_nacional: number | null
          cobrar_juros: boolean | null
          created_at: string | null
          id: string
          multa_atraso: boolean | null
          observacao: string | null
          owner_group_id: string | null
          percentual_juros: number
          percentual_multa: number | null
          tipo_juros: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          aliquota_simples_nacional?: number | null
          cobrar_juros?: boolean | null
          created_at?: string | null
          id?: string
          multa_atraso?: boolean | null
          observacao?: string | null
          owner_group_id?: string | null
          percentual_juros?: number
          percentual_multa?: number | null
          tipo_juros?: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          aliquota_simples_nacional?: number | null
          cobrar_juros?: boolean | null
          created_at?: string | null
          id?: string
          multa_atraso?: boolean | null
          observacao?: string | null
          owner_group_id?: string | null
          percentual_juros?: number
          percentual_multa?: number | null
          tipo_juros?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_juros_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          banco_id: string | null
          categoria_id: string | null
          created_at: string
          data_emissao: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          dia_vencimento_recorrente: number | null
          e_recorrente: boolean | null
          fornecedor_id: string | null
          id: string
          numero_parcelas: number | null
          observacoes: string | null
          owner_group_id: string | null
          plano_contas_id: string | null
          status: string
          tipo_documento_id: string | null
          tipo_lancamento: string | null
          updated_at: string
          usuario_id: string
          valor: number | null
          valor_total: number | null
        }
        Insert: {
          banco_id?: string | null
          categoria_id?: string | null
          created_at?: string
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          dia_vencimento_recorrente?: number | null
          e_recorrente?: boolean | null
          fornecedor_id?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          owner_group_id?: string | null
          plano_contas_id?: string | null
          status?: string
          tipo_documento_id?: string | null
          tipo_lancamento?: string | null
          updated_at?: string
          usuario_id: string
          valor?: number | null
          valor_total?: number | null
        }
        Update: {
          banco_id?: string | null
          categoria_id?: string | null
          created_at?: string
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          dia_vencimento_recorrente?: number | null
          e_recorrente?: boolean | null
          fornecedor_id?: string | null
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          owner_group_id?: string | null
          plano_contas_id?: string | null
          status?: string
          tipo_documento_id?: string | null
          tipo_lancamento?: string | null
          updated_at?: string
          usuario_id?: string
          valor?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "vw_resumo_financeiro"
            referencedColumns: ["banco_id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_plano_contas_id_fkey"
            columns: ["plano_contas_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_tipo_documento_id_fkey"
            columns: ["tipo_documento_id"]
            isOneToOne: false
            referencedRelation: "tipos_documento"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar_comprovantes: {
        Row: {
          created_at: string | null
          id: string
          nome_arquivo: string
          pagamento_id: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          url_storage: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_arquivo: string
          pagamento_id: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          url_storage: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_arquivo?: string
          pagamento_id?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          url_storage?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_comprovantes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar_pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar_pagamentos: {
        Row: {
          banco_id: string
          created_at: string | null
          data_estorno: string | null
          data_pagamento: string
          desconto: number | null
          estornado: boolean | null
          id: string
          juros: number | null
          motivo_estorno: string | null
          observacao: string | null
          parcela_id: string
          tipo_documento_id: string
          updated_at: string | null
          valor_pago: number
        }
        Insert: {
          banco_id: string
          created_at?: string | null
          data_estorno?: string | null
          data_pagamento: string
          desconto?: number | null
          estornado?: boolean | null
          id?: string
          juros?: number | null
          motivo_estorno?: string | null
          observacao?: string | null
          parcela_id: string
          tipo_documento_id: string
          updated_at?: string | null
          valor_pago?: number
        }
        Update: {
          banco_id?: string
          created_at?: string | null
          data_estorno?: string | null
          data_pagamento?: string
          desconto?: number | null
          estornado?: boolean | null
          id?: string
          juros?: number | null
          motivo_estorno?: string | null
          observacao?: string | null
          parcela_id?: string
          tipo_documento_id?: string
          updated_at?: string | null
          valor_pago?: number
        }
        Relationships: []
      }
      contas_pagar_parcelas: {
        Row: {
          conta_pagar_id: string
          created_at: string | null
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          numero_parcela: number
          observacao: string | null
          status: string
          updated_at: string | null
          valor_pago: number | null
          valor_parcela: number
          valor_total: number
        }
        Insert: {
          conta_pagar_id: string
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          numero_parcela: number
          observacao?: string | null
          status?: string
          updated_at?: string | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_total?: number
        }
        Update: {
          conta_pagar_id?: string
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          numero_parcela?: number
          observacao?: string | null
          status?: string
          updated_at?: string | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_parcelas_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          banco_id: string
          categoria_id: string | null
          cliente_documento: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          data_emissao: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          dia_vencimento_recorrente: number | null
          e_recorrente: boolean | null
          id: string
          numero_documento: string | null
          numero_parcelas: number
          observacoes: string | null
          owner_group_id: string | null
          plano_conta_id: string | null
          status: string
          tipo_documento_id: string | null
          tipo_lancamento: string
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          banco_id: string
          categoria_id?: string | null
          cliente_documento?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_emissao?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          dia_vencimento_recorrente?: number | null
          e_recorrente?: boolean | null
          id?: string
          numero_documento?: string | null
          numero_parcelas?: number
          observacoes?: string | null
          owner_group_id?: string | null
          plano_conta_id?: string | null
          status?: string
          tipo_documento_id?: string | null
          tipo_lancamento?: string
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          banco_id?: string
          categoria_id?: string | null
          cliente_documento?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_emissao?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          dia_vencimento_recorrente?: number | null
          e_recorrente?: boolean | null
          id?: string
          numero_documento?: string | null
          numero_parcelas?: number
          observacoes?: string | null
          owner_group_id?: string | null
          plano_conta_id?: string | null
          status?: string
          tipo_documento_id?: string | null
          tipo_lancamento?: string
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_banco"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_banco"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "vw_resumo_financeiro"
            referencedColumns: ["banco_id"]
          },
          {
            foreignKeyName: "fk_contas_receber_plano_conta"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_tipo_documento"
            columns: ["tipo_documento_id"]
            isOneToOne: false
            referencedRelation: "tipos_documento"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber_comprovantes: {
        Row: {
          created_at: string | null
          id: string
          nome_arquivo: string
          pagamento_id: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          url_storage: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_arquivo: string
          pagamento_id: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          url_storage: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_arquivo?: string
          pagamento_id?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          url_storage?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_comprovantes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "contas_receber_pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber_pagamentos: {
        Row: {
          banco_id: string
          created_at: string
          data_estorno: string | null
          data_pagamento: string
          desconto: number | null
          estornado: boolean | null
          id: string
          juros: number | null
          motivo_estorno: string | null
          observacao: string | null
          parcela_id: string
          tipo_documento_id: string
          updated_at: string
          valor_pago: number
        }
        Insert: {
          banco_id: string
          created_at?: string
          data_estorno?: string | null
          data_pagamento: string
          desconto?: number | null
          estornado?: boolean | null
          id?: string
          juros?: number | null
          motivo_estorno?: string | null
          observacao?: string | null
          parcela_id: string
          tipo_documento_id: string
          updated_at?: string
          valor_pago: number
        }
        Update: {
          banco_id?: string
          created_at?: string
          data_estorno?: string | null
          data_pagamento?: string
          desconto?: number | null
          estornado?: boolean | null
          id?: string
          juros?: number | null
          motivo_estorno?: string | null
          observacao?: string | null
          parcela_id?: string
          tipo_documento_id?: string
          updated_at?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_pagamentos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_pagamentos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "vw_resumo_financeiro"
            referencedColumns: ["banco_id"]
          },
          {
            foreignKeyName: "contas_receber_pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "contas_receber_parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_pagamentos_tipo_documento_id_fkey"
            columns: ["tipo_documento_id"]
            isOneToOne: false
            referencedRelation: "tipos_documento"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber_parcelas: {
        Row: {
          conta_receber_id: string
          created_at: string | null
          data_emissao: string
          data_pagamento: string | null
          data_recebimento: string | null
          data_vencimento: string
          desconto: number | null
          id: string
          juros: number | null
          numero_parcela: number
          observacao: string | null
          observacao_interna: string | null
          status: string
          tags: string[] | null
          updated_at: string | null
          valor_pago: number | null
          valor_parcela: number
          valor_recebido: number | null
          valor_total: number
        }
        Insert: {
          conta_receber_id: string
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          desconto?: number | null
          id?: string
          juros?: number | null
          numero_parcela: number
          observacao?: string | null
          observacao_interna?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_parcela: number
          valor_recebido?: number | null
          valor_total?: number
        }
        Update: {
          conta_receber_id?: string
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          desconto?: number | null
          id?: string
          juros?: number | null
          numero_parcela?: number
          observacao?: string | null
          observacao_interna?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_recebido?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_parcelas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      conversa_doce_favoritos: {
        Row: {
          created_at: string
          id: string
          mensagem_original: string | null
          owner_group_id: string
          rotulo: string | null
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem_original?: string | null
          owner_group_id: string
          rotulo?: string | null
          texto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem_original?: string | null
          owner_group_id?: string
          rotulo?: string | null
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversa_doce_favoritos_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_fixos: {
        Row: {
          created_at: string
          id: string
          nome: string
          owner_group_id: string | null
          tipo: string
          updated_at: string
          usuario_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          owner_group_id?: string | null
          tipo?: string
          updated_at?: string
          usuario_id: string
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          owner_group_id?: string | null
          tipo?: string
          updated_at?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_fixos_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      embalagens: {
        Row: {
          created_at: string | null
          data_atualizacao: string
          id: string
          marca: string | null
          owner_group_id: string | null
          preco: number
          tipo_insumo_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          data_atualizacao?: string
          id?: string
          marca?: string | null
          owner_group_id?: string | null
          preco: number
          tipo_insumo_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          data_atualizacao?: string
          id?: string
          marca?: string | null
          owner_group_id?: string | null
          preco?: number
          tipo_insumo_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embalagens_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embalagens_tipo_insumo_id_fkey"
            columns: ["tipo_insumo_id"]
            isOneToOne: false
            referencedRelation: "tipos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      encomenda_itens: {
        Row: {
          created_at: string
          encomenda_id: string
          id: string
          owner_group_id: string | null
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
          owner_group_id?: string | null
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
          owner_group_id?: string | null
          produto?: string
          quantidade?: number
          receita_id?: string
          subtotal?: number
          unidade_medida?: string
          updated_at?: string
          usuario_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "encomenda_itens_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      encomendas: {
        Row: {
          cep: string | null
          cliente: string
          conta_receber_id: string | null
          created_at: string
          data_entrega: string | null
          data_pedido: string
          desconto_percentual: number | null
          desconto_valor: number | null
          endereco: string | null
          estoque_baixa_realizada: boolean
          hora_entrega: string | null
          id: string
          numero: string | null
          observacoes: string | null
          observacoes_cliente: string | null
          observacoes_internas: string | null
          outros: number | null
          owner_group_id: string | null
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
          conta_receber_id?: string | null
          created_at?: string
          data_entrega?: string | null
          data_pedido: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          endereco?: string | null
          estoque_baixa_realizada?: boolean
          hora_entrega?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          outros?: number | null
          owner_group_id?: string | null
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
          conta_receber_id?: string | null
          created_at?: string
          data_entrega?: string | null
          data_pedido?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          endereco?: string | null
          estoque_baixa_realizada?: boolean
          hora_entrega?: string | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          outros?: number | null
          owner_group_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "encomendas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomendas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      encomendas_tags: {
        Row: {
          created_at: string | null
          encomenda_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          encomenda_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          encomenda_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encomendas_tags_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encomendas_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags_encomendas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          created_at: string
          custo_medio: number
          embalagem_id: string | null
          estoque_minimo: number | null
          id: string
          ingrediente_id: string | null
          owner_group_id: string | null
          quantidade_atual: number
          tipo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          custo_medio?: number
          embalagem_id?: string | null
          estoque_minimo?: number | null
          id?: string
          ingrediente_id?: string | null
          owner_group_id?: string | null
          quantidade_atual?: number
          tipo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          custo_medio?: number
          embalagem_id?: string | null
          estoque_minimo?: number | null
          id?: string
          ingrediente_id?: string | null
          owner_group_id?: string | null
          quantidade_atual?: number
          tipo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_embalagem_id_fkey"
            columns: ["embalagem_id"]
            isOneToOne: false
            referencedRelation: "embalagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string
          custo_total: number | null
          custo_unitario: number | null
          estoque_id: string
          id: string
          observacao: string | null
          owner_group_id: string | null
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo_movimentacao: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          estoque_id: string
          id?: string
          observacao?: string | null
          owner_group_id?: string | null
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimentacao: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          custo_total?: number | null
          custo_unitario?: number | null
          estoque_id?: string
          id?: string
          observacao?: string | null
          owner_group_id?: string | null
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimentacao?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamento_checklist_itens: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          concluido_por: string | null
          created_at: string
          descricao: string | null
          fechamento_id: string
          id: string
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string
          descricao?: string | null
          fechamento_id: string
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string
          descricao?: string | null
          fechamento_id?: string
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechamento_checklist_itens_fechamento_id_fkey"
            columns: ["fechamento_id"]
            isOneToOne: false
            referencedRelation: "fechamentos_mensais"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamento_logs: {
        Row: {
          acao: string
          created_at: string
          fechamento_id: string
          id: string
          motivo: string | null
          owner_group_id: string
          snapshot: Json | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          fechamento_id: string
          id?: string
          motivo?: string | null
          owner_group_id: string
          snapshot?: Json | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          fechamento_id?: string
          id?: string
          motivo?: string | null
          owner_group_id?: string
          snapshot?: Json | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamento_logs_fechamento_id_fkey"
            columns: ["fechamento_id"]
            isOneToOne: false
            referencedRelation: "fechamentos_mensais"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_mensais: {
        Row: {
          created_at: string
          custos: number
          faturamento: number
          fechado_em: string | null
          fechado_por: string | null
          id: string
          margem_seguranca: number
          mes_referencia: string
          observacoes: string | null
          owner_group_id: string
          pro_labore_saudavel: number
          reaberto_em: string | null
          reaberto_por: string | null
          retiradas: number
          saldo_restante: number
          snapshot: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custos?: number
          faturamento?: number
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          margem_seguranca?: number
          mes_referencia: string
          observacoes?: string | null
          owner_group_id: string
          pro_labore_saudavel?: number
          reaberto_em?: string | null
          reaberto_por?: string | null
          retiradas?: number
          saldo_restante?: number
          snapshot?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custos?: number
          faturamento?: number
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          margem_seguranca?: number
          mes_referencia?: string
          observacoes?: string | null
          owner_group_id?: string
          pro_labore_saudavel?: number
          reaberto_em?: string | null
          reaberto_por?: string | null
          retiradas?: number
          saldo_restante?: number
          snapshot?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fornecedor_contatos: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string | null
          data_aniversario: string | null
          email: string | null
          fornecedor_id: string
          id: string
          nome: string
          observacoes: string | null
          owner_group_id: string | null
          telefone: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          data_aniversario?: string | null
          email?: string | null
          fornecedor_id: string
          id?: string
          nome: string
          observacoes?: string | null
          owner_group_id?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          data_aniversario?: string | null
          email?: string | null
          fornecedor_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          owner_group_id?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_fornecedor_contato"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedor_contatos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          owner_group_id: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          owner_group_id?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          owner_group_id?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      historico_planos: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          observacao: string | null
          origem: string
          plano_anterior: string | null
          plano_fim: string | null
          plano_inicio: string | null
          plano_novo: string | null
          plano_tipo_anterior: string | null
          plano_tipo_novo: string | null
          tipo_evento: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          origem?: string
          plano_anterior?: string | null
          plano_fim?: string | null
          plano_inicio?: string | null
          plano_novo?: string | null
          plano_tipo_anterior?: string | null
          plano_tipo_novo?: string | null
          tipo_evento?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          origem?: string
          plano_anterior?: string | null
          plano_fim?: string | null
          plano_inicio?: string | null
          plano_novo?: string | null
          plano_tipo_anterior?: string | null
          plano_tipo_novo?: string | null
          tipo_evento?: string
          user_id?: string
        }
        Relationships: []
      }
      hotmart_produtos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          offer_code: string | null
          plano_id: string
          plano_tipo: string
          product_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          offer_code?: string | null
          plano_id: string
          plano_tipo: string
          product_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          offer_code?: string | null
          plano_id?: string
          plano_tipo?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotmart_produtos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_atualizacao: string
          e_pre_preparo: boolean | null
          id: string
          marca: string | null
          owner_group_id: string | null
          preco: number
          tipo_insumo_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_atualizacao?: string
          e_pre_preparo?: boolean | null
          id?: string
          marca?: string | null
          owner_group_id?: string | null
          preco: number
          tipo_insumo_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_atualizacao?: string
          e_pre_preparo?: boolean | null
          id?: string
          marca?: string | null
          owner_group_id?: string | null
          preco?: number
          tipo_insumo_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredientes_tipo_insumo_id_fkey"
            columns: ["tipo_insumo_id"]
            isOneToOne: false
            referencedRelation: "tipos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      mao_obra_perfis: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: string
          nome: string
          owner_group_id: string | null
          padrao: boolean | null
          user_id: string
          valor_hora: number
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          nome: string
          owner_group_id?: string | null
          padrao?: boolean | null
          user_id: string
          valor_hora: number
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
          owner_group_id?: string | null
          padrao?: boolean | null
          user_id?: string
          valor_hora?: number
        }
        Relationships: [
          {
            foreignKeyName: "mao_obra_perfis_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      mao_obra_perfis_historico: {
        Row: {
          acao: string
          id: string
          perfil_id: string
          registrado_em: string | null
          user_id: string
          valor_antigo: number | null
          valor_novo: number | null
        }
        Insert: {
          acao: string
          id?: string
          perfil_id: string
          registrado_em?: string | null
          user_id: string
          valor_antigo?: number | null
          valor_novo?: number | null
        }
        Update: {
          acao?: string
          id?: string
          perfil_id?: string
          registrado_em?: string | null
          user_id?: string
          valor_antigo?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mao_obra_perfis_historico_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "mao_obra_perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      meu_salario_retiradas: {
        Row: {
          created_at: string
          data_retirada: string
          descricao: string | null
          id: string
          owner_group_id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_retirada: string
          descricao?: string | null
          id?: string
          owner_group_id: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data_retirada?: string
          descricao?: string | null
          id?: string
          owner_group_id?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "meu_salario_retiradas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacao_doce_state: {
        Row: {
          created_at: string
          data: Json
          id: string
          owner_group_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          owner_group_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          owner_group_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planejamento_datas_comemorativas: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          data_referencia: string
          icone: string | null
          id: string
          is_system: boolean
          nome: string
          owner_group_id: string | null
          recorrente: boolean
          tipo: Database["public"]["Enums"]["planejamento_data_tipo"]
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          data_referencia: string
          icone?: string | null
          id?: string
          is_system?: boolean
          nome: string
          owner_group_id?: string | null
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["planejamento_data_tipo"]
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          data_referencia?: string
          icone?: string | null
          id?: string
          is_system?: boolean
          nome?: string
          owner_group_id?: string | null
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["planejamento_data_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_datas_comemorativas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_descanso: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          observacao: string | null
          owner_group_id: string
          recorrencia_tipo: string | null
          recorrente: boolean
          tipo: Database["public"]["Enums"]["planejamento_descanso_tipo"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacao?: string | null
          owner_group_id: string
          recorrencia_tipo?: string | null
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["planejamento_descanso_tipo"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacao?: string | null
          owner_group_id?: string
          recorrencia_tipo?: string | null
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["planejamento_descanso_tipo"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_descanso_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_metas: {
        Row: {
          area: Database["public"]["Enums"]["planejamento_area"]
          created_at: string
          descricao: string | null
          id: string
          owner_group_id: string
          periodo_fim: string
          periodo_inicio: string
          status: Database["public"]["Enums"]["planejamento_status"]
          titulo: string
          unidade: string | null
          updated_at: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          area: Database["public"]["Enums"]["planejamento_area"]
          created_at?: string
          descricao?: string | null
          id?: string
          owner_group_id: string
          periodo_fim: string
          periodo_inicio: string
          status?: Database["public"]["Enums"]["planejamento_status"]
          titulo: string
          unidade?: string | null
          updated_at?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Update: {
          area?: Database["public"]["Enums"]["planejamento_area"]
          created_at?: string
          descricao?: string | null
          id?: string
          owner_group_id?: string
          periodo_fim?: string
          periodo_inicio?: string
          status?: Database["public"]["Enums"]["planejamento_status"]
          titulo?: string
          unidade?: string | null
          updated_at?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_metas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_tarefas: {
        Row: {
          area: Database["public"]["Enums"]["planejamento_area"]
          created_at: string
          data_conclusao: string | null
          descricao: string | null
          id: string
          owner_group_id: string
          prazo: string | null
          prioridade: Database["public"]["Enums"]["planejamento_prioridade"]
          status: Database["public"]["Enums"]["planejamento_status"]
          titulo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area: Database["public"]["Enums"]["planejamento_area"]
          created_at?: string
          data_conclusao?: string | null
          descricao?: string | null
          id?: string
          owner_group_id: string
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["planejamento_prioridade"]
          status?: Database["public"]["Enums"]["planejamento_status"]
          titulo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area?: Database["public"]["Enums"]["planejamento_area"]
          created_at?: string
          data_conclusao?: string | null
          descricao?: string | null
          id?: string
          owner_group_id?: string
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["planejamento_prioridade"]
          status?: Database["public"]["Enums"]["planejamento_status"]
          titulo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_tarefas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          ativo: boolean | null
          categoria_id: string
          codigo: number
          codigo_estruturado: string
          created_at: string | null
          descricao: string
          e_padrao: boolean | null
          id: string
          owner_group_id: string | null
          padrao_sistema: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria_id: string
          codigo: number
          codigo_estruturado: string
          created_at?: string | null
          descricao: string
          e_padrao?: boolean | null
          id?: string
          owner_group_id?: string | null
          padrao_sistema?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string
          codigo?: number
          codigo_estruturado?: string
          created_at?: string | null
          descricao?: string
          e_padrao?: boolean | null
          id?: string
          owner_group_id?: string | null
          padrao_sistema?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_contas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          em_breve: boolean | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          em_breve?: boolean | null
          id: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          em_breve?: boolean | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pre_preparos: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          custo_por_unidade: number | null
          custo_total: number | null
          id: string
          imagem_1_url: string | null
          imagem_2_url: string | null
          modo_preparo: string | null
          nome: string
          owner_group_id: string | null
          rendimento_quantidade: number
          rendimento_unidade_id: string
          tempo_preparo: number
          tempo_preparo_unidade: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          custo_por_unidade?: number | null
          custo_total?: number | null
          id?: string
          imagem_1_url?: string | null
          imagem_2_url?: string | null
          modo_preparo?: string | null
          nome: string
          owner_group_id?: string | null
          rendimento_quantidade: number
          rendimento_unidade_id: string
          tempo_preparo: number
          tempo_preparo_unidade: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          custo_por_unidade?: number | null
          custo_total?: number | null
          id?: string
          imagem_1_url?: string | null
          imagem_2_url?: string | null
          modo_preparo?: string | null
          nome?: string
          owner_group_id?: string | null
          rendimento_quantidade?: number
          rendimento_unidade_id?: string
          tempo_preparo?: number
          tempo_preparo_unidade?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_preparos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_preparos_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_preparos_rendimento_unidade_id_fkey"
            columns: ["rendimento_unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_preparos_ingredientes: {
        Row: {
          created_at: string | null
          custo_ingrediente: number
          id: string
          ingrediente_id: string
          ordem: number
          pre_preparo_id: string
          quantidade_utilizada: number
        }
        Insert: {
          created_at?: string | null
          custo_ingrediente?: number
          id?: string
          ingrediente_id: string
          ordem?: number
          pre_preparo_id: string
          quantidade_utilizada: number
        }
        Update: {
          created_at?: string | null
          custo_ingrediente?: number
          id?: string
          ingrediente_id?: string
          ordem?: number
          pre_preparo_id?: string
          quantidade_utilizada?: number
        }
        Relationships: [
          {
            foreignKeyName: "pre_preparos_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_preparos_ingredientes_pre_preparo_id_fkey"
            columns: ["pre_preparo_id"]
            isOneToOne: false
            referencedRelation: "pre_preparos"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_preparos_mao_obra: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          horas: number
          id: string
          perfil_id: string | null
          pre_preparo_id: string
          usar_valor_padrao: boolean
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          horas: number
          id?: string
          perfil_id?: string | null
          pre_preparo_id: string
          usar_valor_padrao?: boolean
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          horas?: number
          id?: string
          perfil_id?: string | null
          pre_preparo_id?: string
          usar_valor_padrao?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pre_preparos_mao_obra_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "mao_obra_perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_preparos_mao_obra_pre_preparo_id_fkey"
            columns: ["pre_preparo_id"]
            isOneToOne: false
            referencedRelation: "pre_preparos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alerta_cmv: number | null
          ativo: boolean | null
          avatar_url: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          custo_fixo_mensal: number | null
          dias_trabalho_mes: number | null
          email: string
          endereco: string | null
          estado: string | null
          horas_diaria_trabalho: number | null
          id: string
          inscricao_estadual: string | null
          instagram: string | null
          last_login: string | null
          logo_url: string | null
          meta_faturamento_anual: number | null
          meta_faturamento_mensal: number | null
          nome_completo: string | null
          nome_confeitaria: string | null
          numero: string | null
          origem_criacao: string | null
          owner_group_id: string | null
          planejamento_banner_dismissed: boolean | null
          plano_fim: string | null
          plano_id: string | null
          plano_inicio: string | null
          plano_tipo: string | null
          primeiro_acesso: boolean | null
          razao_social: string | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          alerta_cmv?: number | null
          ativo?: boolean | null
          avatar_url?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          custo_fixo_mensal?: number | null
          dias_trabalho_mes?: number | null
          email: string
          endereco?: string | null
          estado?: string | null
          horas_diaria_trabalho?: number | null
          id: string
          inscricao_estadual?: string | null
          instagram?: string | null
          last_login?: string | null
          logo_url?: string | null
          meta_faturamento_anual?: number | null
          meta_faturamento_mensal?: number | null
          nome_completo?: string | null
          nome_confeitaria?: string | null
          numero?: string | null
          origem_criacao?: string | null
          owner_group_id?: string | null
          planejamento_banner_dismissed?: boolean | null
          plano_fim?: string | null
          plano_id?: string | null
          plano_inicio?: string | null
          plano_tipo?: string | null
          primeiro_acesso?: boolean | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          alerta_cmv?: number | null
          ativo?: boolean | null
          avatar_url?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          custo_fixo_mensal?: number | null
          dias_trabalho_mes?: number | null
          email?: string
          endereco?: string | null
          estado?: string | null
          horas_diaria_trabalho?: number | null
          id?: string
          inscricao_estadual?: string | null
          instagram?: string | null
          last_login?: string | null
          logo_url?: string | null
          meta_faturamento_anual?: number | null
          meta_faturamento_mensal?: number | null
          nome_completo?: string | null
          nome_confeitaria?: string | null
          numero?: string | null
          origem_criacao?: string | null
          owner_group_id?: string | null
          planejamento_banner_dismissed?: boolean | null
          plano_fim?: string | null
          plano_id?: string | null
          plano_inicio?: string | null
          plano_tipo?: string | null
          primeiro_acesso?: boolean | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          cardapio: string | null
          categoria: string | null
          created_at: string
          custo_total: number
          id: string
          modo_preparo: string | null
          nome: string
          owner_group_id: string | null
          rendimento: number
          tempo_preparo: number
          tipo: string | null
          unidade_rendimento: string
          unidade_tempo: string
          updated_at: string
          usuario_id: string
          valor_venda: number | null
        }
        Insert: {
          cardapio?: string | null
          categoria?: string | null
          created_at?: string
          custo_total?: number
          id?: string
          modo_preparo?: string | null
          nome: string
          owner_group_id?: string | null
          rendimento: number
          tempo_preparo: number
          tipo?: string | null
          unidade_rendimento: string
          unidade_tempo: string
          updated_at?: string
          usuario_id: string
          valor_venda?: number | null
        }
        Update: {
          cardapio?: string | null
          categoria?: string | null
          created_at?: string
          custo_total?: number
          id?: string
          modo_preparo?: string | null
          nome?: string
          owner_group_id?: string | null
          rendimento?: number
          tempo_preparo?: number
          tipo?: string | null
          unidade_rendimento?: string
          unidade_tempo?: string
          updated_at?: string
          usuario_id?: string
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_despesas_venda: {
        Row: {
          created_at: string
          despesa_id: string
          id: string
          nome: string
          percentual: number
          receita_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          despesa_id: string
          id?: string
          nome: string
          percentual: number
          receita_id: string
          valor: number
        }
        Update: {
          created_at?: string
          despesa_id?: string
          id?: string
          nome?: string
          percentual?: number
          receita_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_despesas_venda_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_embalagens: {
        Row: {
          created_at: string
          custo_receita: number
          custo_unitario: number
          embalagem: string
          embalagem_id: string
          id: string
          marca: string | null
          preco_embalagem: number
          qtde_embalagem: number
          quantidade_utilizada: number
          receita_id: string
          unidade_medida: string
        }
        Insert: {
          created_at?: string
          custo_receita: number
          custo_unitario: number
          embalagem: string
          embalagem_id: string
          id?: string
          marca?: string | null
          preco_embalagem: number
          qtde_embalagem: number
          quantidade_utilizada: number
          receita_id: string
          unidade_medida: string
        }
        Update: {
          created_at?: string
          custo_receita?: number
          custo_unitario?: number
          embalagem?: string
          embalagem_id?: string
          id?: string
          marca?: string | null
          preco_embalagem?: number
          qtde_embalagem?: number
          quantidade_utilizada?: number
          receita_id?: string
          unidade_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "receitas_embalagens_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_imagens: {
        Row: {
          created_at: string
          id: string
          ordem: number
          receita_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          receita_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          receita_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "receitas_imagens_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_ingredientes: {
        Row: {
          created_at: string
          custo_receita: number
          custo_unitario: number
          id: string
          ingrediente: string
          ingrediente_id: string
          marca: string | null
          preco_embalagem: number
          qtde_embalagem: number
          quantidade_utilizada: number
          receita_id: string
          unidade_medida: string
        }
        Insert: {
          created_at?: string
          custo_receita: number
          custo_unitario: number
          id?: string
          ingrediente: string
          ingrediente_id: string
          marca?: string | null
          preco_embalagem: number
          qtde_embalagem: number
          quantidade_utilizada: number
          receita_id: string
          unidade_medida: string
        }
        Update: {
          created_at?: string
          custo_receita?: number
          custo_unitario?: number
          id?: string
          ingrediente?: string
          ingrediente_id?: string
          marca?: string | null
          preco_embalagem?: number
          qtde_embalagem?: number
          quantidade_utilizada?: number
          receita_id?: string
          unidade_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "receitas_ingredientes_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas_mao_obra: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          horas: number
          id: string
          perfil_id: string | null
          receita_id: string
          usar_valor_padrao: boolean
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          horas: number
          id?: string
          perfil_id?: string | null
          receita_id: string
          usar_valor_padrao?: boolean
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          horas?: number
          id?: string
          perfil_id?: string | null
          receita_id?: string
          usar_valor_padrao?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "receitas_mao_obra_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "mao_obra_perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_mao_obra_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      saldos_iniciais_bancos: {
        Row: {
          ano_referencia: number
          banco_id: string
          created_at: string | null
          data_referencia: string
          id: string
          mes_referencia: number
          observacao: string | null
          saldo_inicial: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ano_referencia: number
          banco_id: string
          created_at?: string | null
          data_referencia: string
          id?: string
          mes_referencia: number
          observacao?: string | null
          saldo_inicial?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ano_referencia?: number
          banco_id?: string
          created_at?: string | null
          data_referencia?: string
          id?: string
          mes_referencia?: number
          observacao?: string | null
          saldo_inicial?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saldos_iniciais_bancos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saldos_iniciais_bancos_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "vw_resumo_financeiro"
            referencedColumns: ["banco_id"]
          },
        ]
      }
      tags: {
        Row: {
          ativo: boolean
          categoria_id: string
          cor: string | null
          criado_em: string
          id: string
          nome: string
          ordem: number
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          cor?: string | null
          criado_em?: string
          id?: string
          nome: string
          ordem: number
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          cor?: string | null
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
          user_id?: string | null
        }
        Relationships: []
      }
      tags_encomendas: {
        Row: {
          ativo: boolean | null
          cor: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          owner_group_id: string | null
          padrao_sistema: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          owner_group_id?: string | null
          padrao_sistema?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          owner_group_id?: string | null
          padrao_sistema?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_encomendas_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_documento: {
        Row: {
          ativo: boolean | null
          codigo: number
          contador_uso: number | null
          created_at: string
          descricao: string
          e_padrao: boolean | null
          habilitado: boolean | null
          id: string
          owner_group_id: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: number
          contador_uso?: number | null
          created_at?: string
          descricao: string
          e_padrao?: boolean | null
          habilitado?: boolean | null
          id?: string
          owner_group_id?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: number
          contador_uso?: number | null
          created_at?: string
          descricao?: string
          e_padrao?: boolean | null
          habilitado?: boolean | null
          id?: string
          owner_group_id?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_documento_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_insumos: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          owner_group_id: string | null
          pre_preparo_id: string | null
          quantidade_embalagem: number
          tipo: string
          unidade_medida_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          owner_group_id?: string | null
          pre_preparo_id?: string | null
          quantidade_embalagem: number
          tipo: string
          unidade_medida_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          owner_group_id?: string | null
          pre_preparo_id?: string | null
          quantidade_embalagem?: number
          tipo?: string
          unidade_medida_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_insumos_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_insumos_pre_preparo_id_fkey"
            columns: ["pre_preparo_id"]
            isOneToOne: false
            referencedRelation: "pre_preparos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_insumos_unidade_medida_id_fkey"
            columns: ["unidade_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias_bancos: {
        Row: {
          banco_destino_id: string
          banco_origem_id: string
          created_at: string
          created_by: string
          data_transferencia: string
          descricao: string | null
          id: string
          owner_group_id: string | null
          usuario_id: string
          valor: number
        }
        Insert: {
          banco_destino_id: string
          banco_origem_id: string
          created_at?: string
          created_by: string
          data_transferencia?: string
          descricao?: string | null
          id?: string
          owner_group_id?: string | null
          usuario_id: string
          valor: number
        }
        Update: {
          banco_destino_id?: string
          banco_origem_id?: string
          created_at?: string
          created_by?: string
          data_transferencia?: string
          descricao?: string | null
          id?: string
          owner_group_id?: string | null
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string
          e_padrao: boolean | null
          id: string
          nome: string
          owner_group_id: string | null
          sigla: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string
          e_padrao?: boolean | null
          id?: string
          nome: string
          owner_group_id?: string | null
          sigla: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string
          e_padrao?: boolean | null
          id?: string
          nome?: string
          owner_group_id?: string | null
          sigla?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_medida_owner_group_id_fkey"
            columns: ["owner_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_session: {
        Row: {
          active_group_id: string | null
          id: string
          mode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_group_id?: string | null
          id?: string
          mode?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_group_id?: string | null
          id?: string
          mode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_session_active_group_id_fkey"
            columns: ["active_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_roles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role_global: Database["public"]["Enums"]["role_global"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_global?: Database["public"]["Enums"]["role_global"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_global?: Database["public"]["Enums"]["role_global"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_group_roles: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_active: boolean | null
          permission_flags: Json | null
          role_group: Database["public"]["Enums"]["role_group"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
          permission_flags?: Json | null
          role_group?: Database["public"]["Enums"]["role_group"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          permission_flags?: Json | null
          role_group?: Database["public"]["Enums"]["role_group"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
      v_aniversariantes_completa: {
        Row: {
          cliente_id: string | null
          data_nascimento: string | null
          dia_aniversario: number | null
          email: string | null
          mes_aniversario: number | null
          nome: string | null
          observacoes: string | null
          parentesco: string | null
          proximo_aniversario: string | null
          telefone: string | null
          tipo: string | null
          usuario_id: string | null
        }
        Relationships: []
      }
      v_aniversariantes_fornecedores: {
        Row: {
          cargo: string | null
          data_aniversario: string | null
          dia_aniversario: number | null
          email: string | null
          fornecedor_id: string | null
          mes_aniversario: number | null
          nome: string | null
          observacoes: string | null
          proximo_aniversario: string | null
          telefone: string | null
          tipo: string | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_fornecedor_contato"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedor_contatos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_contas_receber_dashboard: {
        Row: {
          parcelas_abertas: number | null
          parcelas_atrasadas: number | null
          parcelas_pagas: number | null
          total_a_receber: number | null
          total_atrasado: number | null
          total_recebido: number | null
          usuario_id: string | null
          vencendo_hoje: number | null
        }
        Relationships: []
      }
      vw_contas_receber_parcelas: {
        Row: {
          banco_id: string | null
          banco_nome: string | null
          cliente_id: string | null
          cliente_nome: string | null
          conta_receber_id: string | null
          created_at: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_recebimento: string | null
          data_vencimento: string | null
          desconto: number | null
          id: string | null
          juros: number | null
          numero_parcela: number | null
          numero_parcelas: number | null
          observacao: string | null
          plano_conta_id: string | null
          plano_contas_codigo: string | null
          plano_contas_descricao: string | null
          status: string | null
          tipo_documento_descricao: string | null
          tipo_documento_id: string | null
          tipo_lancamento: string | null
          updated_at: string | null
          user_id: string | null
          valor_pago: number | null
          valor_parcela: number | null
          valor_recebido: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_parcelas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_banco"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_banco"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "vw_resumo_financeiro"
            referencedColumns: ["banco_id"]
          },
          {
            foreignKeyName: "fk_contas_receber_plano_conta"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contas_receber_tipo_documento"
            columns: ["tipo_documento_id"]
            isOneToOne: false
            referencedRelation: "tipos_documento"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_resumo_financeiro: {
        Row: {
          ano: number | null
          banco_codigo: string | null
          banco_id: string | null
          banco_nome: string | null
          entradas_mes: number | null
          mes: number | null
          saidas_mes: number | null
          saldo_atual: number | null
          saldo_inicial: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      atualizar_status_parcelas_vencidas: { Args: never; Returns: undefined }
      calcular_custo_pre_preparo: {
        Args: { preparo_id: string }
        Returns: undefined
      }
      calcular_juros_atraso: {
        Args: {
          p_data_pagamento: string
          p_data_vencimento: string
          p_taxa_juros_dia?: number
          p_valor_parcela: number
        }
        Returns: number
      }
      calcular_juros_com_config: {
        Args: {
          p_data_pagamento: string
          p_data_vencimento: string
          p_user_id: string
          p_valor_parcela: number
        }
        Returns: {
          juros: number
          multa: number
          total: number
        }[]
      }
      calcular_proxima_execucao_backup: {
        Args: { p_frequencia: string; p_horario: string; p_referencia?: string }
        Returns: string
      }
      check_and_increment_ai_quota: {
        Args: { p_plano_id: string; p_user_id: string }
        Returns: Json
      }
      criar_banco_caixa_empresa_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      criar_bancos_oficiais_usuario: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      criar_bancos_padrao_para_usuario: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      criar_categorias_padrao: { Args: { user_id: string }; Returns: undefined }
      criar_categorias_plano_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      criar_planos_contas_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      criar_tags_padrao_encomendas: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      criar_tipos_documento_padrao_para_usuario: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      criar_tipos_documentos_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      criar_unidades_medida_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      current_user_group: { Args: never; Returns: string }
      deletar_cadastros_seletivo: {
        Args: { p_selecao: Json; p_user_id: string }
        Returns: Json
      }
      deletar_cadastros_usuario: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      expire_overdue_plans: { Args: never; Returns: number }
      fechar_mes: {
        Args: {
          p_custos: number
          p_faturamento: number
          p_fechamento_id: string
          p_margem_seguranca: number
          p_observacoes: string
          p_pro_labore_saudavel: number
          p_retiradas: number
          p_saldo_restante: number
          p_snapshot: Json
        }
        Returns: undefined
      }
      gerar_proximo_codigo_categoria: {
        Args: { p_user_id: string }
        Returns: string
      }
      gerar_proximo_codigo_estruturado: {
        Args: { p_categoria_id: string; p_user_id: string }
        Returns: string
      }
      gerar_proximo_codigo_plano: {
        Args: { p_user_id: string }
        Returns: number
      }
      gerar_proximo_codigo_tipo_documento: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_active_group_id: { Args: { _user_id: string }; Returns: string }
      get_admin_dashboard_metrics: {
        Args: never
        Returns: {
          active_users_today: number
          active_users_week: number
          pending_deletions: number
          recent_errors: number
          total_storage_used: number
          total_users: number
        }[]
      }
      get_admin_recent_activity: {
        Args: never
        Returns: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string
          id: string
          module: string
          reason: string
          target_user_email: string
          target_user_id: string
        }[]
      }
      get_aniversariantes_fornecedores_mes: {
        Args: { mes_param?: number }
        Returns: {
          cargo: string
          data_aniversario: string
          dias_ate_aniversario: number
          email: string
          fornecedor_id: string
          nome: string
          observacoes: string
          proximo_aniversario: string
          telefone: string
          tipo: string
        }[]
      }
      get_aniversariantes_mes: {
        Args: { mes_param: number }
        Returns: {
          cliente_id: string
          data_nascimento: string
          dias_ate_aniversario: number
          nome: string
          parentesco: string
          telefone: string
          tipo: string
        }[]
      }
      get_custos_fixos_mes: {
        Args: { p_ano: number; p_mes: number; p_usuario_id: string }
        Returns: number
      }
      get_faturamento_mes: {
        Args: { p_ano: number; p_mes: number; p_usuario_id: string }
        Returns: number
      }
      get_quantidade_vendas_mes: {
        Args: { p_ano: number; p_mes: number; p_usuario_id: string }
        Returns: number
      }
      get_ticket_medio_mes: {
        Args: { p_ano: number; p_mes: number; p_usuario_id: string }
        Returns: number
      }
      get_todos_aniversariantes: {
        Args: { p_tenant_id: string }
        Returns: {
          cliente_nome: string
          data_aniversario: string
          dias_ate_aniversario: number
          id: string
          nome: string
          telefone: string
          tipo: string
        }[]
      }
      get_user_group_role: {
        Args: { _group_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["role_group"]
      }
      hard_delete_user_data: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: Json
      }
      has_permission: {
        Args: { _group_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      incrementar_uso_tipo_documento: {
        Args: { p_tipo_documento_id: string }
        Returns: undefined
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_mes_fechado: {
        Args: { _data: string; _group_id: string }
        Returns: boolean
      }
      is_mother: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_admin_id: string
          p_details?: Json
          p_module?: string
          p_target_user_id?: string
        }
        Returns: undefined
      }
      realizar_transferencia: {
        Args: {
          p_banco_destino_id: string
          p_banco_origem_id: string
          p_data_transferencia: string
          p_descricao?: string
          p_valor: number
        }
        Returns: Json
      }
      record_ai_tokens: {
        Args: { p_tokens_in: number; p_tokens_out: number; p_user_id: string }
        Returns: undefined
      }
      user_belongs_to_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_financial_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      user_in_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      validar_estoque_receita: {
        Args: {
          p_quantidade: number
          p_receita_id: string
          p_usuario_id: string
        }
        Returns: {
          itens_faltantes: Json
          tem_estoque: boolean
        }[]
      }
      validate_admin_token: { Args: { p_token: string }; Returns: Json }
      verificar_tipo_documento_em_uso: {
        Args: { p_tipo_documento_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      planejamento_area:
        | "financeiro"
        | "vendas"
        | "marketing"
        | "pessoal"
        | "producao"
        | "atendimento"
      planejamento_data_tipo: "comemorativa" | "pessoal" | "descanso"
      planejamento_descanso_tipo: "ferias" | "folga" | "pessoal"
      planejamento_prioridade: "alta" | "media" | "baixa"
      planejamento_status:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "cancelada"
      role_global: "MOTHER"
      role_group: "ADMIN" | "USER"
      status_entrada: "ATIVO" | "CONSUMIDO"
      tipo_item_estoque: "INSUMO" | "EMBALAGEM" | "outros"
      tipo_movimentacao: "ENTRADA" | "SAIDA" | "PERDA" | "AJUSTE"
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
      planejamento_area: [
        "financeiro",
        "vendas",
        "marketing",
        "pessoal",
        "producao",
        "atendimento",
      ],
      planejamento_data_tipo: ["comemorativa", "pessoal", "descanso"],
      planejamento_descanso_tipo: ["ferias", "folga", "pessoal"],
      planejamento_prioridade: ["alta", "media", "baixa"],
      planejamento_status: [
        "pendente",
        "em_andamento",
        "concluida",
        "cancelada",
      ],
      role_global: ["MOTHER"],
      role_group: ["ADMIN", "USER"],
      status_entrada: ["ATIVO", "CONSUMIDO"],
      tipo_item_estoque: ["INSUMO", "EMBALAGEM", "outros"],
      tipo_movimentacao: ["ENTRADA", "SAIDA", "PERDA", "AJUSTE"],
    },
  },
} as const

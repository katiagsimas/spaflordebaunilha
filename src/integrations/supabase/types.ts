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
      _backup_embalagens: {
        Row: {
          controlar_estoque: boolean | null
          created_at: string | null
          data_atualizacao: string | null
          id: string | null
          marca: string | null
          preco: number | null
          tipo_insumo_id: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          controlar_estoque?: boolean | null
          created_at?: string | null
          data_atualizacao?: string | null
          id?: string | null
          marca?: string | null
          preco?: number | null
          tipo_insumo_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          controlar_estoque?: boolean | null
          created_at?: string | null
          data_atualizacao?: string | null
          id?: string | null
          marca?: string | null
          preco?: number | null
          tipo_insumo_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      _backup_ingredientes: {
        Row: {
          controlar_estoque: boolean | null
          created_at: string | null
          data_atualizacao: string | null
          e_pre_preparo: boolean | null
          id: string | null
          marca: string | null
          preco: number | null
          tipo_insumo_id: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          controlar_estoque?: boolean | null
          created_at?: string | null
          data_atualizacao?: string | null
          e_pre_preparo?: boolean | null
          id?: string | null
          marca?: string | null
          preco?: number | null
          tipo_insumo_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          controlar_estoque?: boolean | null
          created_at?: string | null
          data_atualizacao?: string | null
          e_pre_preparo?: boolean | null
          id?: string | null
          marca?: string | null
          preco?: number | null
          tipo_insumo_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      _backup_tipos_insumos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string | null
          pre_preparo_id: string | null
          quantidade_embalagem: number | null
          tipo: string | null
          unidade_medida_id: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string | null
          pre_preparo_id?: string | null
          quantidade_embalagem?: number | null
          tipo?: string | null
          unidade_medida_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string | null
          pre_preparo_id?: string | null
          quantidade_embalagem?: number | null
          tipo?: string | null
          unidade_medida_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
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
      bancos: {
        Row: {
          codigo: string
          created_at: string
          e_banco_oficial: boolean | null
          e_customizado: boolean | null
          id: string
          nome: string
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
          id?: string
          nome: string
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
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
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
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categorias_tags: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
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
      cmv_mensal: {
        Row: {
          ano: number
          compras: number
          created_at: string
          estoque_final: number
          estoque_inicial: number
          faturamento: number
          id: string
          mes: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ano: number
          compras?: number
          created_at?: string
          estoque_final?: number
          estoque_inicial?: number
          faturamento?: number
          id?: string
          mes: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ano?: number
          compras?: number
          created_at?: string
          estoque_final?: number
          estoque_inicial?: number
          faturamento?: number
          id?: string
          mes?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      configuracao_mao_obra: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          padrao: boolean | null
          ultima_alteracao: string | null
          updated_at: string | null
          user_id: string
          valor_hora: number
          versao: number | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          padrao?: boolean | null
          ultima_alteracao?: string | null
          updated_at?: string | null
          user_id: string
          valor_hora: number
          versao?: number | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          padrao?: boolean | null
          ultima_alteracao?: string | null
          updated_at?: string | null
          user_id?: string
          valor_hora?: number
          versao?: number | null
        }
        Relationships: []
      }
      configuracoes_juros: {
        Row: {
          cobrar_juros: boolean | null
          created_at: string | null
          id: string
          multa_atraso: boolean | null
          observacao: string | null
          percentual_juros: number
          percentual_multa: number | null
          tipo_juros: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          cobrar_juros?: boolean | null
          created_at?: string | null
          id?: string
          multa_atraso?: boolean | null
          observacao?: string | null
          percentual_juros?: number
          percentual_multa?: number | null
          tipo_juros?: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          cobrar_juros?: boolean | null
          created_at?: string | null
          id?: string
          multa_atraso?: boolean | null
          observacao?: string | null
          percentual_juros?: number
          percentual_multa?: number | null
          tipo_juros?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: []
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
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
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
          controlar_estoque: boolean
          created_at: string | null
          data_atualizacao: string
          id: string
          marca: string | null
          preco: number
          tipo_insumo_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          controlar_estoque?: boolean
          created_at?: string | null
          data_atualizacao?: string
          id?: string
          marca?: string | null
          preco: number
          tipo_insumo_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          controlar_estoque?: boolean
          created_at?: string | null
          data_atualizacao?: string
          id?: string
          marca?: string | null
          preco?: number
          tipo_insumo_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
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
          conta_receber_id: string | null
          created_at: string
          data_entrega: string | null
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
          conta_receber_id?: string | null
          created_at?: string
          data_entrega?: string | null
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
          conta_receber_id?: string | null
          created_at?: string
          data_entrega?: string | null
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
        Relationships: [
          {
            foreignKeyName: "encomendas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
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
            foreignKeyName: "encomendas_tags_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "vw_encomendas_com_tags"
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
          controlar_estoque: boolean
          created_at: string | null
          data_atualizacao: string
          e_pre_preparo: boolean | null
          id: string
          marca: string | null
          preco: number
          tipo_insumo_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          controlar_estoque?: boolean
          created_at?: string | null
          data_atualizacao?: string
          e_pre_preparo?: boolean | null
          id?: string
          marca?: string | null
          preco: number
          tipo_insumo_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          controlar_estoque?: boolean
          created_at?: string | null
          data_atualizacao?: string
          e_pre_preparo?: boolean | null
          id?: string
          marca?: string | null
          preco?: number
          tipo_insumo_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_tipo_insumo_id_fkey"
            columns: ["tipo_insumo_id"]
            isOneToOne: false
            referencedRelation: "tipos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string | null
          conversoes: Json | null
          criado_em: string
          descricao: string | null
          fornecedor_padrao: string | null
          id: string
          imagem_url: string | null
          localizacao: string | null
          marca: string | null
          nome: string
          observacoes: string | null
          ponto_de_pedido: number | null
          quantidade_por_embalagem: number
          rastrear_estoque: boolean
          tipo: string
          unidade_base: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          conversoes?: Json | null
          criado_em?: string
          descricao?: string | null
          fornecedor_padrao?: string | null
          id?: string
          imagem_url?: string | null
          localizacao?: string | null
          marca?: string | null
          nome: string
          observacoes?: string | null
          ponto_de_pedido?: number | null
          quantidade_por_embalagem?: number
          rastrear_estoque?: boolean
          tipo: string
          unidade_base: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          conversoes?: Json | null
          criado_em?: string
          descricao?: string | null
          fornecedor_padrao?: string | null
          id?: string
          imagem_url?: string | null
          localizacao?: string | null
          marca?: string | null
          nome?: string
          observacoes?: string | null
          ponto_de_pedido?: number | null
          quantidade_por_embalagem?: number
          rastrear_estoque?: boolean
          tipo?: string
          unidade_base?: string
          usuario_id?: string
        }
        Relationships: []
      }
      mao_obra_historico: {
        Row: {
          created_at: string | null
          data_alteracao: string | null
          descricao_alteracao: string | null
          descricao_anterior: string | null
          descricao_novo: string | null
          id: string
          mao_obra_id: string
          nome_anterior: string | null
          nome_novo: string | null
          tipo_alteracao: string | null
          user_id: string
          valor_anterior: number | null
          valor_novo: number
        }
        Insert: {
          created_at?: string | null
          data_alteracao?: string | null
          descricao_alteracao?: string | null
          descricao_anterior?: string | null
          descricao_novo?: string | null
          id?: string
          mao_obra_id: string
          nome_anterior?: string | null
          nome_novo?: string | null
          tipo_alteracao?: string | null
          user_id: string
          valor_anterior?: number | null
          valor_novo: number
        }
        Update: {
          created_at?: string | null
          data_alteracao?: string | null
          descricao_alteracao?: string | null
          descricao_anterior?: string | null
          descricao_novo?: string | null
          id?: string
          mao_obra_id?: string
          nome_anterior?: string | null
          nome_novo?: string | null
          tipo_alteracao?: string | null
          user_id?: string
          valor_anterior?: number | null
          valor_novo?: number
        }
        Relationships: [
          {
            foreignKeyName: "mao_obra_historico_mao_obra_id_fkey"
            columns: ["mao_obra_id"]
            isOneToOne: false
            referencedRelation: "configuracao_mao_obra"
            referencedColumns: ["id"]
          },
        ]
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
      movimentos_estoque_v2: {
        Row: {
          criado_em: string
          custo_unitario: number | null
          data: string
          id: string
          item_id: string
          observacao: string | null
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          responsavel: string | null
          subtipo: string | null
          tipo: string
          usuario_id: string
          valor_total: number | null
        }
        Insert: {
          criado_em?: string
          custo_unitario?: number | null
          data?: string
          id?: string
          item_id: string
          observacao?: string | null
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          responsavel?: string | null
          subtipo?: string | null
          tipo: string
          usuario_id: string
          valor_total?: number | null
        }
        Update: {
          criado_em?: string
          custo_unitario?: number | null
          data?: string
          id?: string
          item_id?: string
          observacao?: string | null
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          responsavel?: string | null
          subtipo?: string | null
          tipo?: string
          usuario_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_estoque_v2_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_atual_v2"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "movimentos_estoque_v2_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
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
        ]
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
      precos: {
        Row: {
          ativo: boolean
          criado_em: string
          custo_unitario: number | null
          data_coleta: string
          fornecedor: string | null
          id: string
          item_id: string
          link_compra: string | null
          marca: string
          observacao: string | null
          preco_total_embalagem: number
          quantidade_embalagem: number
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          custo_unitario?: number | null
          data_coleta?: string
          fornecedor?: string | null
          id?: string
          item_id: string
          link_compra?: string | null
          marca: string
          observacao?: string | null
          preco_total_embalagem: number
          quantidade_embalagem: number
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          custo_unitario?: number | null
          data_coleta?: string
          fornecedor?: string | null
          id?: string
          item_id?: string
          link_compra?: string | null
          marca?: string
          observacao?: string | null
          preco_total_embalagem?: number
          quantidade_embalagem?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "precos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_atual_v2"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "precos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_tarefas: {
        Row: {
          concluida: boolean
          created_at: string
          data: string
          descricao: string
          id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data?: string
          descricao: string
          id?: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
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
          planejamento_banner_dismissed: boolean | null
          primeiro_acesso: boolean | null
          razao_social: string | null
          tags: string[] | null
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
          planejamento_banner_dismissed?: boolean | null
          primeiro_acesso?: boolean | null
          razao_social?: string | null
          tags?: string[] | null
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
          planejamento_banner_dismissed?: boolean | null
          primeiro_acesso?: boolean | null
          razao_social?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          cardapio: string | null
          categoria: string | null
          created_at: string
          custo_mao_obra: number | null
          custo_total: number
          id: string
          modo_preparo: string | null
          nome: string
          rendimento: number
          tempo_preparo: number
          tipo: string | null
          tipo_mao_obra_id: string | null
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
          custo_mao_obra?: number | null
          custo_total?: number
          id?: string
          modo_preparo?: string | null
          nome: string
          rendimento: number
          tempo_preparo: number
          tipo?: string | null
          tipo_mao_obra_id?: string | null
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
          custo_mao_obra?: number | null
          custo_total?: number
          id?: string
          modo_preparo?: string | null
          nome?: string
          rendimento?: number
          tempo_preparo?: number
          tipo?: string | null
          tipo_mao_obra_id?: string | null
          unidade_rendimento?: string
          unidade_tempo?: string
          updated_at?: string
          usuario_id?: string
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_tipo_mao_obra_id_fkey"
            columns: ["tipo_mao_obra_id"]
            isOneToOne: false
            referencedRelation: "configuracao_mao_obra"
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
      sub_receitas: {
        Row: {
          created_at: string
          custo_total: number
          id: string
          imagem_1_url: string | null
          imagem_2_url: string | null
          modo_preparo: string | null
          nome: string
          rendimento: number
          tempo_preparo: number
          unidade_rendimento_id: string
          unidade_tempo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          custo_total?: number
          id?: string
          imagem_1_url?: string | null
          imagem_2_url?: string | null
          modo_preparo?: string | null
          nome: string
          rendimento: number
          tempo_preparo: number
          unidade_rendimento_id: string
          unidade_tempo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          custo_total?: number
          id?: string
          imagem_1_url?: string | null
          imagem_2_url?: string | null
          modo_preparo?: string | null
          nome?: string
          rendimento?: number
          tempo_preparo?: number
          unidade_rendimento_id?: string
          unidade_tempo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      sub_receitas_ingredientes: {
        Row: {
          created_at: string | null
          custo_ingrediente: number
          id: string
          ingrediente_id: string
          ordem: number
          quantidade_utilizada: number
          sub_receita_id: string
        }
        Insert: {
          created_at?: string | null
          custo_ingrediente?: number
          id?: string
          ingrediente_id: string
          ordem?: number
          quantidade_utilizada: number
          sub_receita_id: string
        }
        Update: {
          created_at?: string | null
          custo_ingrediente?: number
          id?: string
          ingrediente_id?: string
          ordem?: number
          quantidade_utilizada?: number
          sub_receita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_receitas_ingredientes_sub_receita_id_fkey"
            columns: ["sub_receita_id"]
            isOneToOne: false
            referencedRelation: "sub_receitas"
            referencedColumns: ["id"]
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
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          cor?: string | null
          criado_em?: string
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          cor?: string | null
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "tags_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags_contas_receber: {
        Row: {
          cor: string
          created_at: string | null
          id: string
          nome: string
          usuario_id: string
        }
        Insert: {
          cor?: string
          created_at?: string | null
          id?: string
          nome: string
          usuario_id: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          id?: string
          nome?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_contas_receber_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_contas_receber_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "user_statistics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tags_encomendas: {
        Row: {
          ativo: boolean | null
          cor: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tipos_documento: {
        Row: {
          ativo: boolean | null
          codigo: number
          created_at: string
          descricao: string
          e_padrao: boolean | null
          id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: number
          created_at?: string
          descricao: string
          e_padrao?: boolean | null
          id?: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: number
          created_at?: string
          descricao?: string
          e_padrao?: boolean | null
          id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      tipos_insumos: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
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
          pre_preparo_id?: string | null
          quantidade_embalagem?: number
          tipo?: string
          unidade_medida_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
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
      unidades_medida: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string
          e_padrao: boolean | null
          id: string
          nome: string
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
      estoque_atual_v2: {
        Row: {
          categoria: string | null
          custo_medio: number | null
          item_id: string | null
          nome: string | null
          ponto_de_pedido: number | null
          saldo: number | null
          tipo: string | null
          ultima_movimentacao: string | null
          unidade_base: string | null
          usuario_id: string | null
          valor_estoque: number | null
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          cadastrado_em: string | null
          confeitaria: string | null
          email: string | null
          full_name: string | null
          permissao: Database["public"]["Enums"]["app_role"] | null
          status: boolean | null
          total_clientes: number | null
          total_contas_pagar: number | null
          total_contas_receber: number | null
          total_encomendas: number | null
          total_fornecedores: number | null
          total_receitas: number | null
          ultimo_acesso: string | null
          user_id: string | null
          valor_total_encomendas: number | null
        }
        Relationships: []
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
      vw_encomendas_com_tags: {
        Row: {
          cep: string | null
          cliente: string | null
          conta_receber_id: string | null
          created_at: string | null
          data_entrega: string | null
          data_pedido: string | null
          desconto_percentual: number | null
          desconto_valor: number | null
          endereco: string | null
          hora_entrega: string | null
          id: string | null
          numero: string | null
          observacoes: string | null
          outros: number | null
          pagamentos: Json | null
          saldo_restante: number | null
          status: string | null
          tags: Json | null
          taxa_entrega: number | null
          telefone: string | null
          topo_aniversariante: string | null
          topo_bolo: number | null
          topo_idade: string | null
          topo_imagens: Json | null
          topo_obs: string | null
          topo_tema: string | null
          updated_at: string | null
          usuario_id: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "encomendas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
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
      calcular_custo_sub_receita: {
        Args: { receita_id: string }
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
      criar_banco_caixa_empresa_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
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
      criar_tipos_documentos_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      criar_unidades_medida_padrao: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      deletar_cadastros_usuario: {
        Args: { p_user_id: string }
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
      get_insights_cruzados: {
        Args: { dias: number; user_id_param: string }
        Returns: {
          evento: string
          origem: string
          percentual: number
          ticket_medio: number
          total_vendas: number
          valor_total: number
        }[]
      }
      get_status_estoque: {
        Args: { p_ponto_pedido: number; p_saldo: number }
        Returns: string
      }
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

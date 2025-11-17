import { supabase } from '@/integrations/supabase/client';

export interface MigrationResult {
  success: boolean;
  tableName: string;
  recordsCount: number;
  error?: string;
}

export interface MigrationResponse {
  success: boolean;
  results: MigrationResult[];
  totalRecords: number;
}

/**
 * Migra TODOS os dados do localStorage para o Supabase
 * Executado automaticamente no primeiro login
 */
export async function migrateAllLocalStorageData(userId: string): Promise<MigrationResponse> {
  console.log('🚀 Iniciando migração completa de dados...');
  
  // 1. Verificar se já foi migrado
  const migrationKey = `migration_completed_${userId}`;
  if (localStorage.getItem(migrationKey)) {
    console.log('✅ Dados já foram migrados anteriormente.');
    return { 
      success: true, 
      results: [], 
      totalRecords: 0 
    };
  }
  
  const results: MigrationResult[] = [];
  let totalRecords = 0;
  
  // 2. Mapa de chaves localStorage -> nome da tabela Supabase
  const tableMapping: Record<string, string> = {
    'clientes': 'clientes',
    'fornecedores': 'fornecedores',
    'categorias': 'categorias',
    'unidadesMedida': 'unidades_medida',
    'custosFixos': 'custos_fixos',
    'embalagens': 'embalagens',
    'ingredientes': 'ingredientes',
    'orders': 'encomendas',
    'sugarbox_contas_receber': 'contas_receber',
    'sugarbox_contas_pagar': 'contas_pagar',
    'sugarbox_bancos': 'bancos',
    'bancos': 'bancos',
  };
  
  // 3. Para cada chave mapeada, tentar migrar
  for (const [localKey, tableName] of Object.entries(tableMapping)) {
    try {
      const rawData = localStorage.getItem(localKey);
      if (!rawData) {
        console.log(`ℹ️ Chave não encontrada: ${localKey}`);
        continue;
      }
      
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        console.warn(`⚠️ Não é JSON válido: ${localKey}`);
        continue;
      }
      
      if (!Array.isArray(data)) {
        console.warn(`⚠️ Não é array: ${localKey}`);
        continue;
      }
      
      if (data.length === 0) {
        console.log(`ℹ️ Array vazio: ${localKey}`);
        continue;
      }
      
      console.log(`🔄 Migrando ${tableName}: ${data.length} registros...`);
      
      // Adicionar usuario_id em cada registro e mapear campos para o novo formato
      const dataWithUserId = data.map(record => {
        // Remover campos temporários ou desnecessários
        const { id: _id, ...rest } = record;
        
        // Mapear campos antigos para novos (específico para contas_receber)
        let mappedRecord = { ...rest };
        
        if (tableName === 'contas_receber') {
          // Não migrar contas a receber do localStorage - serão criadas manualmente
          return null;
        }
        
        return {
          ...mappedRecord,
          usuario_id: userId,
          created_at: record.created_at || new Date().toISOString(),
          updated_at: record.updated_at || new Date().toISOString()
        };
      }).filter(Boolean); // Remove registros nulos
      
      if (dataWithUserId.length === 0) {
        console.log(`ℹ️ Nenhum registro para migrar em ${tableName}`);
        continue;
      }
      
      // Inserir no Supabase
      const { error } = await supabase
        .from(tableName as any)
        .insert(dataWithUserId);
      
      if (error) {
        console.error(`❌ Erro ao migrar ${tableName}:`, error);
        results.push({
          success: false,
          tableName,
          recordsCount: data.length,
          error: error.message
        });
      } else {
        console.log(`✅ ${tableName} migrado: ${data.length} registros`);
        results.push({
          success: true,
          tableName,
          recordsCount: data.length
        });
        totalRecords += data.length;
      }
      
    } catch (error: any) {
      console.error(`❌ Erro ao processar ${localKey}:`, error);
      results.push({
        success: false,
        tableName: localKey,
        recordsCount: 0,
        error: error.message
      });
    }
  }
  
  // 4. Marcar migração como completa se houve algum sucesso
  if (results.some(r => r.success)) {
    localStorage.setItem(migrationKey, 'true');
    localStorage.setItem(`migration_date_${userId}`, new Date().toISOString());
    localStorage.setItem(`migration_results_${userId}`, JSON.stringify(results));
  }
  
  console.log('✅ Migração concluída!', {
    total: results.length,
    sucesso: results.filter(r => r.success).length,
    falhas: results.filter(r => !r.success).length,
    totalRegistros: totalRecords
  });
  
  return {
    success: results.some(r => r.success),
    results,
    totalRecords
  };
}

/**
 * Limpa o localStorage após migração bem-sucedida
 * ATENÇÃO: Só executar após confirmar que dados estão no Supabase!
 */
export function cleanLocalStorageAfterMigration(userId: string) {
  const keepKeys = [
    'theme',
    'language',
    'ui-preferences',
    `migration_completed_${userId}`,
    `migration_date_${userId}`,
    `migration_results_${userId}`,
  ];
  
  const allKeys = Object.keys(localStorage);
  const keysToRemove: string[] = [];
  
  for (const key of allKeys) {
    const shouldKeep = keepKeys.some(keepKey => key.includes(keepKey)) || 
                       key.startsWith('supabase.');
    
    if (!shouldKeep) {
      keysToRemove.push(key);
    }
  }
  
  console.log('🗑️ Removendo do localStorage:', keysToRemove);
  
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
  
  console.log('✅ localStorage limpo!');
}

import { supabase } from '@/integrations/supabase/client';

interface MigrationResult {
  success: boolean;
  tableName: string;
  recordsCount: number;
  error?: any;
}

export interface CompleteMigrationResult {
  success: boolean;
  results: MigrationResult[];
  totalRecords: number;
}

/**
 * Mapeamento de chaves localStorage para tabelas Supabase
 */
const TABLE_MAPPING: Record<string, string> = {
  'clientes': 'clientes',
  'fornecedores': 'fornecedores',
  'categorias': 'categorias',
  'unidadesMedida': 'unidades_medida',
  'custosFixos': 'custos_fixos',
  'embalagens': 'embalagens',
  'ingredientes': 'ingredientes',
  'orders': 'encomendas',
  'categorias_financeiras': 'categorias_financeiras',
  'sugarbox_categorias_financeiras': 'categorias_financeiras',
  'sugarbox_contas_receber': 'contas_receber',
  'sugarbox_contas_pagar': 'contas_pagar',
  'bancos': 'bancos',
  'sugarbox_bancos': 'bancos',
};

/**
 * Chaves que devem ser ignoradas na migração
 */
const IGNORED_KEYS = [
  'migration_completed_',
  'migration_date_',
  'migration_results_',
  'supabase.',
  'theme',
  'ui-',
  'userName',
  'isLoggedIn',
  'nomeNegocio',
  'diasTrabalho',
  'horasDiarias',
  'planejamento_banner_dismissed',
  'configuracaoPlanejamento',
  'cmv_global',
  'cmvData',
];

/**
 * Migra automaticamente todos os dados do localStorage para Supabase
 */
export async function migrateAllLocalStorageData(userId: string): Promise<CompleteMigrationResult> {
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
  
  // 2. Listar TODAS as chaves do localStorage
  const allKeys = Object.keys(localStorage);
  console.log('📦 Chaves encontradas no localStorage:', allKeys);
  
  // 3. Filtrar apenas chaves de dados
  const dataKeys = allKeys.filter(key => {
    return !IGNORED_KEYS.some(ignored => key.startsWith(ignored) || key === ignored);
  });
  
  console.log('📋 Chaves de dados para migrar:', dataKeys);
  
  // 4. Para cada chave, tentar migrar
  for (const key of dataKeys) {
    try {
      const rawData = localStorage.getItem(key);
      if (!rawData) continue;
      
      // Tentar fazer parse
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        console.warn(`⚠️ Não é JSON válido: ${key}`);
        continue;
      }
      
      // Verificar se é array de dados
      if (!Array.isArray(data)) {
        console.warn(`⚠️ Não é array: ${key}`);
        continue;
      }
      
      if (data.length === 0) {
        console.log(`ℹ️ Array vazio: ${key}`);
        continue;
      }
      
      // Descobrir nome da tabela
      const tableName = TABLE_MAPPING[key] || key;
      
      console.log(`🔄 Migrando ${key} -> ${tableName}: ${data.length} registros...`);
      
      // Adicionar user_id em cada registro
      const dataWithUserId = data.map(record => {
        const cleanRecord: any = {};
        
        // Copiar apenas campos que não são técnicos
        Object.keys(record).forEach(field => {
          if (field !== 'id' && field !== 'created_at' && field !== 'updated_at') {
            cleanRecord[field] = record[field];
          }
        });
        
        return {
          ...cleanRecord,
          usuario_id: userId,
        };
      });
      
      // Tentar inserir no Supabase
      const { error } = await (supabase as any)
        .from(tableName)
        .insert(dataWithUserId);
      
      if (error) {
        console.error(`❌ Erro ao migrar ${tableName}:`, error);
        results.push({
          success: false,
          tableName,
          recordsCount: data.length,
          error
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
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${key}:`, error);
      results.push({
        success: false,
        tableName: key,
        recordsCount: 0,
        error
      });
    }
  }
  
  // 5. Marcar migração como completa
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
 * Limpa localStorage após migração bem-sucedida
 */
export function cleanLocalStorageAfterMigration(userId: string) {
  const keepKeys = [
    'theme',
    'language',
    'ui-preferences',
    `migration_completed_${userId}`,
    `migration_date_${userId}`,
    `migration_results_${userId}`,
    'nomeNegocio',
    'diasTrabalho',
    'horasDiarias',
    'planejamento_banner_dismissed',
    'configuracaoPlanejamento',
    'cmv_global',
    'cmvData',
  ];
  
  Object.keys(localStorage).forEach(key => {
    if (!keepKeys.includes(key) && !key.startsWith('supabase.')) {
      console.log('🗑️ Removendo do localStorage:', key);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ localStorage limpo!');
}

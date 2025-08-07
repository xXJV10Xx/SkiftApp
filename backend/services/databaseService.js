// Database Service Layer
const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  // Generic query builder with error handling
  async query(table, options = {}) {
    try {
      let query = this.supabase.from(table);

      // Apply select
      if (options.select) {
        query = query.select(options.select);
      }

      // Apply filters
      if (options.filters) {
        options.filters.forEach(filter => {
          const { column, operator, value } = filter;
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            case 'gt':
              query = query.gt(column, value);
              break;
            case 'gte':
              query = query.gte(column, value);
              break;
            case 'lt':
              query = query.lt(column, value);
              break;
            case 'lte':
              query = query.lte(column, value);
              break;
            case 'in':
              query = query.in(column, value);
              break;
            case 'like':
              query = query.like(column, value);
              break;
            case 'ilike':
              query = query.ilike(column, value);
              break;
            default:
              query = query.eq(column, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        const { column, ascending = true } = options.orderBy;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(error.message, error.code, error.details);
      }

      return {
        data,
        count,
        error: null
      };

    } catch (error) {
      console.error(`Database query error on table ${table}:`, error);
      return {
        data: null,
        count: 0,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Insert with validation
  async insert(table, data, options = {}) {
    try {
      let query = this.supabase.from(table).insert(data);

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.single) {
        query = query.single();
      }

      const { data: result, error } = await query;

      if (error) {
        throw new DatabaseError(error.message, error.code, error.details);
      }

      return {
        data: result,
        error: null
      };

    } catch (error) {
      console.error(`Database insert error on table ${table}:`, error);
      return {
        data: null,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Update with validation
  async update(table, data, filters, options = {}) {
    try {
      let query = this.supabase.from(table).update(data);

      // Apply filters
      filters.forEach(filter => {
        const { column, operator = 'eq', value } = filter;
        query = query[operator](column, value);
      });

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.single) {
        query = query.single();
      }

      const { data: result, error } = await query;

      if (error) {
        throw new DatabaseError(error.message, error.code, error.details);
      }

      return {
        data: result,
        error: null
      };

    } catch (error) {
      console.error(`Database update error on table ${table}:`, error);
      return {
        data: null,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Delete with validation
  async delete(table, filters) {
    try {
      let query = this.supabase.from(table).delete();

      // Apply filters
      filters.forEach(filter => {
        const { column, operator = 'eq', value } = filter;
        query = query[operator](column, value);
      });

      const { error } = await query;

      if (error) {
        throw new DatabaseError(error.message, error.code, error.details);
      }

      return {
        success: true,
        error: null
      };

    } catch (error) {
      console.error(`Database delete error on table ${table}:`, error);
      return {
        success: false,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Transaction wrapper
  async transaction(operations) {
    try {
      const results = [];
      
      for (const operation of operations) {
        const { type, table, data, filters, options } = operation;
        
        let result;
        switch (type) {
          case 'insert':
            result = await this.insert(table, data, options);
            break;
          case 'update':
            result = await this.update(table, data, filters, options);
            break;
          case 'delete':
            result = await this.delete(table, filters);
            break;
          case 'select':
            result = await this.query(table, options);
            break;
          default:
            throw new Error(`Unknown operation type: ${type}`);
        }

        if (result.error) {
          throw result.error;
        }

        results.push(result);
      }

      return {
        results,
        error: null
      };

    } catch (error) {
      console.error('Transaction error:', error);
      return {
        results: null,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);

      return {
        healthy: !error,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get table statistics
  async getTableStats(table) {
    try {
      const { count, error } = await this.supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new DatabaseError(error.message, error.code);
      }

      return {
        table,
        count,
        error: null
      };

    } catch (error) {
      return {
        table,
        count: 0,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Bulk operations
  async bulkInsert(table, records, batchSize = 100) {
    try {
      const results = [];
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await this.insert(table, batch);
        
        if (result.error) {
          throw result.error;
        }
        
        results.push(...(Array.isArray(result.data) ? result.data : [result.data]));
      }

      return {
        data: results,
        count: results.length,
        error: null
      };

    } catch (error) {
      console.error(`Bulk insert error on table ${table}:`, error);
      return {
        data: null,
        count: 0,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }

  // Search functionality
  async search(table, searchTerm, searchColumns, options = {}) {
    try {
      let query = this.supabase.from(table);

      if (options.select) {
        query = query.select(options.select);
      }

      // Build search filters
      const searchFilters = searchColumns.map(column => 
        `${column}.ilike.%${searchTerm}%`
      ).join(',');

      query = query.or(searchFilters);

      // Apply additional filters
      if (options.filters) {
        options.filters.forEach(filter => {
          const { column, operator, value } = filter;
          query = query[operator](column, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        const { column, ascending = true } = options.orderBy;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(error.message, error.code);
      }

      return {
        data,
        searchTerm,
        error: null
      };

    } catch (error) {
      console.error(`Search error on table ${table}:`, error);
      return {
        data: null,
        searchTerm,
        error: error instanceof DatabaseError ? error : new DatabaseError(error.message)
      };
    }
  }
}

// Custom Database Error class
class DatabaseError extends Error {
  constructor(message, code = 'DATABASE_ERROR', details = null) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = {
  DatabaseService,
  DatabaseError,
  db: databaseService
};
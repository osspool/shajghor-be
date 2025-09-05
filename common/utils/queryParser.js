/**
 * Advanced query parser for REST API filters
 * Supports MongoDB-style operators with clean syntax
 * Similar to Supabase/Appwrite query capabilities
 */
import mongoose from 'mongoose';

/**
 * Advanced Query Parser for MongoDB operations
 * Supports bracket syntax: field[operator]=value
 * Similar to Strapi/Directus query capabilities
 */
class QueryParser {
  constructor() {
    this.operators = {
      eq: '$eq',
      ne: '$ne',
      gt: '$gt',
      gte: '$gte',
      lt: '$lt',
      lte: '$lte',
      in: '$in',
      nin: '$nin',
      like: '$regex',
      contains: '$regex',
      regex: '$regex',
      exists: '$exists',
      size: '$size',
      type: '$type'
    };
  }
  
  /**
   * Parse request query parameters into MongoDB filters
   * @param {Object} query - Express req.query object
   * @returns {Object} - Parsed filters and pagination params
   */
  parseQuery(query) {
    const { page = 1, limit = 10, sort = '-createdAt', populate, search, ...filters } = query;

    return {
      filters: this._parseFilters(filters),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        skip: (parseInt(page, 10) - 1) * parseInt(limit, 10)
      },
      sort,
      populate,
      search
    };
  }
  
  /**
   * Parse standard filter parameter (filter[field]=value)
   */
  _parseFilters(filters) {
    const parsedFilters = {};

    for (const [key, value] of Object.entries(filters)) {
      // Skip non-filter parameters that are handled separately
      if (['page', 'limit', 'sort', 'populate', 'search', 'select', 'lean', 'includeDeleted'].includes(key)) {
        continue;
      }

      // Handle bracket syntax both shapes:
      // 1) field[operator]=value (Express default keeps key as string)
      const operatorMatch = key.match(/^(.+)\[(.+)\]$/);
      if (operatorMatch) {
        this._handleOperatorSyntax(parsedFilters, {}, operatorMatch, value);
        continue;
      }

      // 2) field[operator]=value parsed as object (qs or similar)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this._handleBracketSyntax(key, value, parsedFilters);
      } else {
        // Handle direct field assignment (e.g., upc=123)
        parsedFilters[key] = this._convertValue(value);
      }
    }

    return parsedFilters;
  }
  
  /**
   * Pick known pagination/query parameters
   */
  _pickKnownParams(query, knownParams) {
    const result = {};
    knownParams.forEach(param => {
      if (query[param] !== undefined) {
        result[param] = query[param];
      }
    });
    return result;
  }
  
  /**
   * Parse field-level operators (field[operator]=value)
   */
  _parseFieldOperators(query, knownParams) {
    const filters = {};
    const regexFields = {};
    
    Object.keys(query)
      .filter(key => !knownParams.includes(key))
      .forEach(key => {
        const operatorMatch = key.match(/^(.+)\[(.+)\]$/);
        
        if (operatorMatch) {
          this._handleOperatorSyntax(filters, regexFields, operatorMatch, query[key]);
        } else {
          // Check for legacy underscore syntax (field_operator)
          const legacyMatch = key.match(/^(.+)_(contains|like|gt|gte|lt|lte|ne|in|nin|exists|size)$/);
          
          if (legacyMatch) {
            const [, field, operator] = legacyMatch;
            this._handleOperatorSyntax(filters, regexFields, [key, field, operator], query[key]);
          } else {
            this._handleDirectSyntax(filters, key, query[key]);
          }
        }
      });
    
    return filters;
  }
  
  /**
   * Handle operator syntax: field[operator]=value
   */
  _handleOperatorSyntax(filters, regexFields, operatorMatch, value) {
    const [, field, operator] = operatorMatch;
    
    // Handle regex options separately
    if (operator.toLowerCase() === 'options' && regexFields[field]) {
      if (typeof filters[field] === 'object' && filters[field].$regex) {
        filters[field].$options = value;
      }
      return;
    }
    
    // Handle special operators that need custom processing in BaseService
    if (operator.toLowerCase() === 'contains' || operator.toLowerCase() === 'like') {
      if (typeof filters[field] !== 'object' || filters[field] === null || Array.isArray(filters[field])) {
        filters[field] = {};
      }
      // Keep the operator name without $ prefix for BaseService to handle
      filters[field][operator.toLowerCase()] = value;
      return;
    }
    
    // Convert to MongoDB operator for standard operators
    const mongoOperator = this._toMongoOperator(operator);
    
    if (mongoOperator === '$eq') {
      filters[field] = value; // Direct value for equality
    } else if (mongoOperator === '$regex') {
      filters[field] = { $regex: value };
      regexFields[field] = true;
    } else {
      // Handle other operators
      if (typeof filters[field] !== 'object' || filters[field] === null || Array.isArray(filters[field])) {
        filters[field] = {};
      }

      // Convert and assign value (let Mongoose cast by schema type)
      filters[field][mongoOperator] = this._convertValue(value);
    }
  }
  
  /**
   * Handle direct syntax: field=value
   */
  _handleDirectSyntax(filters, key, value) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Handle qs parsed objects like {eq: "val"}
      const keys = Object.keys(value);
      if (keys.length === 1) {
        const op = keys[0].toLowerCase();
        const opValue = value[keys[0]];
        
        // Handle special operators that need custom processing in BaseService
        if (op === 'contains' || op === 'like') {
          filters[key] = { [op]: opValue };
        } else if (op === 'eq') {
          filters[key] = opValue;
        } else {
          // Convert to MongoDB operator and apply value conversion
          const mongoOp = '$' + op;
          const convertedValue = this._convertValue(opValue);
          filters[key] = { [mongoOp]: convertedValue };
        }
      } else {
        filters[key] = value;
      }
    } else {
      filters[key] = value;
    }
  }
  
  /**
   * Convert operator to MongoDB format
   */
  _toMongoOperator(operator) {
    const op = operator.toLowerCase();
    return op.startsWith('$') ? op : '$' + op;
  }
  
  /**
   * Convert values based on operator type
   */
  _convertValue(value) {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map(v => this._convertValue(v));
    if (typeof value === 'object') return value;

    const stringValue = String(value);
    
    // Only convert specific known values
    if (stringValue === 'true') return true;
    if (stringValue === 'false') return false;

    // Convert ObjectIds only if they are valid 24-character hex strings
    // Use string representation instead of ObjectId object to avoid serialization issues
    if (mongoose.Types.ObjectId.isValid(stringValue) && stringValue.length === 24) {
      return stringValue; // Return as string, let Mongoose handle the conversion
    }

    // Return as string - this preserves UPCs, styleIds, and other string fields
    return stringValue;
  }

  _handleBracketSyntax(field, operators, parsedFilters) {
    if (!parsedFilters[field]) {
      parsedFilters[field] = {};
    }

    for (const [operator, value] of Object.entries(operators)) {
      if (this.operators[operator]) {
        const mongoOperator = this.operators[operator];
        let processedValue;

        // Operator-specific value processing is crucial for correctness.
        if (['gt', 'gte', 'lt', 'lte', 'size'].includes(operator)) {
          // These operators require a numeric value.
          processedValue = parseFloat(String(value));
          if (isNaN(processedValue)) continue; // Skip if value is not a valid number for the operator.
        } else if (operator === 'in' || operator === 'nin') {
          // These operators require an array.
          processedValue = Array.isArray(value) ? value : String(value).split(',').map(v => v.trim());
        } else if (operator === 'like' || operator === 'contains') {
          // These operators require a RegExp.
          processedValue = (value !== undefined && value !== null) ? new RegExp(String(value), 'i') : /.*/;
        } else {
          // Default processing for other operators like 'eq', 'ne'.
          processedValue = this._convertValue(value);
        }
        
        parsedFilters[field][mongoOperator] = processedValue;
      }
    }
  }

  // New: OR grouping and between helper
  parseOr(query) {
    const orArray = [];
    const raw = query?.or || query?.OR || query?.$or;
    if (!raw) return undefined;
    const items = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw) : [];
    for (const item of items) {
      if (typeof item === 'object' && item) {
        orArray.push(this._parseFilters(item));
      }
    }
    return orArray.length ? orArray : undefined;
  }

  enhanceWithBetween(filters) {
    const output = { ...filters };
    for (const [key, value] of Object.entries(filters || {})) {
      if (value && typeof value === 'object' && value.between) {
        const [from, to] = String(value.between).split(',');
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        const range = {};
        if (fromDate && !isNaN(fromDate)) range.$gte = fromDate;
        if (toDate && !isNaN(toDate)) range.$lte = toDate;
        output[key] = range;
        delete output[key].between;
      }
    }
    return output;
  }

  parseQuery(query) {
    const base = super.parseQuery ? super.parseQuery(query) : null;
    const { page = 1, limit = 10, sort = '-createdAt', populate, search, ...filters } = query || {};
    const parsed = {
      filters: this._parseFilters(filters),
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) },
      sort,
      populate,
      search,
    };
    const orGroup = this.parseOr(query);
    if (orGroup) parsed.filters = { ...(parsed.filters || {}), $or: orGroup };
    parsed.filters = this.enhanceWithBetween(parsed.filters);
    return parsed;
  }
}

export default new QueryParser(); 
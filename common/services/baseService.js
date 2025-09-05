// src/common/services/baseService.js
import mongoose from "mongoose";
import createError from "http-errors";

class BaseService {
  constructor(Model) {
    this.Model = Model;
    // Define lookup configurations for nested field filtering
    this.lookupConfigs = {};
  }

  /**
   * Configure lookup relationships for nested field filtering
   * @param {Object} configs - Lookup configurations
   * Example: { 'product.styleId': { from: 'products', localField: 'product', foreignField: '_id' } }
   */
  configureLookups(configs) {
    this.lookupConfigs = { ...this.lookupConfigs, ...configs };
  }

  async create(data, options = {}) {
    const { context = {} } = options;

    try {
      let payload = { ...data };

      const document = new this.Model(payload);
      await document.save({ session: options.session });

      return document;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getAll(queryParams, options = {}) {
    try {
      const {
        pagination = { page: 1, limit: 10 },
        search,
        sort = "-createdAt",
        filters = {},
      } = queryParams;

      const { page, limit } = pagination;

      const { context = {} } = options;

      // Check if we need aggregation for nested field filtering
      const needsAggregation = this._needsAggregation(filters);

      if (needsAggregation) {
        return this._getWithAggregation(queryParams, options);
      }

      // Use traditional query for simple filters
      let query = {};

      // Full-text search
      if (search) {
        query.$text = { $search: search };
      }

      // Apply additional filters
      if (filters) {
        query = { ...query, ...this._parseFilters(filters) };
      }

      const paginateOptions = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: this._parseSort(sort),
        populate: this._parsePopulate(options.populate),
        select: options.select,
        lean: options.lean || false,
        session: options.session,
      };

      if (typeof this.Model.paginate !== "function") {
        throw createError(500, `Model ${this.Model.modelName} is missing paginate() plugin. Please register mongoose-paginate-v2.`);
      }
      return this.Model.paginate(query, paginateOptions);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Enhanced getAll with aggregation pipeline support
   */
  async _getWithAggregation(queryParams, options = {}) {
    const {
      pagination = { page: 1, limit: 10 },
      search,
      sort = "-createdAt",
      filters = {},
    } = queryParams;

    const { page, limit } = pagination;

    const pipeline = [];
    const matchStage = {};

    // Handle lookups for nested field filtering
    const nestedFilters = {};
    const directFilters = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (key.includes(".") && this.lookupConfigs[key]) {
        nestedFilters[key] = value;
      } else {
        directFilters[key] = value;
      }
    });

    // Add direct filters to match stage
    if (Object.keys(directFilters).length > 0) {
      Object.assign(matchStage, this._parseFilters(directFilters));
    }

    // Full-text search
    if (search) {
      matchStage.$text = { $search: search };
    }

    // Add initial match stage if we have direct filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add lookups for nested field filtering
    const addedLookups = new Set();
    Object.entries(nestedFilters).forEach(([key, value]) => {
      const config = this.lookupConfigs[key];
      if (config && !addedLookups.has(config.from)) {
        pipeline.push({
          $lookup: {
            from: config.from,
            localField: config.localField,
            foreignField: config.foreignField,
            as: config.as || config.localField + "_lookup",
          },
        });
        addedLookups.add(config.from);
      }
    });

    // Add nested field filters
    const nestedMatchStage = {};
    Object.entries(nestedFilters).forEach(([key, value]) => {
      const config = this.lookupConfigs[key];
      if (config) {
        const lookupField = config.as || config.localField + "_lookup";
        const fieldPath = key.replace(
          config.localField + ".",
          lookupField + ".0."
        );
        nestedMatchStage[fieldPath] = this._parseFilterValue(value);
      }
    });

    if (Object.keys(nestedMatchStage).length > 0) {
      pipeline.push({ $match: nestedMatchStage });
    }

    // Add sorting
    pipeline.push({ $sort: this._parseSort(sort) });

    // Execute aggregation with pagination
    const aggregateOptions = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    if (typeof this.Model.aggregatePaginate !== "function") {
      throw createError(500, `Model ${this.Model.modelName} is missing aggregatePaginate() plugin. Please register mongoose-aggregate-paginate-v2.`);
    }
    return this.Model.aggregatePaginate(
      this.Model.aggregate(pipeline),
      aggregateOptions
    );
  }

  /**
   * Check if aggregation is needed based on filters
   */
  _needsAggregation(filters) {
    return Object.keys(filters).some(
      (key) => key.includes(".") && this.lookupConfigs[key]
    );
  }

  async getById(id, options = {}) {
    try {
      const document = await this._fetchById(id, options);
      if (!document) throw createError(404, "Document not found");
      return document;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getByQuery(query, options = {}) {
    try {
      const document = await this.Model.findOne(query)
        .populate(this._parsePopulate(options.populate))
        .select(options.select)
        .lean(options.lean)
        .session(options.session)
        .exec();
      if (!document) throw createError(404, "Document not found");
      return document;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getOrCreate(query, createData, options = {}) {
    try {
      const document = await this.Model.findOneAndUpdate(
        query, // Query to find existing document
        {
          $setOnInsert: createData, // Only set these fields if creating a new document
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return the updated/created document
          runValidators: true,
          session: options.session,
          ...options.mongoOptions, // Allow additional MongoDB options
        }
      )
        .populate(this._parsePopulate(options.populate))
        .select(options.select)
        .lean(options.lean || false);

      return document;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async update(id, data, options = {}) {
    const { context = {} } = options;

    try {
      const query = this.Model.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        session: options.session,
      });

      if (options.select) query.select(options.select);
      if (options.populate)
        query.populate(this._parsePopulate(options.populate));
      if (options.lean) query.lean();
      const document = await query.exec();
      if (!document) throw createError(404, "Document not found");

      return document;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async delete(id, options = {}) {
    const { context = {} } = options;

    try {
      const document = await this.Model.findByIdAndDelete(id)
        .session(options.session)
        .exec();

      if (!document) throw createError(404, "Document not found");

      return { success: true, message: "Deleted successfully" };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async deleteMany(query, options = {}) {
    const { context = {} } = options;

    try {
      const result = await this.Model.deleteMany(query).session(
        options.session
      );
      return {
        success: true,
        count: result.deletedCount,
        message: "Deleted successfully",
      };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Sub document handling
   */

  /**
   * Generic method to add a subdocument to a nested array
   * @param {string} parentId - ID of the parent document
   * @param {string} arrayPath - Path to the array (e.g., 'apis')
   * @param {Object} subData - Data for the new subdocument
   * @param {Object} options - Additional options (e.g., session)
   * @returns {Object} - The updated parent document and new subdocument ID
   */
  async addSubdocument(parentId, arrayPath, subData, options = {}) {
    try {
      const update = { $push: { [arrayPath]: subData } };
      const result = await this.Model.findByIdAndUpdate(parentId, update, {
        new: true,
        runValidators: true,
        session: options.session,
      }).exec();

      if (!result) {
        throw createError(404, "Parent document not found");
      }

      const newSub = result[arrayPath][result[arrayPath].length - 1];
      return { data: result, newSubId: newSub._id };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Generic method to get a subdocument from a nested array
   * @param {string} parentId - ID of the parent document
   * @param {string} arrayPath - Path to the array (e.g., 'apis')
   * @param {string} subId - ID of the subdocument
   * @param {Object} options - Additional options (e.g., lean, session)
   * @returns {Object} - The subdocument
   */
  async getSubdocument(parentId, arrayPath, subId, options = {}) {
    try {
      const parent = await this.Model.findById(parentId)
        .session(options.session)
        .exec();

      if (!parent) {
        throw createError(404, "Parent document not found");
      }

      const sub = parent[arrayPath].id(subId);
      if (!sub) {
        throw createError(404, "Subdocument not found");
      }

      return options.lean ? sub.toObject() : sub;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Generic method to update a subdocument in a nested array
   * @param {string} parentId - ID of the parent document
   * @param {string} arrayPath - Path to the array (e.g., 'apis')
   * @param {string} subId - ID of the subdocument
   * @param {Object} updateData - Data to update (will preserve _id)
   * @param {Object} options - Additional options (e.g., session)
   * @returns {Object} - The updated parent document
   */
  async updateSubdocument(
    parentId,
    arrayPath,
    subId,
    updateData,
    options = {}
  ) {
    try {
      const query = { _id: parentId, [`${arrayPath}._id`]: subId };
      const update = {
        $set: { [`${arrayPath}.$`]: { ...updateData, _id: subId } },
      };
      const result = await this.Model.findOneAndUpdate(query, update, {
        new: true,
        runValidators: true,
        session: options.session,
      }).exec();

      if (!result) {
        throw createError(404, "Parent or subdocument not found");
      }

      return result;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Generic method to delete a subdocument from a nested array
   * @param {string} parentId - ID of the parent document
   * @param {string} arrayPath - Path to the array (e.g., 'apis')
   * @param {string} subId - ID of the subdocument
   * @param {Function} [cascadeFn] - Optional async function for cascading deletes (receives subId)
   * @param {Object} options - Additional options (e.g., session)
   * @returns {Object} - The updated parent document
   */
  async deleteSubdocument(
    parentId,
    arrayPath,
    subId,
    cascadeFn = null,
    options = {}
  ) {
    try {
      if (cascadeFn) {
        await cascadeFn(subId);
      }

      const update = { $pull: { [arrayPath]: { _id: subId } } };
      const result = await this.Model.findByIdAndUpdate(parentId, update, {
        new: true,
        session: options.session,
      }).exec();

      if (!result) {
        throw createError(404, "Parent document not found");
      }

      return result;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Generic method to fetch a document by ID
   * @param {string} id - ID of the document
   * @param {Object} options - Additional options (e.g., populate, select, lean, session)
   * @returns {Object} - The document
   */
  async _fetchById(id, options = {}) {
    console.log(`Fetching document by ID: ${id}`);
    return this.Model.findById(id)
      .populate(this._parsePopulate(options.populate))
      .select(options.select)
      .lean(options.lean)
      .session(options.session)
      .exec();
  }

  _parseSort(sort) {
    if (!sort) return { createdAt: -1 };
    const sortOrder = sort.startsWith("-") ? -1 : 1;
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;
    return { [sortField]: sortOrder };
  }

  _parsePopulate(populate) {
    if (!populate) return [];
    if (typeof populate === "string") {
      return populate.split(",").map((p) => p.trim());
    }
    if (Array.isArray(populate)) {
      return populate.map((p) => (typeof p === "string" ? p.trim() : p));
    }
    return [populate];
  }

  _parseFilters(filters) {
    const parsedFilters = {};
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key)) {
        const value = filters[key];
        parsedFilters[key] = this._parseFilterValue(value);
      }
    }
    return parsedFilters;
  }

  _parseFilterValue(value) {
    // Handle special naming convention for partial matching
    if (typeof value === "string") {
      return value;
    }

    // Handle operator-based queries (e.g., { $gt: 100 })
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const processedValue = {};

      for (const [operator, operatorValue] of Object.entries(value)) {
        if (operator === "contains") {
          // Convert 'contains' to MongoDB $regex
          processedValue.$regex = operatorValue;
          processedValue.$options = "i"; // Case insensitive by default
        } else if (operator === "like") {
          // Convert 'like' to MongoDB $regex (case insensitive)
          processedValue.$regex = operatorValue;
          processedValue.$options = "i";
        } else {
          // Pass through other operators as-is
          processedValue[operator.startsWith("$") ? operator : "$" + operator] =
            operatorValue;
        }
      }

      return processedValue;
    }

    return value;
  }

  _handleError(error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      return createError(400, `Validation Error: ${messages.join(", ")}`);
    }
    if (error instanceof mongoose.Error.CastError) {
      return createError(400, `Invalid ${error.path}: ${error.value}`);
    }
    if (error.status && error.message) {
      return error;
    }
    return createError(500, error.message || "Internal Server Error");
  }

  // Transaction methods
  async startTransaction() {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  }

  async commitTransaction(session) {
    await session.commitTransaction();
    session.endSession();
  }

  async abortTransaction(session) {
    await session.abortTransaction();
    session.endSession();
  }
}

export default BaseService;

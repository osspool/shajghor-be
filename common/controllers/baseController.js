// src/common/controllers/baseController.js
import QueryParser from '#common/utils/queryParser.js';


class BaseController {
  constructor(service) {
    this.service = service;
    
    // Bind methods for use as route handlers (Express 5 handles async rejections)
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res) {
    const options = this._buildOptions(req);
    // Multi-tenant default scoping for non-superadmin
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : (req.user?.roles ? [req.user.roles] : []);
    const isSuperAdmin = roles.includes('superadmin');
    if (!isSuperAdmin && req.context?.organizationId && req.body && !req.body.organizationId) {
      req.body.organizationId = req.context.organizationId;
    }
    const document = await this.service.create(req.body, options);
    res.status(201).json({ success: true, data: document });
  }

  async getAll(req, res) {
    // Parse query parameters using the dedicated parser (prefer validated)
    const rawQuery = (req.validated && req.validated.query) ? req.validated.query : req.query;
    const queryParams = QueryParser.parseQuery(rawQuery);
    const options = this._buildOptions(req);
    // Scope by organization for non-superadmin
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : (req.user?.roles ? [req.user.roles] : []);
    const isSuperAdmin = roles.includes('superadmin');
    if (!isSuperAdmin && req.context?.organizationId) {
      queryParams.filters = { ...(queryParams.filters || {}), organizationId: req.context.organizationId };
    }
    // Parlour-level scoping if present
    if (req.context?.parlourId) {
      queryParams.filters = { ...(queryParams.filters || {}), parlourId: req.context.parlourId };
    }
    const result = await this.service.getAll(queryParams, options);
    res.status(200).json({ success: true, ...result });
  }

  async getById(req, res) {
    const options = this._buildOptions(req);
    const document = await this.service.getById(req.params.id, options);
    res.status(200).json({ success: true, data: document });
  }

  async getByQuery(req, res) {
    const options = this._buildOptions(req);
    const document = await this.service.getByQuery(req.query, options);
    res.status(200).json({ success: true, data: document });
  }

  async update(req, res) {
    const options = this._buildOptions(req);
    // Preserve org scoping for non-superadmin when setting missing orgId
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : (req.user?.roles ? [req.user.roles] : []);
    const isSuperAdmin = roles.includes('superadmin');
    if (!isSuperAdmin && req.context?.organizationId && req.body && !req.body.organizationId) {
      req.body.organizationId = req.context.organizationId;
    }
    const document = await this.service.update(req.params.id, req.body, options);
    res.status(200).json({ success: true, data: document });
  }

  async delete(req, res) {
    const options = this._buildOptions(req);
    const result = await this.service.delete(req.params.id, options);
    res.status(200).json(result);
  }

  // Helper method to build common options
  _buildOptions(req) {
    return {
      context: { user: req.user, ...req.context } || {},
      user: req.user,
      select: (req.validated?.query?.select) || req.query.select,
      populate: (req.validated?.query?.populate) || req.query.populate,
      lean: ((req.validated?.query?.lean) || req.query.lean) === 'true',
      includeDeleted: ((req.validated?.query?.includeDeleted) || req.query.includeDeleted) === 'true',
    };
  }
}

export default BaseController;
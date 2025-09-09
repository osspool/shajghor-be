// config/permissions.js
// Central role → permissions mapping per resource and operation
// Operations: list, get, create, update, remove

const permissions = {
  // Users
  users: {
    list: ['admin', 'manager', 'superadmin'],
    get: ['admin', 'manager', 'superadmin'],
    create: ['admin', 'superadmin'],
    update: ['admin', 'superadmin'],
    remove: ['admin'],
  },
  // Organizations
  organizations: {
    list: ['admin'],
    get: ['admin'],
    create: ['admin'],
    update: ['admin'],
    remove: ['admin'],
  },
  // Parlours
  parlours: {
    list: [], // public can list
    get: [],  // public can view
    create: ['admin', 'superadmin'],
    update: ['admin', 'manager', 'superadmin'],
    remove: ['admin'],
  },
  // Services
  services: {
    list: [],
    get: [],
    create: ['admin', 'manager'],
    update: ['admin', 'manager'],
    remove: ['admin'],
  },
  // Customers (CRM)
  customers: {
    list: ['admin', 'manager'],
    get: ['admin', 'manager'],
    create: [], // allow public creation during booking
    update: ['admin', 'manager'],
    remove: ['admin'],
  },
  // Bookings
  bookings: {
    list: [],
    get: [],
    create: [],
    update: ['admin', 'manager'],
    remove: ['admin'],
    availability: [], // public availability
  },
  // Transactions
  transactions: {
    list: ['admin', 'manager'],
    get: ['admin', 'manager'],
    create: ['admin', 'manager'],
    update: ['admin', 'manager'],
    remove: ['admin'],
  },
  // Subscriptions
  subscriptions: {
    list: ['admin'],
    get: ['admin'],
    create: ['admin'],
    update: ['admin'],
    remove: ['admin'],
  },
  // Archives
  archives: {
    list: ['admin'],
    get: ['admin'],
    create: ['admin'],
    update: ['admin'],
    remove: ['admin'],
  },
  analytics: {
    overview: ['admin', 'manager', 'superadmin'],

  },
  export: {
    any: ['admin', 'manager', 'superadmin'],
  }
};

export default permissions;



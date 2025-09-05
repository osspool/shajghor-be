// Common enums and constants used across the application



// Status enums - used in job processing and other status tracking
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const STATUS_VALUES = Object.values(STATUS);

// Job types - used in job queue system
export const JOB_TYPES = {
  // reserved for future use
};

export const JOB_TYPE_VALUES = Object.values(JOB_TYPES);

// Employee roles for parlour staffing
export const EMPLOYEE_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  CASHIER: 'cashier',
  STYLIST: 'stylist',
  BARBER: 'barber',
  BEAUTICIAN: 'beautician',
  THERAPIST: 'therapist',
  MAKEUP_ARTIST: 'makeup_artist',
  NAIL_TECHNICIAN: 'nail_technician',
  ASSISTANT: 'assistant',
  EMPLOYEE: 'employee',
};

export const EMPLOYEE_ROLE_VALUES = Object.values(EMPLOYEE_ROLES);

// Transactions
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPES);

export const TRANSACTION_CATEGORIES = {
  BOOKING: 'booking',
  OTHER: 'other',
  CAPITAL_INJECTION: 'capital_injection',
  OWNER_WITHDRAWAL: 'owner_withdrawal',
  REFUND: 'refund',
  SALARY: 'salary',
  PLATFORM_FEES: 'platform_fees',
  CASH_ADJUSTMENT: 'cash_adjustment',
};

export const TRANSACTION_CATEGORY_VALUES = Object.values(TRANSACTION_CATEGORIES);

// Export commonly used constants
export const CONSTANTS = {

  STATUS,
  STATUS_VALUES,
  JOB_TYPES,
  JOB_TYPE_VALUES,
  EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_VALUES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_VALUES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_VALUES,
};

export default CONSTANTS; 
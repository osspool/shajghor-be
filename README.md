# HRM Backend API

A powerful, extensible Human Resource Management system built with Express 5, MongoDB, and modern JavaScript practices.

## Features

### Core Capabilities
- **Authentication & RBAC**: Role-based access control with roles (superadmin, admin, manager, hr, employee)
- **Employee Management**: Complete employee profiles with department and manager relationships
- **Attendance Tracking**: Check-in/out, breaks, out-of-office tracking with device integration
- **Shift Management**: Shift definitions and assignments with status tracking
- **Leave Management**: Leave types, requests, approvals with balance tracking
- **Payroll**: Adjustments and payroll runs with approval workflow
- **Device Integration**: Webhook support for biometric devices (face/card readers)
- **Audit Logging**: Complete audit trail for all write operations

### Technical Features
- **Express 5 Native**: Leverages built-in async error handling
- **Factory Pattern**: Minimal code with powerful CRUD generation
- **Advanced Filtering**: MongoDB operators, nested filters, aggregations
- **Pagination**: Consistent pagination with mongoose-paginate-v2
- **Validation**: Zod schemas for request validation
- **Data-driven RBAC**: Centralized permissions configuration

## Architecture

### Design Principles
- **SOLID Principles**: Single responsibility services, dependency injection
- **DRY**: Reusable base classes and factories
- **Clean Architecture**: Separation of concerns with models, services, controllers, routes
- **Factory Pattern**: Generic CRUD generation with customization points

### Project Structure
```
hrm_be/
├── common/
│   ├── controllers/
│   │   └── baseController.js      # Generic CRUD controller
│   ├── services/
│   │   └── baseService.js         # Generic CRUD service with filtering
│   ├── middlewares/
│   │   ├── authMiddleware.js      # JWT auth & role authorization
│   │   ├── auditMiddleware.js     # Audit logging
│   │   └── validate.js            # Zod validation
│   └── utils/
│       └── queryParser.js         # Advanced query parsing
├── config/
│   ├── permissions.js             # Centralized RBAC configuration
│   └── index.js                   # Configuration management
├── modules/
│   ├── employee/                  # Employee module
│   │   ├── employee.model.js
│   │   ├── schemas.js
│   │   └── routes.js
│   ├── attendance/                # Attendance & time clock
│   │   ├── attendance.model.js
│   │   ├── attendanceEvent.model.js
│   │   ├── services/
│   │   │   └── timeClockService.js
│   │   └── routes.js
│   ├── shift/                     # Shift management
│   │   ├── shift.model.js
│   │   ├── shiftAssignment.model.js
│   │   └── routes.js
│   ├── leave/                     # Leave management
│   │   ├── leaveType.model.js
│   │   ├── leaveRequest.model.js
│   │   ├── services/
│   │   │   └── leaveApprovalService.js
│   │   └── routes.js
│   ├── payroll/                   # Payroll management
│   │   ├── adjustment.model.js
│   │   ├── run.model.js
│   │   └── routes.js
│   └── device/                    # Device integration
│       └── device.routes.js
└── routes/
    ├── utils/
    │   ├── createCrudRouter.js    # CRUD route factory
    │   └── serviceControllerFactory.js
    └── routes.index.js             # Central routing

```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/user` - Get current user
- `PATCH /api/auth/user` - Update user profile

### Employees
- `GET /api/employees` - List employees (with filters)
- `GET /api/employees/:id` - Get employee
- `POST /api/employees` - Create employee
- `PATCH /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance/time-clock` - Clock in/out, breaks
- `GET /api/attendance/:id/events` - Get attendance events

### Shifts
- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift
- CRUD operations for shift assignments

### Leaves
- `GET /api/leaves/types` - List leave types
- `GET /api/leaves/requests` - List leave requests
- `POST /api/leaves/requests` - Submit leave request
- `POST /api/leaves/requests/:id/approve` - Approve request
- `POST /api/leaves/requests/:id/reject` - Reject request
- `GET /api/leaves/balance/:employeeId` - Get leave balance

### Payroll
- `GET /api/payroll/adjustments` - List adjustments
- `POST /api/payroll/adjustments` - Create adjustment
- `GET /api/payroll/runs` - List payroll runs
- `POST /api/payroll/runs` - Create payroll run

### Device Integration
- `POST /api/integrations/device/webhook` - Device event webhook

## Query Filtering

The API supports advanced filtering using MongoDB operators:

### Basic Filters
```
GET /api/employees?department=HR&status=active
```

### Operators
```
GET /api/attendance?date[gte]=2024-01-01&date[lte]=2024-01-31
GET /api/employees?name[contains]=john
GET /api/leaves/requests?status[in]=pending,approved
```

### Supported Operators
- `eq` - Equal (default)
- `ne` - Not equal
- `gt`, `gte`, `lt`, `lte` - Comparison
- `in`, `nin` - In/Not in array
- `contains`, `like` - Partial match (case-insensitive)
- `exists` - Field exists
- `size` - Array size

### Pagination & Sorting
```
GET /api/employees?page=2&limit=20&sort=-createdAt
```

## Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/hrm

# Auth
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Device Integration
DEVICE_WEBHOOK_SECRET=shared-secret-for-devices

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
EMAIL_FROM=noreply@company.com
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`

3. Run the application:
```bash
npm run dev  # Development
npm start    # Production
```

## Extending the System

### Adding a New Module

1. Create model with pagination plugins:
```javascript
// modules/mymodule/mymodel.model.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const schema = new mongoose.Schema({...});
schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

export default mongoose.model('MyModel', schema);
```

2. Create Zod schemas:
```javascript
// modules/mymodule/schemas.js
import { z } from 'zod';
export const createSchema = z.object({...});
```

3. Create routes with factory:
```javascript
// modules/mymodule/routes.js
import createCrudRouter from '#routes/utils/createCrudRouter.js';
import { createServiceAndController } from '#routes/utils/serviceControllerFactory.js';

const { controller } = createServiceAndController(MyModel);
router.use('/', createCrudRouter(controller, {
  auth: permissions.mymodule,
  schemas: {...}
}));
```

4. Add permissions in `config/permissions.js`

5. Mount routes in `routes/routes.index.js`

### Adding Custom Business Logic

Create domain services following single responsibility:
```javascript
// modules/mymodule/services/myService.js
class MyService {
  async customBusinessLogic() {
    // Implementation
  }
}
export default new MyService();
```

## Testing

```bash
# Run tests (to be implemented)
npm test
```

## Security Features

- JWT-based authentication
- Role-based access control
- Request validation with Zod
- Audit logging for all write operations
- Shared secret for device webhooks
- Password hashing with bcrypt
- MongoDB injection prevention

## Performance

- Indexed database queries
- Pagination on all list endpoints
- Aggregation pipeline for complex queries
- Lean queries where appropriate
- Connection pooling

## License

MIT
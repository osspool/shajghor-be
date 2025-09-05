import BaseService from '#common/services/baseService.js';
import Transaction from '#modules/transaction/transaction.model.js';
import Employee from './employee.model.js';

class EmployeeService extends BaseService {
  constructor(model = Employee) {
    super(model);
  }

  async paySalary(employeeId, payload = {}, options = {}) {
    const session = options.session;
    const employee = await this.Model.findById(employeeId).session(session);
    if (!employee) {
      throw this._handleError({ status: 404, message: 'Employee not found' });
    }

    const amount = payload.amount != null ? payload.amount : (employee.salaryAmount || 0);
    const method = payload.method || 'cash';
    const notes = payload.notes || employee.salaryNotes;

    // Create expense transaction
    await Transaction.create([{
      organizationId: options.context?.organizationId,
      parlourId: employee.parlourId,
      type: 'expense',
      category: 'salary',
      amount,
      method,
      reference: payload.reference,
      notes: notes || `Salary paid to employee ${employee.userId}`,
      date: new Date(),
    }], { session });

    // Update last salary paid timestamp
    employee.lastSalaryPaidAt = new Date();
    await employee.save({ session });

    return { success: true, lastSalaryPaidAt: employee.lastSalaryPaidAt };
  }
}

const employeeService = new EmployeeService();
export default employeeService;
export { EmployeeService };



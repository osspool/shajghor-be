import mongoose from 'mongoose';
import { EMPLOYEE_ROLE_VALUES } from '#common/constants/enums.js';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const employeeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  parlourId: { type: Schema.Types.ObjectId, ref: 'Parlour', required: true },
  role: { type: String, enum: EMPLOYEE_ROLE_VALUES, default: 'employee' },
  title: { type: String },
  active: { type: Boolean, default: true },
  // Salary fields
  salaryAmount: { type: Number, default: 0, min: 0 },
  salaryCurrency: { type: String, default: 'BDT' },
  lastSalaryPaidAt: { type: Date },
  salaryNotes: { type: String },
}, { timestamps: true });

employeeSchema.index({ parlourId: 1, userId: 1 }, { unique: true });

employeeSchema.plugin(mongoosePaginate);
employeeSchema.plugin(aggregatePaginate);

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;



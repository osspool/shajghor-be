import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { STATUS_VALUES, JOB_TYPE_VALUES } from '#common/constants/enums.js';

const jobSchema = new mongoose.Schema({
  type: {
      type: String,
      required: true,
      enum: JOB_TYPE_VALUES,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "organization",
},
  lastRun: {
    type: Date,
    default: null
  },
  status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'pending'
  },
  metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
  },
  error: String,
  startedAt: Date,
  completedAt: Date,
}, {
  timestamps: true
});


jobSchema.index({ type: 1, organization: 1, status: 1 });
// This will delete documents 7 days after their creation




// Plugins for standardized pagination
jobSchema.plugin(mongoosePaginate);
jobSchema.plugin(aggregatePaginate);

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export default Job;

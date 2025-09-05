import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    address: {type: String},
    // Updated roles for HRM system
    roles: { 
      type: [String], 
      enum: ['superadmin', 'admin', 'employee', 'user'], 
      default: ['user'] 
    },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Vendor data (legacy - can be removed if not needed)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor"
    }
  },
  { timestamps: true }
);

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Automatically exclude password and sensitive fields when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

// Also exclude password when converting to Object
userSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

export default mongoose.model('User', userSchema);
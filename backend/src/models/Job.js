import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    company: { type: String, default: '' },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'active',
    },
    skills: [{ type: String }],
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    experienceLevel: { type: String, default: '' },
    location: { type: String, default: '' },
    remote: { type: String, enum: ['remote', 'onsite', 'hybrid', ''], default: '' },
    deadline: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ recruiterId: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

export const Job = mongoose.model('Job', jobSchema);

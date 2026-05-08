import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeDocument' },
    status: {
      type: String,
      enum: ['submitted', 'shortlisted', 'rejected'],
      default: 'submitted',
    },
    matchScore: { type: Number },
    matchMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });

export const Application = mongoose.model('Application', applicationSchema);

import mongoose from 'mongoose';

const resumeDocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    storedPath: { type: String, required: true },
    mimeType: { type: String, required: true },
    parsedData: { type: mongoose.Schema.Types.Mixed },
    atsScore: { type: Number },
    atsMeta: { type: mongoose.Schema.Types.Mixed },
    lastAnalysis: { type: mongoose.Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

resumeDocumentSchema.index({ userId: 1 });

export const ResumeDocument = mongoose.model('ResumeDocument', resumeDocumentSchema);

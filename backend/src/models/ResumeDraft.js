import mongoose from 'mongoose';

const emptySections = () => ({
  personal: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    summary: '',
  },
  education: [],
  skills: [],
  experience: [],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
  social: { linkedin: '', github: '', website: '' },
});

const resumeDraftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: {
      type: String,
      enum: ['ats', 'modern', 'minimal'],
      default: 'ats',
    },
    sectionOrder: {
      type: [String],
      default: [
        'personal',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'achievements',
        'languages',
        'social',
      ],
    },
    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: emptySections,
    },
    completeness: { type: Number, default: 0 },
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resumeDraftSchema.index({ userId: 1 }, { unique: true });

export const ResumeDraft = mongoose.model('ResumeDraft', resumeDraftSchema);

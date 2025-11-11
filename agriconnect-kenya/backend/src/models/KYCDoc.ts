import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';
import User from './User';

export type DocumentType = 'national_id' | 'passport' | 'driving_license' | 'business_permit';
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'expired';

export interface IKYCDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  documentType: DocumentType;

  frontImage: {
    url: string;
    key: string; // encrypted at rest
    uploadedAt?: Date;
  };
  backImage?: {
    url?: string;
    key?: string; // encrypted at rest
    uploadedAt?: Date;
  };

  documentNumber?: string;
  fullName?: string;
  dateOfBirth?: Date;
  expiryDate?: Date;

  verificationStatus: VerificationStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;

  verificationChecks: {
    photoQualityClear: boolean;
    documentNumberMatches: boolean;
    nameMatches: boolean;
    notExpired: boolean;
    noTampering: boolean;
  };

  submissionCount: number;
  previousSubmissions: { submittedAt?: Date; rejectionReason?: string }[];

  submittedAt?: Date;
  updatedAt?: Date;

  // instance helpers
  isExpired(): boolean;
  verify(adminId: mongoose.Types.ObjectId, notes?: string): Promise<IKYCDoc>;
  reject(adminId: mongoose.Types.ObjectId, reason: string, notes?: string): Promise<IKYCDoc>;
  getFrontKeyPlain(): string | null;
  getBackKeyPlain(): string | null;
}

export interface IKYCDocModel extends mongoose.Model<IKYCDoc> {
  getPendingCount(): Promise<number>;
}

const kycDocSchema = new mongoose.Schema<IKYCDoc, IKYCDocModel>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    documentType: {
      type: String,
      enum: ['national_id', 'passport', 'driving_license', 'business_permit'],
      required: true,
      default: 'national_id'
    },

    frontImage: {
      url: { type: String, required: true },
      key: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    },

    backImage: {
      url: String,
      key: String,
      uploadedAt: Date
    },

    documentNumber: String,
    fullName: String,
    dateOfBirth: Date,
    expiryDate: Date,

    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected', 'expired'],
      default: 'pending'
    },

    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    rejectionReason: String,
    adminNotes: String,

    verificationChecks: {
      photoQualityClear: { type: Boolean, default: false },
      documentNumberMatches: { type: Boolean, default: false },
      nameMatches: { type: Boolean, default: false },
      notExpired: { type: Boolean, default: false },
      noTampering: { type: Boolean, default: false }
    },

    submissionCount: { type: Number, default: 1 },

    previousSubmissions: [
      {
        submittedAt: Date,
        rejectionReason: String
      }
    ],

    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // never expose encrypted keys in API responses
        if (ret.frontImage) {
          delete ret.frontImage.key;
        }
        if (ret.backImage) {
          delete ret.backImage.key;
        }
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
kycDocSchema.index({ userId: 1, documentType: 1 });
kycDocSchema.index({ verificationStatus: 1 });
kycDocSchema.index({ verifiedBy: 1 });
kycDocSchema.index({ submittedAt: -1 });

// Virtual to populate user
kycDocSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware: encrypt S3 keys if not already encrypted and update timestamps
kycDocSchema.pre<IKYCDoc>('save', function (next) {
  // encrypt frontImage.key if looks plaintext (simple heuristic: no ':' separator)
  try {
    if (this.frontImage && this.frontImage.key && !this.frontImage.key.includes(':')) {
      this.frontImage.key = encrypt(this.frontImage.key);
    }
  } catch (err) {
    // if encryption fails, allow save to fail upstream
    return next(err as any);
  }

  try {
    if (this.backImage && this.backImage.key && !this.backImage.key.includes(':')) {
      this.backImage.key = encrypt(this.backImage.key);
    }
  } catch (err) {
    return next(err as any);
  }

  this.updatedAt = new Date();
  next();
});

// Instance method: check expiry
kycDocSchema.methods.isExpired = function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Helper to get decrypted keys (used server-side only)
kycDocSchema.methods.getFrontKeyPlain = function () {
  if (!this.frontImage || !this.frontImage.key) return null;
  try {
    return decrypt(this.frontImage.key);
  } catch (_err) {
    return null;
  }
};
kycDocSchema.methods.getBackKeyPlain = function () {
  if (!this.backImage || !this.backImage.key) return null;
  try {
    return decrypt(this.backImage.key);
  } catch (_err) {
    return null;
  }
};

// Instance method: verify document (admin)
kycDocSchema.methods.verify = async function (adminId: mongoose.Types.ObjectId, notes = '') {
  this.verificationStatus = 'verified';
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.adminNotes = notes;

  // Update associated user KYC status
  try {
    await User.findByIdAndUpdate(this.userId, { kycStatus: 'kyc_verified', status: 'active' }, { new: true });
  } catch (_err) {
    // carry on; calling code should handle inconsistencies
  }

  return this.save();
};

// Instance method: reject document (admin)
kycDocSchema.methods.reject = async function (adminId: mongoose.Types.ObjectId, reason: string, notes = '') {
  this.verificationStatus = 'rejected';
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.rejectionReason = reason;
  this.adminNotes = notes;

  this.previousSubmissions = this.previousSubmissions || [];
  this.previousSubmissions.push({
    submittedAt: this.submittedAt,
    rejectionReason: reason
  });

  this.submissionCount = (this.submissionCount || 1) + 1;

  // Update associated user KYC status
  try {
    await User.findByIdAndUpdate(this.userId, { kycStatus: 'rejected', kycRejectionReason: reason }, { new: true });
  } catch (_err) {
    // ignore
  }

  return this.save();
};

// Static: pending count
kycDocSchema.statics.getPendingCount = function () {
  return this.countDocuments({
    verificationStatus: { $in: ['pending', 'under_review'] }
  }).exec();
};

const KYCDoc = mongoose.model<IKYCDoc, IKYCDocModel>('KYCDoc', kycDocSchema);

export default KYCDoc;
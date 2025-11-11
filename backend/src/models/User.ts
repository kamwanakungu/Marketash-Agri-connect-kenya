import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/encryption';

export interface IUser extends mongoose.Document {
  phone: string;
  email: string;
  nationalIdEncrypted: string;
  nationalIdHash: string;
  // Add virtual/plain accessor for decrypted national id (optional)
  nationalId?: string | null;

  passwordHash?: string | null;
  role: 'farmer' | 'buyer' | 'driver' | 'admin' | 'cooperative_manager';
  status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  kycStatus: 'pending' | 'submitted' | 'kyc_verified' | 'rejected';
  kycRejectionReason?: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  otpAttempts: number;
  lastOtpSentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  // instance methods
  canTransact(): boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getDecryptedNationalId(): string | null;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findByNationalId(nationalId: string): Promise<IUser | null>;
}

const userSchema = new mongoose.Schema<IUser, IUserModel>(
  {
    phone: {
      type: String,
      required: [true, 'Safaricom phone number is required'],
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^254[71]\d{8}$/.test(v);
        },
        message: 'Invalid Safaricom phone number format (e.g., 254712345678)'
      }
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    nationalIdEncrypted: {
      type: String,
      required: [true, 'Kenyan National ID is required']
    },
    nationalIdHash: {
      type: String,
      unique: true,
      required: true
    },
    passwordHash: { type: String, default: null },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'driver', 'admin', 'cooperative_manager'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'pending_verification'],
      default: 'pending_verification'
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'submitted', 'kyc_verified', 'rejected'],
      default: 'pending'
    },
    kycRejectionReason: { type: String, default: null },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: Date,
    refreshTokens: { type: [String], default: [] },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.nationalIdEncrypted;
        delete ret.nationalIdHash;
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ nationalIdHash: 1 });
userSchema.index({ kycStatus: 1, status: 1 });
userSchema.index({ role: 1 });

// Virtual for profile relationship
userSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Virtual for decrypted National ID (read-only)
userSchema.virtual('nationalId').get(function (this: IUser) {
  if (this.nationalIdEncrypted) {
    try {
      return decrypt(this.nationalIdEncrypted);
    } catch (_err) {
      return null;
    }
  }
  return null;
});

// Instance method: return decrypted national id (explicit)
userSchema.methods.getDecryptedNationalId = function (this: IUser) {
  try {
    return this.nationalIdEncrypted ? decrypt(this.nationalIdEncrypted) : null;
  } catch (_err) {
    return null;
  }
};

// Pre-save middleware to encrypt National ID and hash it, and to hash password
userSchema.pre<IUser>('save', async function (next) {
  try {
    // National ID handling: if modified and appears plaintext (no ':' separator)
    if (this.isModified('nationalIdEncrypted') && this.nationalIdEncrypted) {
      if (!this.nationalIdEncrypted.includes(':')) {
        // compute hash on plaintext then encrypt
        const nidHash = crypto.createHash('sha256').update(this.nationalIdEncrypted, 'utf8').digest('hex');
        this.nationalIdHash = nidHash;
        this.nationalIdEncrypted = encrypt(this.nationalIdEncrypted);
      } else {
        // If already encrypted, ensure hash exists (attempt to derive by decrypt)
        if (!this.nationalIdHash) {
          try {
            const plain = decrypt(this.nationalIdEncrypted);
            this.nationalIdHash = crypto.createHash('sha256').update(plain, 'utf8').digest('hex');
          } catch (_) {
            // ignore
          }
        }
      }
    }

    // Password hashing: if modified and not a bcrypt hash, hash it
    if (this.isModified('passwordHash') && this.passwordHash) {
      if (!this.passwordHash.startsWith('$2')) {
        const rounds = 12;
        this.passwordHash = await bcrypt.hash(this.passwordHash, rounds);
      }
    }

    next();
  } catch (err) {
    next(err as any);
  }
});

// Instance method: permission to transact
userSchema.methods.canTransact = function (this: IUser) {
  return this.kycStatus === 'kyc_verified' && this.status === 'active' && this.isPhoneVerified === true;
};

// Instance method: compare password
userSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method: find by national ID (plaintext)
userSchema.statics.findByNationalId = async function (nationalId: string) {
  const hash = crypto.createHash('sha256').update(nationalId, 'utf8').digest('hex');
  return this.findOne({ nationalIdHash: hash });
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
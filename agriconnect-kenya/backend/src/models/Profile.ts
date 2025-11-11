import mongoose from 'mongoose';

export interface IOperatingHoursDay {
  open?: string;
  close?: string;
}

export interface IProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  fullNames: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
    country?: string;
  };
  farmName?: string;
  farmSize?: { value?: number; unit?: 'acres' | 'hectares' };
  farmingType?: 'crops' | 'livestock' | 'mixed' | 'organic';
  primaryProducts?: string[];
  businessName?: string;
  businessType?: 'retailer' | 'wholesaler' | 'restaurant' | 'processor' | 'exporter' | 'individual';
  businessRegistrationNumber?: string;
  cooperativeName?: string;
  cooperativeRegistrationNumber?: string;
  numberOfMembers?: number;
  vehicleType?: 'motorcycle' | 'pickup' | 'van' | 'truck';
  vehicleRegistration?: string;
  licenseNumber?: string;
  maxCapacityKg?: number;
  profilePicture?: { url?: string; key?: string };
  bio?: string;
  operatingHours?: {
    monday?: IOperatingHoursDay;
    tuesday?: IOperatingHoursDay;
    wednesday?: IOperatingHoursDay;
    thursday?: IOperatingHoursDay;
    friday?: IOperatingHoursDay;
    saturday?: IOperatingHoursDay;
    sunday?: IOperatingHoursDay;
  };
  socialLinks?: { facebook?: string; twitter?: string; instagram?: string; website?: string };
  averageRating?: number;
  totalReviews?: number;
  stats?: {
    totalOrders?: number;
    completedOrders?: number;
    totalSales?: number;
    totalPurchases?: number;
    totalDeliveries?: number;
  };
  isProfileComplete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // methods
  distanceFrom(longitude: number, latitude: number): number;
}

const profileSchema = new mongoose.Schema<IProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    fullNames: {
      type: String,
      required: [true, 'Full legal names are required'],
      trim: true,
      minlength: [3, 'Full names must be at least 3 characters'],
      maxlength: [100, 'Full names must not exceed 100 characters']
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: function (v: number[]) {
            return v && v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates format [longitude, latitude]'
        }
      }
    },

    address: {
      street: String,
      city: String,
      county: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Kenya'
      }
    },

    farmName: { type: String, trim: true },

    farmSize: {
      value: Number,
      unit: { type: String, enum: ['acres', 'hectares'] }
    },

    farmingType: { type: String, enum: ['crops', 'livestock', 'mixed', 'organic'] },

    primaryProducts: [String],

    businessName: { type: String, trim: true },

    businessType: {
      type: String,
      enum: ['retailer', 'wholesaler', 'restaurant', 'processor', 'exporter', 'individual']
    },

    businessRegistrationNumber: String,

    cooperativeName: String,
    cooperativeRegistrationNumber: String,
    numberOfMembers: Number,

    vehicleType: { type: String, enum: ['motorcycle', 'pickup', 'van', 'truck'] },
    vehicleRegistration: String,
    licenseNumber: String,
    maxCapacityKg: Number,

    profilePicture: {
      url: String,
      key: String
    },

    bio: { type: String, maxlength: [500, 'Bio must not exceed 500 characters'] },

    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },

    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      website: String
    },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    stats: {
      totalOrders: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      totalPurchases: { type: Number, default: 0 },
      totalDeliveries: { type: Number, default: 0 }
    },

    isProfileComplete: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Geospatial index
profileSchema.index({ location: '2dsphere' });
profileSchema.index({ userId: 1 });
profileSchema.index({ farmName: 1 });
profileSchema.index({ businessName: 1 });

// Virtual to populate user
profileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to set completion status and updatedAt
profileSchema.pre<IProfile>('save', function (next) {
  this.isProfileComplete = !!(
    this.fullNames &&
    this.location &&
    Array.isArray(this.location.coordinates) &&
    this.location.coordinates.length === 2
  );
  // updatedAt handled by timestamps
  next();
});

// Instance method to compute distance (km) from another point
profileSchema.methods.distanceFrom = function (this: IProfile, longitude: number, latitude: number) {
  const R = 6371; // km
  const lat1 = (this.location.coordinates[1] * Math.PI) / 180;
  const lon1 = (this.location.coordinates[0] * Math.PI) / 180;
  const lat2 = (latitude * Math.PI) / 180;
  const lon2 = (longitude * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Profile = mongoose.model<IProfile>('Profile', profileSchema);

export default Profile;
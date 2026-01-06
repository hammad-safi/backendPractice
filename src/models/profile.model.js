import mongoose, { Schema } from 'mongoose';

const statsSchema = new Schema({
  customers: {
    type: String,
    default: '15K+'
  },
  products: {
    type: String,
    default: '5000+'
  },
  rating: {
    type: String,
    default: '4.8'
  }
}, { _id: false });

const pharmacyProfileSchema = new Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: [200, 'Tagline cannot exceed 200 characters']
  },
  license: {
    type: String,
    required: [true, 'License number is required'],
    uppercase: true
  },
  owner: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  hours: {
    type: String,
    required: [true, 'Working hours are required']
  },
  established: {
    type: String,
    required: [true, 'Established year is required']
  },
  about: {
    type: String,
    maxlength: [1000, 'About section cannot exceed 1000 characters']
  },
  services: [{
    type: String,
    trim: true
  }],
  stats: statsSchema,
  logo: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  cloudinaryAssets: [{
    type: String
  }],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for user-specific profiles
pharmacyProfileSchema.index({ user: 1 }, { unique: true });
pharmacyProfileSchema.index({ license: 1 });

// Virtual for full address
pharmacyProfileSchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.city}`;
});

export const PharmacyProfile = mongoose.model('PharmacyProfile', pharmacyProfileSchema);
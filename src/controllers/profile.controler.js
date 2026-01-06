import { PharmacyProfile } from '../models/profile.model.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/apiError.js';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

// @desc    Get pharmacy profile for current user
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await PharmacyProfile.findOne({ user: req.user._id })
      .populate('user', 'userName fullName email');
    
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No profile found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Create or update pharmacy profile
// @route   POST /api/profile
// @access  Private
const createOrUpdateProfile = asyncHandler(async (req, res) => {
  try {
    const {
      storeName,
      tagline,
      license,
      owner,
      phone,
      email,
      address,
      city,
      hours,
      established,
      about,
      services,
      stats
    } = req.body;

    // Parse services if it's a string
    let parsedServices = services;
    if (typeof services === 'string') {
      try {
        parsedServices = JSON.parse(services);
      } catch {
        parsedServices = services.split(',').map(s => s.trim());
      }
    }

    // Check if profile exists
    let profile = await PharmacyProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update existing profile
      const updateData = {
        storeName: storeName || profile.storeName,
        tagline: tagline || profile.tagline,
        license: license || profile.license,
        owner: owner || profile.owner,
        phone: phone || profile.phone,
        email: email || profile.email,
        address: address || profile.address,
        city: city || profile.city,
        hours: hours || profile.hours,
        established: established || profile.established,
        about: about || profile.about,
        services: parsedServices || profile.services,
        stats: stats ? { ...profile.stats, ...stats } : profile.stats
      };

      profile = await PharmacyProfile.findOneAndUpdate(
        { user: req.user._id },
        updateData,
        { new: true, runValidators: true }
      ).populate('user', 'userName fullName email');
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    } else {
      // Create new profile
      profile = new PharmacyProfile({
        storeName,
        tagline,
        license,
        owner,
        phone,
        email,
        address,
        city,
        hours,
        established,
        about,
        services: parsedServices || [],
        stats: stats || {
          customers: '15K+',
          products: '5000+',
          rating: '4.8'
        },
        user: req.user._id
      });

      const newProfile = await profile.save();
      await newProfile.populate('user', 'userName fullName email');
      
      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: newProfile
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
});

// @desc    Upload profile logo
// @route   POST /api/profile/logo
// @access  Private
const uploadLogo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Upload to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path, 'image');
    
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      throw new ApiError(500, 'Failed to upload to Cloudinary');
    }

    // Update profile with logo URL
    const profile = await PharmacyProfile.findOneAndUpdate(
      { user: req.user._id },
      { 
        logo: cloudinaryResponse.secure_url,
        $addToSet: { cloudinaryAssets: cloudinaryResponse.public_id }
      },
      { new: true, upsert: true }
    ).populate('user', 'userName fullName email');

    // Clean up local file (already done in uploadOnCloudinary)
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        profile
      }
    });
  } catch (error) {
    // Clean up local file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload logo',
      error: error.message
    });
  }
});

// @desc    Upload profile banner
// @route   POST /api/profile/banner
// @access  Private
const uploadBanner = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Upload to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path, 'image');
    
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      throw new ApiError(500, 'Failed to upload to Cloudinary');
    }

    // Update profile with banner URL
    const profile = await PharmacyProfile.findOneAndUpdate(
      { user: req.user._id },
      { 
        banner: cloudinaryResponse.secure_url,
        $addToSet: { cloudinaryAssets: cloudinaryResponse.public_id }
      },
      { new: true, upsert: true }
    ).populate('user', 'userName fullName email');

    // Clean up local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        banner: cloudinaryResponse.secure_url,
        publicId: cloudinaryResponse.public_id,
        profile
      }
    });
  } catch (error) {
    // Clean up local file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload banner',
      error: error.message
    });
  }
});

// @desc    Delete pharmacy profile
// @route   DELETE /api/profile
// @access  Private
const deleteProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await PharmacyProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Delete images from Cloudinary if they exist
    // Note: You might want to implement Cloudinary deletion here
    // This requires additional setup with your Cloudinary config
    
    await profile.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get public profile by ID
// @route   GET /api/profile/public/:id
// @access  Public
const getPublicProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await PharmacyProfile.findById(id)
      .populate('user', 'userName fullName')
      .select('-__v');
    
    if (!profile || !profile.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update profile stats
// @route   PUT /api/profile/stats
// @access  Private
const updateStats = asyncHandler(async (req, res) => {
  try {
    const { customers, products, rating } = req.body;
    
    const updateData = {};
    if (customers !== undefined) updateData['stats.customers'] = customers;
    if (products !== undefined) updateData['stats.products'] = products;
    if (rating !== undefined) updateData['stats.rating'] = rating;

    const profile = await PharmacyProfile.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'userName fullName email');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stats updated successfully',
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export {
  getProfile,
  createOrUpdateProfile,
  uploadLogo,
  uploadBanner,
  deleteProfile,
  getPublicProfile,
  updateStats
};
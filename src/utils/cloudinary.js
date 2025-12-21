import { cloudinary } from '../config/cloudinary.config.js';
import fs from 'fs';
import { ApiError } from './apiError.js';

const uploadOnCloudinary = async (localFilePath, resourceType = 'auto') => {
  try {
    if (!localFilePath) {
      throw new ApiError(400, "File path is required");
    }

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType, // 'auto', 'image', 'video', 'raw'
    //   folder: "backend-practice", // Optional: Organize files in folder
    //   use_filename: true, // Keep original filename
    //   unique_filename: false,
    //   overwrite: true,
    });

    // Remove locally saved temporary file
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // Remove locally saved temporary file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    console.error("Cloudinary upload error:", error.message);
    throw new ApiError(500, "File upload failed");
  }
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) {
      throw new ApiError(400, "Public ID is required");
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
    throw new ApiError(500, "File deletion failed");
  }
};

// Get Cloudinary URL helpers
const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options
  });
};

export {
  uploadOnCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  cloudinary
};
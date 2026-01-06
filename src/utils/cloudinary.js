import { cloudinary } from '../config/cloudinary.config.js';
import fs from 'fs';
import { ApiError } from './apiError.js';

const uploadOnCloudinary = async (localFilePath, resourceType = 'auto') => {
  try {
    if (!localFilePath) {
      throw new ApiError(400, "File path is required");
    }

    console.log("📤 Uploading to Cloudinary:", localFilePath);

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
    });

    console.log("✅ Cloudinary response received");

    // Remove locally saved temporary file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("🗑️ Local file deleted");
    }

    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    
    // Remove locally saved temporary file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    throw new ApiError(500, `File upload failed: ${error.message}`);
  }
};

export { uploadOnCloudinary };
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

// Upload an image
export const uploadCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file uploaded successfully
    console.log("File uploaded successfully", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error uploading image to Cloudinary");
    fs.unlinkSync(localFilePath);
  }
};

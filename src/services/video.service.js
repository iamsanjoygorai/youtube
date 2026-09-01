import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

export const uploadVideo = async (buffer) => {
  return uploadToCloudinary(buffer, {
    resource_type: "video",
    folder: "youtube-clone/videos",
  });
};

export const uploadThumbnail = async (buffer) => {
  return uploadToCloudinary(buffer, {
    resource_type: "image",
    folder: "youtube-clone/thumbnails",
  });
};

export const deleteVideoFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "video",
  });
};

export const deleteThumbnailFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};
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

export const uploadAvatar = async (buffer) => {
  return uploadToCloudinary(buffer, {
    resource_type: "image",
    folder: "youtube-clone/avatars",
  });
};

export const deleteAvatarFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};
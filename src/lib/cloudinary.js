import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file, folder = 'yoga-temple') {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'auto',
  });
  return result;
}

export async function deleteImage(publicId) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
}

export async function uploadVideo(file, folder = 'yoga-temple/videos') {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: 'video',
    chunk_size: 6000000,
  });
  return result;
}

export default cloudinary;

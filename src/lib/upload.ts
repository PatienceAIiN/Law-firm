import { v2 as cloudinary } from 'cloudinary'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudflare R2 config
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`

  // 1. Try Cloudinary first
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const b64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${b64}`;
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'law_firm_uploads',
        resource_type: 'auto'
      });
      return uploadResult.secure_url;
    } catch (error) {
      console.error("Cloudinary upload failed, falling back to R2:", error);
    }
  }

  // 2. Try Cloudflare R2 fallback
  if (process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME) {
    try {
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      }));
      // Assuming you have a custom domain or public R2 URL configured
      const publicUrl = process.env.R2_PUBLIC_URL 
        ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`
        : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${filename}`;
      return publicUrl;
    } catch (error) {
      console.error("R2 fallback failed, falling back to local storage:", error);
    }
  }

  // 3. Ultimate Fallback to local storage
  const publicPath = join(process.cwd(), 'public', 'uploads')
  try {
    await mkdir(publicPath, { recursive: true })
  } catch (e) {}
  await writeFile(join(publicPath, filename), buffer)
  return `/uploads/${filename}`
}

import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  eTag?: string;
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

export const slugify = (title: string) => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newSlug = `${Date.now()}-${uuidv4()}-${baseSlug}`;

  return newSlug;
};

export const getFileUrl = (fileKey: string) => {
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
};

export const uploadFile = async (
  fileContent,
  fileName: string,
  contentType: string,
  publicUrl = false
) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: contentType,
      ... publicUrl ? {} : {ACL: ObjectCannedACL.private},
    };

    const command = new PutObjectCommand(params);
    const uploadResult = await s3Client.send(command);

    // Construct the URL using the bucket and key
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return {
      success: true,
      url: fileUrl,
      key: fileName,
      eTag: uploadResult.ETag,
    };
  } catch (error: any) {
    console.error("S3 upload failed:", error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

export const deleteFile = async (fileKey: string) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error: any) {
    console.error("S3 deletion failed:", error);
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

export const getSignedUrlData = async (fileKey: string) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new GetObjectCommand(params);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 60 * 24 * 6,
    });
    return signedUrl;
  } catch (error: any) {
    console.error("Failed to generate signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};


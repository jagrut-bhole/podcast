import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.AWS_REGION) {
  console.error("AWS_REGION environment variable is not set");
}
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.error("AWS_ACCESS_KEY_ID environment variable is not set");
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS_SECRET_ACCESS_KEY environment variable is not set");
}
if (!process.env.S3_BUCKET_NAME) {
  console.error("S3_BUCKET_NAME environment variable is not set");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  // Add these for better Vercel compatibility
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 30000, // 30 seconds
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

export interface InitializeUploadResult {
  uploadId: string;
  key: string;
}

export interface UploadChunkResult {
  etag: string;
  partNumber: number;
}

export interface CompleteUploadResult {
  location: string;
  key: string;
}

/**
 * Initialize a multipart upload for video recording
 * @param meetingId - The meeting ID to associate with the upload
 * @returns Upload ID and S3 key
 */
export async function initializeUpload(
  meetingId: string,
): Promise<InitializeUploadResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `recordings/${meetingId}/${timestamp}.webm`;

  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: "video/webm",
    Metadata: {
      meetingId,
      uploadedAt: new Date().toISOString(),
    },
  });

  const response = await s3Client.send(command);

  if (!response.UploadId) {
    throw new Error("Failed to initialize multipart upload");
  }

  return {
    uploadId: response.UploadId,
    key,
  };
}

/**
 * Upload a single chunk as part of a multipart upload
 * @param uploadId - The upload ID from initializeUpload
 * @param key - The S3 key
 * @param partNumber - The part number (1-indexed)
 * @param body - The chunk data
 * @returns ETag and part number
 */
export async function uploadChunk(
  uploadId: string,
  key: string,
  partNumber: number,
  body: Buffer,
): Promise<UploadChunkResult> {
  const command = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  });

  const response = await s3Client.send(command);

  if (!response.ETag) {
    throw new Error(`Failed to upload part ${partNumber}`);
  }

  return {
    etag: response.ETag,
    partNumber,
  };
}

/**
 * Complete a multipart upload
 * @param uploadId - The upload ID
 * @param key - The S3 key
 * @param parts - Array of uploaded parts with ETags
 * @returns Location and key of the completed upload
 */
export async function completeUpload(
  uploadId: string,
  key: string,
  parts: Array<{ etag: string; partNumber: number }>,
): Promise<CompleteUploadResult> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((part) => ({
        ETag: part.etag,
        PartNumber: part.partNumber,
      })),
    },
  });

  const response = await s3Client.send(command);

  return {
    location: response.Location || `s3://${BUCKET_NAME}/${key}`,
    key,
  };
}

/**
 * Abort a multipart upload (cleanup on error or cancellation)
 * @param uploadId - The upload ID
 * @param key - The S3 key
 */
export async function abortUpload(
  uploadId: string,
  key: string,
): Promise<void> {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  await s3Client.send(command);
}

/**
 * Generate a presigned URL for downloading a recording
 * @param key - The S3 key of the recording
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

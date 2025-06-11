// app/lib/s3-client.ts
import { S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.S3_BUCKET_NAME!;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

if (!REGION || !BUCKET || !ACCESS_KEY || !SECRET_KEY) {
  throw new Error(
    "Missing one of AWS_REGION, S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, or AWS_SECRET_ACCESS_KEY"
  );
}

export const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

export const S3_BUCKET = BUCKET;

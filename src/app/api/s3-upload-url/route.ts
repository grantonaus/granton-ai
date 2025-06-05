import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.S3_BUCKET_NAME!;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

// Log env just once when file is imported
console.log("🛠️  Initializing S3 client with config:");
console.log("    REGION:", REGION);
console.log("    BUCKET:", BUCKET);
console.log("    ACCESS_KEY:", ACCESS_KEY?.slice(0, 4) + "..." + ACCESS_KEY?.slice(-4));
console.log("    SECRET_KEY: ******");

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    const userId = searchParams.get("userId");

    console.log("🔍 Incoming request for presign URL");
    console.log("    fileName:", fileName);
    console.log("    userId:", userId);

    if (!fileName || !userId) {
      console.warn("⚠️  Missing fileName or userId");
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const fileKey = `${userId}/${fileName}`;
    console.log("🧩  Constructed fileKey:", fileKey);

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      ContentType: "application/pdf",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    console.log("✅  Presigned URL generated successfully");
    console.log("    URL (short):", signedUrl.slice(0, 60) + "...");
    return NextResponse.json({ uploadUrl: signedUrl, key: fileKey });

  } catch (err: any) {
    console.error("❌ Failed to generate upload URL:", err.message);
    console.error(err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}

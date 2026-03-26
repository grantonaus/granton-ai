import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth } from "@/lib/api-auth";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION!;
const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

function sanitizeFileName(raw: string): string | null {
  const base = raw.replace(/\\/g, "/").split("/").pop() ?? "";
  const trimmed = base.trim();
  if (!trimmed || trimmed.includes("..")) return null;
  if (!/\.pdf$/i.test(trimmed)) return null;
  return trimmed;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get("fileName");
    const fileName = rawName ? sanitizeFileName(rawName) : null;

    if (!fileName) {
      return NextResponse.json(
        { error: "Missing or invalid fileName (PDF only, no path segments)" },
        { status: 400 }
      );
    }

    const fileKey = `${auth.user.id}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      ContentType: "application/pdf",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ uploadUrl: signedUrl, key: fileKey });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to generate upload URL:", message);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

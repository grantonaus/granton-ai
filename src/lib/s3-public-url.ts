/**
 * Public object URL (virtual-hosted–style) for keys returned from our presigned upload flow.
 */
export function buildPublicS3ObjectUrl(key: string): string {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_AWS_REGION;
  if (!bucket || !region) {
    throw new Error(
      "NEXT_PUBLIC_S3_BUCKET_NAME and NEXT_PUBLIC_AWS_REGION must be set"
    );
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}

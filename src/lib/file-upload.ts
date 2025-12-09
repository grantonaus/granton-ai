/**
 * Utility functions for handling file uploads to S3
 */

export interface Attachment {
  name: string;
  url: string;
  key: string;
}

/**
 * Uploads a file to S3 using a presigned URL
 */
async function uploadFileToS3(
  file: File,
  userId: string
): Promise<Attachment | null> {
  try {
    const presignRes = await fetch(
      `/api/s3-upload-url?fileName=${encodeURIComponent(
        file.name
      )}&userId=${encodeURIComponent(userId)}`
    );

    if (!presignRes.ok) {
      const errTxt = await presignRes.text().catch(() => "Unknown error");
      throw new Error(`Failed to get presigned URL: ${errTxt}`);
    }

    const { uploadUrl, key } = await presignRes.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/pdf" },
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "Unknown error");
      throw new Error(`S3 upload failed: ${text}`);
    }

    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_REGION;
    const objectUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

    return { name: file.name, url: objectUrl, key };
  } catch (error) {
    console.error(`Failed to upload file ${file.name}:`, error);
    return null;
  }
}

/**
 * Processes and uploads new files, preserving existing attachments
 */
export async function processAttachments(
  attachments: Array<File | Attachment>,
  userId: string
): Promise<Attachment[]> {
  const newFiles: File[] = [];
  const existingAttachments: Attachment[] = [];

  attachments.forEach((att) => {
    if (att instanceof File) {
      newFiles.push(att);
    } else {
      existingAttachments.push(att);
    }
  });

  const uploadPromises = newFiles.map((file) => uploadFileToS3(file, userId));
  const uploadedResults = await Promise.all(uploadPromises);
  const uploadedAttachments = uploadedResults.filter(
    (att): att is Attachment => att !== null
  );

  return [...existingAttachments, ...uploadedAttachments];
}


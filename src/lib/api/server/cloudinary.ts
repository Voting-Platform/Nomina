"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/lib/api/server/require-auth";

export type UploadImageState = {
  success: boolean;
  url: string | null;
  error: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Only safe raster types. SVG is intentionally excluded — it supports
// embedded <script> tags and would be stored XSS if ever served inline.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// ─── In-memory rate limiter (per user, 10 uploads / 60 s) ─────────────────
// Resets on server restart — sufficient for single-instance / dev. Replace
// with Redis (e.g. Upstash) when scaling to multiple instances.
const uploadWindows = new Map<string, { count: number; resetAt: number }>();

function checkUploadRateLimit(userId: string): void {
  const now = Date.now();
  const window = uploadWindows.get(userId);
  if (!window || now > window.resetAt) {
    uploadWindows.set(userId, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (window.count >= 10) {
    throw new Error("Too many uploads. Please wait a minute and try again.");
  }
  window.count++;
}
// ──────────────────────────────────────────────────────────────────────────

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary env vars are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

function uploadBufferToCloudinary(buffer: Buffer, fileName: string) {
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "nomina";

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: sanitizeFilename(fileName),
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Upload completed but no secure_url was returned."));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export async function uploadImageAction(
  _prevState: UploadImageState,
  formData: FormData
): Promise<UploadImageState> {
  try {
    // C1 fix: require authentication before any processing
    const user = await requireAuth();

    const file = formData.get("image");

    if (!(file instanceof File)) {
      return { success: false, url: null, error: "Please select an image file." };
    }

    // C2 fix: strict allowlist instead of startsWith("image/")
    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        success: false,
        url: null,
        error: "Only JPEG, PNG, WebP, or GIF images are allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, url: null, error: "Image size must be 5 MB or smaller." };
    }

    checkUploadRateLimit(user.id);

    configureCloudinary();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadBufferToCloudinary(buffer, file.name);

    return { success: true, url, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    // Don't surface internal Cloudinary errors to the client
    const isUserFacing =
      message.startsWith("Too many uploads") ||
      message.startsWith("Only") ||
      message.startsWith("Image size") ||
      message.startsWith("Please select");
    console.error("[uploadImageAction] error:", error);
    return {
      success: false,
      url: null,
      error: isUserFacing ? message : "Upload failed. Please try again.",
    };
  }
}

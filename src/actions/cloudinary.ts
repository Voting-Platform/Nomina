"use server";

import { v2 as cloudinary } from "cloudinary";

export type UploadImageState = {
  success: boolean;
  url: string | null;
  error: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
        filename_override: fileName,
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
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return {
        success: false,
        url: null,
        error: "Please select an image file.",
      };
    }

    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        url: null,
        error: "Only image files are allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        url: null,
        error: "Image size must be 5MB or smaller.",
      };
    }

    configureCloudinary();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadBufferToCloudinary(buffer, file.name);

    return {
      success: true,
      url,
      error: null,
    };
  } catch (error) {
    console.error("[uploadImageAction] Cloudinary upload failed:", error);
    return {
      success: false,
      url: null,
      error: "Upload failed. Please try again.",
    };
  }
}

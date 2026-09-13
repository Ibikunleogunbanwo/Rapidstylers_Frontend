import { ApiClient } from "../hooks/remote/apiClient";

/** Maps Cloudinary format names to the MIME types browsers report for them. */
const FORMAT_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Builds the multipart body Cloudinary will verify.
 *
 * Cloudinary rejects any upload whose parameters do not match the signature
 * exactly, so this forwards the set the backend signed rather than naming
 * fields by hand — adding a constraint server-side (allowed formats, size
 * ceiling) cannot then drift from what the browser sends. The `params` branch is
 * what the backend returns today; the flat-key branch keeps a frontend deploy
 * safe when the previously deployed backend is still answering.
 */
export function buildSignedUploadFormData(file, sig, filename) {
  const formData = new FormData();
  // A camera capture is a Blob with no filename, and Cloudinary derives its
  // public ID from the name, so callers can pass one explicitly.
  formData.append("file", file, filename || file.name);
  const signed = sig?.params || {
    api_key: sig?.apiKey,
    timestamp: sig?.timestamp,
    folder: sig?.folder,
    signature: sig?.signature,
  };
  Object.entries(signed).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  return formData;
}

/**
 * Rejects an obviously disallowed file before it is sent, so the user sees a
 * clear message instead of Cloudinary's generic rejection. The limits come from
 * the signed response, so they stay in step with what the backend enforces —
 * this is a fast-fail convenience, not the security boundary.
 */
export function assertUploadAllowed(file, sig) {
  const maxBytes = Number(sig?.maxFileSize || 0);
  if (maxBytes > 0 && file.size > maxBytes) {
    throw new Error(`Image is too large. The maximum is ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }
  const formats = String(sig?.allowedFormats || "")
    .split(",")
    .map((format) => format.trim().toLowerCase())
    .filter(Boolean);
  if (formats.length === 0) return;
  const name = String(file.name || "").toLowerCase();
  const extension = name.includes(".") ? name.split(".").pop() : "";
  const mimeAllowed = formats.some((format) => FORMAT_MIME[format] === file.type);
  if (!mimeAllowed && !formats.includes(extension)) {
    throw new Error(`Only ${formats.join(", ")} images can be uploaded.`);
  }
}

/** The URL Cloudinary receives the upload at, from a signature response. */
export function cloudinaryUploadUrl(sig) {
  return `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
}

/**
 * Uploads a file directly to Cloudinary using a backend-signed URL.
 * Used at the single commit point of the styler signup (final submit) so
 * images are never pushed to Cloudinary before the account is created.
 *
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadToCloudinary(file, folder) {
  // 1. Get signed upload credentials from the backend (with folder prefix)
  const sigUrl = folder
    ? `/get_upload_signature?folderPrefix=${encodeURIComponent(folder)}`
    : "/get_upload_signature";
  const sigRes = await ApiClient.get(sigUrl);
  const sig = sigRes.data?.data;
  if (!sig) throw new Error("Failed to get upload credentials");

  assertUploadAllowed(file, sig);

  // 2. Upload directly to Cloudinary
  const cloudRes = await fetch(cloudinaryUploadUrl(sig), {
    method: "POST",
    body: buildSignedUploadFormData(file, sig),
  });

  if (!cloudRes.ok) {
    const errBody = await cloudRes.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "Upload failed");
  }

  const result = await cloudRes.json();
  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Best-effort deletion of an image that was uploaded but never attached to an
 * account (e.g. create_styler failed). Silently ignores errors so cleanup
 * never surfaces scary toasts during a failed registration.
 */
export async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;
  try {
    await ApiClient.post(
      "/delete_cloudinary_image",
      { publicId }
    );
  } catch {
    // Ignore — orphan cleanup is best-effort.
  }
}

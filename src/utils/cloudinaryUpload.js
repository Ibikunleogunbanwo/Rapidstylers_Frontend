import { ApiClient } from "../hooks/remote/apiClient";

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

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("folder", sig.folder);
  formData.append("signature", sig.signature);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

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

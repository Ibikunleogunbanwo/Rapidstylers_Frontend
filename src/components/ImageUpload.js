import { useState, useRef } from "react";
import { ApiClient } from "../hooks/remote/apiClient";

/**
 * Reusable image uploader that uploads directly to Cloudinary
 * via a backend-signed URL (never proxies bytes through the server).
 *
 * Images are partitioned into Cloudinary folders under the rapid_stylers namespace:
 *   folder="profile"  → rapid_stylers/profile/
 *   folder="id"       → rapid_stylers/id/
 *   folder="store"    → rapid_stylers/store/
 *   (no folder)       → rapid_stylers/
 *
 * Props:
 *   onUpload(url)  — called with the Cloudinary CDN URL after success
 *   onError(msg)   — called with error string on failure
 *   label          — display label
 *   folder         — Cloudinary subfolder (profile, id, store, etc.)
 *   accept         — file input accept filter (default: image/*)
 *   previewUrl     — initial preview image URL
 *   className      — extra wrapper classes
 */
const ImageUpload = ({ onUpload, onError, label, folder, accept = "image/*", previewUrl, className = "" }) => {
  const [preview, setPreview] = useState(previewUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      onError?.("Image must be under 5 MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // 1. Get signed upload credentials from backend (with folder prefix)
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
      const url = result.secure_url;

      setPreview(url);
      onUpload?.(url);
    } catch (err) {
      const msg = err.message || "Upload failed";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`grid w-full ${className}`}>
      <span className="font-medium text-sm pb-1">{label}:</span>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-full h-40 rounded-md border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${
          error ? "border-red-400 bg-red-50/30" : "border-gray-300 hover:border-brand/50 bg-gray-50"
        } ${uploading ? "opacity-60 cursor-wait" : ""}`}
      >
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium">
              {uploading ? "Uploading…" : "Tap to upload"}
            </span>
            <span className="text-[10px] text-gray-300 mt-1">JPG, PNG up to 5 MB</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ImageUpload;

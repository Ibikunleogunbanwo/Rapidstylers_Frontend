import { useState, useRef, useEffect } from "react";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

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
 * Two modes:
 *   - default: uploads to Cloudinary immediately on file pick and calls
 *     onUpload(url). Use for one-shot uploads.
 *   - deferUpload: does NOT touch Cloudinary. It just reports the picked
 *     File via onFileSelected(file) and shows a local object-URL preview.
 *     The caller commits the file later (e.g. at final submit), which is
 *     how the signup wizard avoids orphaned images.
 *
 * Props:
 *   onUpload(url)      — called with the Cloudinary CDN URL after success (direct mode)
 *   onFileSelected(f)  — called with the File in deferUpload mode
 *   file               — the selected File (deferUpload mode; drives the preview)
 *   onError(msg)       — called with error string on failure
 *   label, folder, accept, previewUrl, className
 */
const ImageUpload = ({
  onUpload,
  onError,
  label,
  folder,
  accept = "image/*",
  previewUrl,
  className = "",
  deferUpload = false,
  onFileSelected,
  file,
}) => {
  const [preview, setPreview] = useState(previewUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Deferred mode: preview the picked file locally until it's committed.
  useEffect(() => {
    if (!deferUpload) return;
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview("");
  }, [deferUpload, file]);

  const handleFile = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Client-side validation
    if (selected.size > 5 * 1024 * 1024) {
      const msg = "Image must be under 5 MB";
      setError(msg);
      onError?.(msg);
      return;
    }

    setError("");

    // Deferred mode: just hand the File up; nothing is uploaded yet.
    if (deferUpload) {
      onFileSelected?.(selected);
      return;
    }

    // Direct mode: upload now.
    setUploading(true);
    try {
      const { url } = await uploadToCloudinary(selected, folder);
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

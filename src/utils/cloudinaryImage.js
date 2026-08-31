/**
 * Cloudinary delivery transforms so each display surface gets a consistently
 * cropped, resized variant (c_fill + smart gravity) instead of letting the
 * browser object-cover-cut an uncropped original. The master stays full-size in
 * Cloudinary, so nothing is lost by cropping (and recropping later is free).
 *
 * Only Cloudinary delivery URLs are rewritten (matched by /image/upload/);
 * every other URL (local previews, external images) passes through untouched.
 */

const CLOUDINARY_UPLOAD = "/image/upload/";

export const CLOUDINARY_PRESETS = {
  // Search/service cards, featured grids (~16:9 cover thumbnails).
  card: { crop: "c_fill", gravity: "g_auto", w: 640, ar: "16:9" },
  // Square tiles (public portfolio).
  square: { crop: "c_fill", gravity: "g_auto", w: 800, ar: "1:1" },
  // Tall portrait tiles (styler "my work" grid).
  portrait: { crop: "c_fill", gravity: "g_auto", w: 600, ar: "4:5" },
  // Small circular avatars — face-focused square.
  avatar: { crop: "c_fill", gravity: "g_face", w: 160, ar: "1:1" },
  // Blog / article heroes.
  blog: { crop: "c_fill", gravity: "g_auto", w: 1200, ar: "16:9" },
  // Wide banner fills.
  cover: { crop: "c_fill", gravity: "g_auto", w: 1200, ar: "3:1" }
};

/**
 * @param {string} url - the stored Cloudinary secure_url (or any URL).
 * @param {keyof CLOUDINARY_PRESETS} [preset="card"]
 * @returns {string} a transformed Cloudinary URL, or the original URL unchanged.
 */
export function cloudinaryImage(url, preset = "card") {
  if (!url) return "";
  const src = String(url);
  const idx = src.indexOf(CLOUDINARY_UPLOAD);
  if (idx === -1) {
    // Not a Cloudinary delivery URL — leave it alone.
    return src;
  }
  const p = CLOUDINARY_PRESETS[preset] || CLOUDINARY_PRESETS.card;
  const parts = [p.crop, p.gravity];
  if (p.ar) parts.push(`ar_${p.ar}`);
  parts.push(`w_${p.w}`, "q_auto", "f_auto");

  const before = src.slice(0, idx + CLOUDINARY_UPLOAD.length);
  const after = src.slice(idx + CLOUDINARY_UPLOAD.length);
  return `${before}${parts.join(",")}/${after}`;
}

/** Convenience one-liners used at call sites. */
export const cloudinaryCard = (url) => cloudinaryImage(url, "card");
export const cloudinarySquare = (url) => cloudinaryImage(url, "square");
export const cloudinaryPortrait = (url) => cloudinaryImage(url, "portrait");
export const cloudinaryAvatar = (url) => cloudinaryImage(url, "avatar");
export const cloudinaryBlog = (url) => cloudinaryImage(url, "blog");
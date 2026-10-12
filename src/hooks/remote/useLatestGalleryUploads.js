import { useEffect, useState } from "react";
import { fetchGalleryUploads } from "./publicContentApi";
import { ALL_WORK, categoriesForTab } from "../../utils/galleryCategories";

/**
 * A /gallery item as the grids render it. The gallery page and the home page
 * both read uploads through this, so the two cannot disagree on which size is
 * shown or how a photo is credited.
 */
export function toGalleryPhoto(p, fallbackAlt = "") {
  return {
    src: p?.src?.medium || p?.src?.large || p?.src?.original || "",
    alt: p?.alt || fallbackAlt,
    photographer: p?.photographer || "",
    stylerId: p?.stylerId || "",
    source: p?.source || "stylist",
  };
}

/**
 * The latest approved stylist uploads across every gallery category: the first
 * page of each, in the order the gallery's "All work" view lists them. `photos` is null while loading and [] when there are none or the
 * API is unreachable, so the caller can keep its space and decide what to show.
 */
export function useLatestGalleryUploads(limit = 4, { enabled = true } = {}) {
  const [photos, setPhotos] = useState(enabled ? null : []);

  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    Promise.all(
      categoriesForTab(ALL_WORK).map((name) =>
        fetchGalleryUploads(name, limit, 1).then(
          (res) => (Array.isArray(res.data?.data) ? res.data.data : []),
          () => []
        )
      )
    ).then((responses) => {
      if (!live) return;
      const seen = new Set();
      const uploads = [];
      responses.flat().forEach((item) => {
        const photo = toGalleryPhoto(item, ALL_WORK);
        const key = `${photo.stylerId}|${photo.src}`;
        if (!photo.src || seen.has(key)) return;
        seen.add(key);
        uploads.push(photo);
      });
      setPhotos(uploads.slice(0, limit));
    });
    return () => {
      live = false;
    };
  }, [limit, enabled]);

  return photos;
}

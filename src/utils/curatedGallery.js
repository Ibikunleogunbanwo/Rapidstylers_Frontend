/**
 * Curated gallery images — real photos provided by the RapidStylers team, which
 * lead the gallery grid and the landing page's "elevate your style" strip while
 * approved stylist uploads still render alongside them from the API.
 *
 * These live as plain static files under `public/images/gallery/`, served by the
 * CDN at the path written below rather than being bundled and content-hashed
 * into the JS build. Two consequences, both deliberate:
 *
 *  - The id here IS the filename on disk, so adding or replacing a batch is a
 *    drop-in with nothing to wire up — `curatedGallery.test.js` fails if a file
 *    is present but unlisted, or listed but missing.
 *  - The URL does not change when a file is replaced, so the CDN rule for
 *    /images/* is a day rather than `immutable`. An immutable rule would pin a
 *    swapped photo in browsers until someone renamed the file.
 *
 * To move these onto another host — an object store, or a directory served off
 * the VPS — change CURATED_IMAGE_BASE and nothing else. Note that the backend's
 * `/rapid_stylers/files/**` prefix is NOT an option: it is exempted from the
 * API-key filter but has no handler behind it and answers 404.
 */
export const CURATED_IMAGE_BASE = "/images/gallery";

/** Every image is a JPG today; the extension is here so a future batch can differ. */
const EXTENSION = "jpg";

/** id = filename without extension. Order here is the order shown in the grid. */
const CURATED = [
  { id: "g-makeup-1", alt: "Professional makeup application", category: "Makeup" },
  { id: "g-makeup-2", alt: "Makeup artistry close-up", category: "Makeup" },
  { id: "g-lashes-1", alt: "Eyelash extension application", category: "Eyelash extensions" },
  { id: "g-lashes-2", alt: "Lash extension close-up", category: "Eyelash extensions" },
  { id: "g-lashes-3", alt: "Lash extension detail", category: "Eyelash extensions" },
  { id: "g-lashes-4", alt: "Eyelash extensions", category: "Eyelash extensions" },
  { id: "g-braids-1", alt: "Hair braiding", category: "Braids" },
  { id: "g-braids-2", alt: "Cornrow braiding", category: "Cornrows" },
  { id: "g-barber-1", alt: "Precision barber trim", category: "Buzz cut" },
];

/** Attribution shown under a curated tile — these are ours, not a stylist's. */
const PHOTOGRAPHER = "RapidStylers";

export const CURATED_GALLERY = CURATED.map((entry) => ({
  ...entry,
  photographer: PHOTOGRAPHER,
  src: `${CURATED_IMAGE_BASE}/${entry.id}.${EXTENSION}`,
}));

/**
 * Looks an entry up by id, failing loudly. A typo used to mean a silently
 * missing image; now it means a failed build, which is the cheaper discovery.
 */
export function curatedById(id) {
  const entry = CURATED_GALLERY.find((item) => item.id === id);
  if (!entry) {
    throw new Error(
      `No curated gallery image with id "${id}". Add it to CURATED_GALLERY in src/utils/curatedGallery.js.`
    );
  }
  return entry;
}

/**
 * The landing page's four-tile strip, taken from the list above rather than
 * re-importing the same files — the two pages previously drifted apart because
 * each kept its own copy of the paths.
 */
export const ELEVATE_GRID = ["g-makeup-1", "g-lashes-1", "g-braids-1", "g-barber-1"].map((id) => {
  const { src, alt } = curatedById(id);
  return { src, alt };
});

/** Filenames this list expects to find in public/images/gallery/. */
export const CURATED_FILENAMES = CURATED_GALLERY.map((entry) => `${entry.id}.${EXTENSION}`);

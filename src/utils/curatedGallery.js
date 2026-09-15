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
 *
 * Adding a batch: normalise the files (long edge 1400px, JPEG, no metadata),
 * drop them in the folder, then add one line each below.
 * `curatedGallery.sources.md` — beside this file, because the repo's docs/
 * folder is gitignored — records where each photo came from and lists the ones
 * that failed review: watermarked images, screenshots carrying another app's
 * interface, and a photograph of a child.
 */
import { tabLabelsForCategory } from "./galleryCategories";

export const CURATED_IMAGE_BASE = "/images/gallery";

/** Every image is a JPG today; the extension is here so a future batch can differ. */
const EXTENSION = "jpg";

/** id = filename without extension. Order here is the order shown in the grid. */
const CURATED = [
  { id: "g-makeup-1", alt: "Professional makeup application", category: "Makeup" },
  { id: "g-makeup-2", alt: "Makeup artistry close-up", category: "Makeup" },
  // The opening set's lashes, barbering and braids entries were mismatched on an
  // earlier site: the close-up of a lash tool at an eye was filed as a barber
  // trim, a clipper shot as a lash detail, and a makeup brush at the lips as
  // braiding. Each id was renamed to what the photo actually shows.
  { id: "g-makeup-3", alt: "Makeup artistry in black and white, brush at the lips", category: "Makeup" },
  { id: "g-natural-hair-3", alt: "Hands twisting a section of natural hair at the scalp", category: "Natural hair" },
  { id: "g-lashes-2", alt: "Lash extension close-up", category: "Eyelash extensions" },
  { id: "g-buzz-cut-1", alt: "Barber fading the sides with clippers", category: "Buzz cut" },
  { id: "g-buzz-cut-2", alt: "Barber trimming a client's fade in the shop", category: "Buzz cut" },
  { id: "g-buzz-cut-3", alt: "Barber standing by the chair in the shop", category: "Buzz cut" },
  { id: "g-lashes-4", alt: "Eyelash extensions", category: "Eyelash extensions" },
  { id: "g-lashes-5", alt: "Eyelash extension application", category: "Eyelash extensions" },
  { id: "g-braids-2", alt: "Cornrow braiding", category: "Cornrows" },

  // Second batch, reviewed photo by photo and grouped by category. The ids are
  // the filenames on disk, so the folder and this list stay in step.
  { id: "g-locs-1", alt: "Long faux locs worn with statement sunglasses", category: "Locs" },
  { id: "g-locs-2", alt: "Soft locs styled loose past the shoulder", category: "Locs" },
  { id: "g-natural-hair-1", alt: "Coily natural hair worn long and full", category: "Natural hair" },
  { id: "g-natural-hair-2", alt: "Short twists defined over neat scalp parts", category: "Natural hair" },
  { id: "g-natural-hair-4", alt: "Stylist sectioning a client's natural hair for braiding", category: "Natural hair" },
  { id: "g-braids-3", alt: "Braided updo with rolled sections, shown from three angles", category: "Braids" },
  { id: "g-braids-4", alt: "Senegalese twists swept to one side", category: "Braids" },
  { id: "g-braids-5", alt: "Long auburn knotless braids", category: "Braids" },
  { id: "g-braids-6", alt: "Boho knotless braids with loose curls at the ends", category: "Braids" },
  { id: "g-braids-7", alt: "Bob-length braids with curly ends", category: "Braids" },
  { id: "g-braids-8", alt: "Shoulder-length bob braids finished with curls", category: "Braids" },
  { id: "g-braids-9", alt: "Blunt braided bob with a centre part", category: "Braids" },
  { id: "g-braids-10", alt: "Box braids gathered into a high bun", category: "Braids" },
  { id: "g-braids-11", alt: "Silver-blonde braided updo with loose curls", category: "Braids" },
  { id: "g-braids-12", alt: "Back view of long braids finished at the parting", category: "Braids" },
  { id: "g-braids-13", alt: "Auburn braided ponytail with bouncy curls", category: "Braids" },
  { id: "g-braids-14", alt: "Extra-long braids worn in a high ponytail, front and back", category: "Braids" },
  { id: "g-braids-15", alt: "Halo braided updo wrapped around the head", category: "Braids" },
  { id: "g-braids-16", alt: "Golden-blonde knotless braids in a side ponytail", category: "Braids" },
  { id: "g-braids-17", alt: "Short twisted braids with visible scalp parts", category: "Braids" },
  { id: "g-braids-18", alt: "Braided bob with a soft side sweep", category: "Braids" },
  { id: "g-cornrows-1", alt: "Cornrows into a high braided bun with a beaded fringe", category: "Cornrows" },
  { id: "g-cornrows-2", alt: "Side cornrows swept back into a braided bun", category: "Cornrows" },
  { id: "g-cornrows-3", alt: "Scalp cornrows feeding into long braids", category: "Cornrows" },
  { id: "g-nails-1", alt: "Glossy red almond nails", category: "Nail tech" },
  { id: "g-nails-2", alt: "Nude almond nails with gold bow charms", category: "Nail tech" },
  { id: "g-nails-3", alt: "Soft pink ombre almond nails", category: "Nail tech" },
  { id: "g-nails-4", alt: "Nude coffin nails with metallic gold tips", category: "Nail tech" },
  { id: "g-nails-5", alt: "Matte burgundy nails with gold glitter cuticles", category: "Nail tech" },
  { id: "g-nails-6", alt: "Classic French tip almond nails", category: "Nail tech" },
  { id: "g-nails-7", alt: "Chrome gold stiletto nails", category: "Nail tech" },
  { id: "g-nails-8", alt: "Nude square nails with a glitter accent", category: "Nail tech" },
  { id: "g-nails-9", alt: "Nail technician applying gel colour", category: "Nail tech" },
  { id: "g-nails-10", alt: "Matching manicure and pedicure in pink and black", category: "Nail tech" },
  { id: "g-nails-11", alt: "Nude glitter almond nails", category: "Nail tech" },
  { id: "g-nails-12", alt: "Black nail art with fine line detail", category: "Nail tech" },
];

/** Attribution shown under a curated tile — these are ours, not a stylist's. */
const PHOTOGRAPHER = "RapidStylers";

export const CURATED_GALLERY = CURATED.map((entry) => ({
  ...entry,
  photographer: PHOTOGRAPHER,
  src: `${CURATED_IMAGE_BASE}/${entry.id}.${EXTENSION}`,
}));

/**
 * Folds the plural off a word, so a search for "lashes" finds "Eyelash" and
 * "braids" finds "braid". Deliberately not a stemmer — it only strips an
 * English plural suffix, which is what people type at a gallery.
 */
const foldPlural = (word) => {
  if (word.length > 3 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
};

/** Lowercase, punctuation-free words with the plural folded off. */
const words = (value) =>
  String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1)
    .map(foldPlural);

/**
 * Two words match when either contains the other, so "braid" finds "braiding"
 * and "lashes" finds "eyelash". The shortest word in the pair must be at least
 * four characters, which keeps one prefix from matching half the gallery.
 */
const wordsMatch = (token, word) => {
  const shorter = token.length <= word.length ? token : word;
  const longer = token.length <= word.length ? word : token;
  return shorter.length >= 4 ? longer.includes(shorter) : longer === shorter;
};

/**
 * Keyword search over the curated list, matching the alt text, category and id
 * — the words a visitor can actually see. Every keyword has to match, so
 * "braided bob" is narrower than "bob".
 *
 * The search deliberately spans every category. Wigs, High-top fade and Hair
 * dye have no curated photos at all, and the default tab used to be another
 * empty one, so a search scoped to the selected tab returned nothing for the
 * photos the visitor was looking at. Browsing still filters to the tab.
 *
 * A photo's tab labels are part of what it matches, so a merged tab's other
 * name works too: searching "dreadlocks" finds the locs photos, exactly as
 * clicking that tab does.
 */
export function searchCuratedPhotos(query) {
  const tokens = words(query);
  if (tokens.length === 0) return [];
  return CURATED_GALLERY.filter((entry) => {
    const labels = tabLabelsForCategory(entry.category).join(" ");
    const haystack = words(`${entry.alt} ${entry.category} ${entry.id} ${labels}`);
    return tokens.every((token) => haystack.some((word) => wordsMatch(token, word)));
  });
}

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
 *
 * The four are chosen to read as an offer, not as four nice photos: braiding
 * (the signature), barbering (so the strip speaks to men too — the heading says
 * "for men and women"), nails, and locs. Each one is a colour photo whose
 * subject survives a square centre crop, which is how the tile renders them.
 * The two black-and-white photos that used to be here read as one repeated
 * image, and the "braids" tile was a makeup shot.
 */
export const ELEVATE_GRID = ["g-cornrows-1", "g-buzz-cut-1", "g-nails-1", "g-locs-1"].map((id) => {
  const { src, alt } = curatedById(id);
  return { src, alt };
});

/**
 * Sample photos for professionals who have not uploaded one.
 *
 * A card with no photo used to fall straight to the initials tile, which reads
 * as an unfinished page when a whole search result grid is full of them. Each
 * entry below maps one backend service type (the `service_type` table: Nail
 * Technician, Eyelash Technician, Barber, Hairstylist, Makeup Artist) onto
 * curated photos from the list above, so a photo-less card shows real work
 * from the stylist's own field.
 *
 * Matching is word-based over the service name, so admin-renamed services keep
 * working while their names keep the recognisable word ("Nail tech", "Mobile
 * nail technician"). The words deliberately include the gallery's own
 * vocabulary, and the hair entry accepts the hair-service words so a future
 * "Braider" or "Loc specialist" service falls back sensibly too.
 */
const SERVICE_FALLBACKS = [
  { words: ["nail"], ids: ["g-nails-1", "g-nails-3", "g-nails-6", "g-nails-2", "g-nails-5"] },
  { words: ["lash"], ids: ["g-lashes-2", "g-lashes-4", "g-lashes-5"] },
  { words: ["barber", "buzz", "fade", "clipper"], ids: ["g-buzz-cut-1", "g-buzz-cut-2", "g-buzz-cut-3"] },
  { words: ["makeup", "mua"], ids: ["g-makeup-1", "g-makeup-2", "g-makeup-3"] },
  {
    words: ["hairstylist", "hair", "braid", "loc", "dreadlock", "cornrow", "natural"],
    ids: ["g-natural-hair-1", "g-natural-hair-2", "g-natural-hair-3", "g-locs-2", "g-braids-5", "g-natural-hair-4"],
  },
];

/** Small stable hash, so a card picks the same sample photo on every render. */
const hashSeed = (value) => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/**
 * Picks a curated photo for a stylist with no profile image. `serviceTypeName`
 * selects the field ("Barber", "Nail Technician", ...); `seed` (the styler id)
 * spreads stylists of the same field across that field's photos instead of
 * repeating one tile down a whole results grid. Deterministic on both: the
 * same stylist shows the same sample photo on every search and reload.
 *
 * Returns the curated entry ({ src, alt, category, ... }), or null when the
 * service name is unrecognised — the card then falls back to initials.
 */
export function fallbackPhotoFor(serviceTypeName, seed = "") {
  const tokens = words(serviceTypeName);
  if (tokens.length === 0) return null;
  const row = SERVICE_FALLBACKS.find((entry) =>
    entry.words.some((word) => tokens.some((token) => wordsMatch(token, word)))
  );
  if (!row) return null;
  return curatedById(row.ids[hashSeed(seed) % row.ids.length]);
}

/** Filenames this list expects to find in public/images/gallery/. */
export const CURATED_FILENAMES = CURATED_GALLERY.map((entry) => `${entry.id}.${EXTENSION}`);

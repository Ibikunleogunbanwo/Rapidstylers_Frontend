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

  // Second batch, reviewed photo by photo and grouped by category. The ids are
  // the filenames on disk, so the folder and this list stay in step.
  { id: "g-locs-1", alt: "Long faux locs worn with statement sunglasses", category: "Locs" },
  { id: "g-locs-2", alt: "Soft locs styled loose past the shoulder", category: "Locs" },
  { id: "g-natural-hair-1", alt: "Coily natural hair worn long and full", category: "Natural hair" },
  { id: "g-natural-hair-2", alt: "Short twists defined over neat scalp parts", category: "Natural hair" },
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

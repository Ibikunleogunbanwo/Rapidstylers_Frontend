/**
 * The gallery's category tabs.
 *
 * A tab is a label plus the backend category names it covers. Most tabs cover
 * exactly one name; `Locs & dreadlocks` covers two, because visitors don't read
 * them as separate sections and the grid was splitting one subject across two
 * tabs. Keeping both names (rather than renaming the data) means work a stylist
 * already filed under either is still reachable — the backend allowlist accepts
 * both, and merging the tabs is a display decision, not a data migration.
 *
 * This list is the frontend's single source of truth: the tab strip renders it,
 * the grid filters curated photos through it, and `curatedGallery.test.js`
 * checks that every curated photo is filed under a name some tab covers. A
 * category that is not in here is effectively invisible — it appears in the
 * opening "everything" view, but no tab can reach it and searching that word
 * disagrees with the grid.
 *
 * `categories` are matched case-insensitively against the backend's
 * GALLERY_CATEGORIES allowlist (`src/main/java/com/macrotel/rapidstylers/config/
 * AppConstants.java`), which stores the same names lowercased and rejects a
 * stylist's portfolio upload outside the list. Adding a name here means adding
 * it there in the same change, or stylists cannot file work under it.
 */
export const GALLERY_TABS = [
  { label: "Locs & dreadlocks", categories: ["Locs", "Dreadlocks"] },
  { label: "Buzz cut", categories: ["Buzz cut"] },
  { label: "Braids", categories: ["Braids"] },
  { label: "Cornrows", categories: ["Cornrows"] },
  { label: "Wigs", categories: ["Wigs"] },
  { label: "High-top fade", categories: ["High-top fade"] },
  { label: "Hair dye", categories: ["Hair dye"] },
  { label: "Nail tech", categories: ["Nail tech"] },
  { label: "Makeup", categories: ["Makeup"] },
  { label: "Eyelash extensions", categories: ["Eyelash extensions"] },
  { label: "Natural hair", categories: ["Natural hair"] },
];

/** Tab labels, in the order they render in the strip. */
export const GALLERY_CATEGORIES = GALLERY_TABS.map((tab) => tab.label);

/**
 * Every backend category name any tab can show. A curated photo filed under
 * something outside this list can never be browsed to, which is what the guard
 * test in `curatedGallery.test.js` fails on.
 */
export const KNOWN_CATEGORIES = GALLERY_TABS.flatMap((tab) => tab.categories);

/**
 * The backend category names a tab shows, in the order to ask the API for them.
 * An unrecognised label falls back to itself rather than throwing: a stale label
 * should show an empty tab, not take the whole gallery down.
 */
export function categoriesForTab(label) {
  const tab = GALLERY_TABS.find((item) => item.label === label);
  return tab ? tab.categories : [label];
}

/** The tab labels a photo filed under `category` appears in. */
export function tabLabelsForCategory(category) {
  return GALLERY_TABS.filter((tab) => tab.categories.includes(category)).map((tab) => tab.label);
}

/** True when a photo filed under `category` belongs in the tab labelled `label`. */
export function isInTab(category, label) {
  return categoriesForTab(label).includes(category);
}

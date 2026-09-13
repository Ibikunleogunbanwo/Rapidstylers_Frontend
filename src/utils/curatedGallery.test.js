import fs from "node:fs";
import path from "node:path";
import {
  CURATED_GALLERY,
  CURATED_FILENAMES,
  ELEVATE_GRID,
  curatedById,
  searchCuratedPhotos,
} from "./curatedGallery";
import {
  GALLERY_CATEGORIES,
  GALLERY_TABS,
  KNOWN_CATEGORIES,
  categoriesForTab,
  isInTab,
} from "./galleryCategories";

/**
 * The curated gallery is a folder of static files plus the list that names them,
 * and nothing else connects the two — a file dropped in but never listed simply
 * never appears, which is exactly the mistake a bulk upload makes. These tests
 * are that connection, so a batch is either wired up or reported.
 */
const GALLERY_DIR = path.join(process.cwd(), "public", "images", "gallery");

describe("curated gallery images", () => {
  test("every listed image exists on disk", () => {
    const missing = CURATED_FILENAMES.filter((name) => !fs.existsSync(path.join(GALLERY_DIR, name)));

    expect(
      missing,
      `These images are listed in src/utils/curatedGallery.js but are not in public/images/gallery/: ${missing.join(", ")}`
    ).toEqual([]);
  });

  test("no image sits in the folder without being listed", () => {
    const listing = fs
      .readdirSync(GALLERY_DIR)
      .filter((name) => !name.startsWith(".") && name !== ".DS_Store");

    const orphans = listing.filter((name) => !CURATED_FILENAMES.includes(name));

    expect(
      orphans,
      `These files are in public/images/gallery/ but no entry in src/utils/curatedGallery.js shows them, so they will never render: ${orphans.join(", ")}`
    ).toEqual([]);
  });

  test("serves plain static paths, not bundled asset hashes", () => {
    CURATED_GALLERY.forEach((entry) => {
      expect(entry.src).toMatch(/^\/images\/gallery\/g-[a-z0-9-]+\.(jpg|jpeg|png|webp)$/);
    });
  });

  test("every entry carries the alt text and category the UI relies on", () => {
    CURATED_GALLERY.forEach((entry) => {
      expect(entry.alt.length).toBeGreaterThan(3);
      expect(entry.category.length).toBeGreaterThan(1);
      expect(entry.photographer).toBe("RapidStylers");
    });
  });

  test("every photo is filed under a category a tab can reach", () => {
    // A category no tab covers is invisible: browsing never filters to it, so the
    // photo only ever appears in the opening "everything" view. This is the check
    // that catches a typo ("Nails" vs "Nail tech") or a new category added here
    // but never added to the backend allowlist.
    const reachable = new Set(KNOWN_CATEGORIES);
    const orphaned = [...new Set(CURATED_GALLERY.map((entry) => entry.category))].filter(
      (category) => !reachable.has(category)
    );

    expect(
      orphaned,
      `No tab in src/utils/galleryCategories.js covers these categories, so no tab can show those photos: ${orphaned.join(", ")}`
    ).toEqual([]);
  });

  test("no photo is filed under a category twice over, or under a tab label that is not a tab", () => {
    CURATED_GALLERY.forEach((entry) => {
      const labels = GALLERY_TABS.filter((tab) => tab.categories.includes(entry.category));
      expect(labels.length).toBe(1);
    });
  });

  test("the category list has no duplicates or blank entries", () => {
    expect(GALLERY_CATEGORIES.length).toBe(new Set(GALLERY_CATEGORIES).size);
    GALLERY_CATEGORIES.forEach((category) => expect(category.trim()).toBe(category));
    expect(GALLERY_CATEGORIES.filter((category) => category.length === 0)).toEqual([]);
  });

  test("every tab resolves to backend category names", () => {
    GALLERY_TABS.forEach((tab) => {
      expect(tab.categories.length).toBeGreaterThan(0);
      expect(categoriesForTab(tab.label)).toEqual(tab.categories);
    });
  });

  test("dreadlocks and locs are one tab, covering both backend names", () => {
    // Visitors don't read these as separate sections, and the merged tab has to
    // keep querying the backend for BOTH names — passing the label would be
    // rejected, and passing one name would hide the other's work.
    const merged = GALLERY_TABS.filter((tab) => tab.categories.includes("Dreadlocks"));
    expect(merged).toHaveLength(1);
    expect(merged[0].categories).toEqual(["Locs", "Dreadlocks"]);
    expect(GALLERY_CATEGORIES).toContain(merged[0].label);
    expect(GALLERY_CATEGORIES).not.toContain("Dreadlocks");
    expect(GALLERY_CATEGORIES).not.toContain("Locs");
    expect(isInTab("Dreadlocks", merged[0].label)).toBe(true);
    expect(isInTab("Locs", merged[0].label)).toBe(true);
  });

  test("the landing strip resolves to entries in this list", () => {
    expect(ELEVATE_GRID.length).toBeGreaterThan(0);
    ELEVATE_GRID.forEach((tile) => {
      expect(tile.src).toMatch(/^\/images\/gallery\//);
      expect(tile.alt.length).toBeGreaterThan(3);
    });
  });

  test("an unknown id fails loudly instead of rendering a broken image", () => {
    expect(() => curatedById("g-does-not-exist")).toThrow(/No curated gallery image/);
  });
});

/**
 * The gallery's search box reads this list, not the API — production returns no
 * stylist uploads at all, so keyword search used to answer every query with
 * "No results". These pin what a visitor typing at the grid can find.
 */
describe("curated gallery search", () => {
  const ids = (query) => searchCuratedPhotos(query).map((entry) => entry.id);

  test("finds photos by the words in their alt text", () => {
    expect(ids("auburn")).toContain("g-braids-5");
    expect(ids("french")).toContain("g-nails-6");
    expect(ids("stiletto")).toContain("g-nails-7");
  });

  test("matches the category name, so a tab word is searchable", () => {
    expect(ids("nail tech")).toContain("g-nails-1");
    expect(ids("cornrows")).toContain("g-cornrows-1");
  });

  test("a merged tab's other name still finds its photos", () => {
    // Clicking "Locs & dreadlocks" and typing "dreadlocks" have to agree.
    expect(ids("dreadlocks")).toEqual(expect.arrayContaining(["g-locs-1", "g-locs-2"]));
    expect(ids("locs")).toEqual(expect.arrayContaining(["g-locs-1", "g-locs-2"]));
  });

  test("folds plurals, so a natural query reaches the stored wording", () => {
    // Nobody types "eyelash"; they type "lashes".
    expect(ids("lashes").length).toBeGreaterThan(0);
    expect(ids("braids")).toContain("g-braids-5");
    expect(ids("eyelash extension application")).toEqual(["g-lashes-5"]);
  });

  test("every keyword must match, so extra words narrow the result", () => {
    const broad = ids("braid");
    expect(broad.length).toBeGreaterThan(1);
    expect(ids("braid sunglasses")).toEqual([]);
  });

  test("searches nothing when there is no keyword", () => {
    expect(searchCuratedPhotos("")).toEqual([]);
    expect(searchCuratedPhotos("   ")).toEqual([]);
    expect(searchCuratedPhotos(null)).toEqual([]);
  });

  test("ignores single characters instead of matching the whole gallery", () => {
    expect(searchCuratedPhotos("a")).toEqual([]);
  });

  test("every listed photo is findable by its own category name", () => {
    // A tab's name has to work in the search box, otherwise clicking a category
    // and searching that same word look like they disagree.
    const unfindable = CURATED_GALLERY.filter(
      (entry) => !searchCuratedPhotos(entry.category).some((match) => match.id === entry.id)
    ).map((entry) => entry.id);

    expect(
      unfindable,
      `These photos cannot be found by searching their own category: ${unfindable.join(", ")}`
    ).toEqual([]);
  });

  test("only ever returns entries from the curated list", () => {
    const matches = searchCuratedPhotos("bob");
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((entry) => expect(CURATED_GALLERY).toContain(entry));
  });
});

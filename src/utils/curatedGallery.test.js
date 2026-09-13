import fs from "node:fs";
import path from "node:path";
import { CURATED_GALLERY, CURATED_FILENAMES, ELEVATE_GRID, curatedById } from "./curatedGallery";

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

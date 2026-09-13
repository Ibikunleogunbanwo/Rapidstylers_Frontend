#!/usr/bin/env python3
"""Import a folder of photos into the curated gallery, under one category.

Adding a photo by hand means three things agreeing — the file on disk, its
filename, and the entry in `src/utils/curatedGallery.js` — and one of them is a
category name that silently makes the photo unreachable if it is wrong. This
does all three, and refuses to run on a category the gallery has no tab for.

What it does for each source image:

  * EXIF-rotates it, flattens transparency onto white, converts to RGB.
  * Downscales so the long edge is at most 1400px (never upscales), then saves
    JPEG q82 with metadata stripped.
  * Writes it to `public/images/gallery/<prefix>-<n>.jpg`, continuing the
    numbering already in use so a second drop does not overwrite a first.
  * Appends one entry per photo to `CURATED` in `curatedGallery.js`.

Alt text is the gallery's search index, so it matters. Supply it with
`--alts-file` (one `filename<TAB>alt text` per line); without it the script
derives something from the filename and prints every derived alt so you can fix
the ones that read like `b65bdcd1 5901 4f9b a279 911720982c72`.

Examples:

    # See the plan, write nothing.
    python3 scripts/import-gallery-images.py --category Wigs --source ~/incoming --dry-run

    # Import with hand-written alt text.
    python3 scripts/import-gallery-images.py --category Wigs --source ~/incoming \\
        --alts-file ~/incoming/alts.txt

Requires Pillow (python3 -m pip install Pillow). The guard test afterwards is
`npx vitest run src/utils/curatedGallery.test.js`.
"""

import argparse
import pathlib
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover - environment problem, not logic
    sys.exit("Pillow is required: python3 -m pip install Pillow")

REPO = pathlib.Path(__file__).resolve().parent.parent
GALLERY_DIR = REPO / "public" / "images" / "gallery"
LIST_PATH = REPO / "src" / "utils" / "curatedGallery.js"
CATEGORIES_PATH = REPO / "src" / "utils" / "galleryCategories.js"
FEATURE = "curatedGallery.js"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff", ".bmp"}
BATCH_MARKER = "// Imported batches below — alt text is the gallery's search index."


def categories():
    """The tab names, read from the one file that owns them."""
    names = re.findall(r'^\s*"([^"]+)",', CATEGORIES_PATH.read_text(), re.MULTILINE)
    if not names:
        sys.exit(f"No categories found in {CATEGORIES_PATH.relative_to(REPO)}")
    return names


def existing_ids():
    return re.findall(r'id:\s*"([^"]+)"', LIST_PATH.read_text())


def next_index(prefix, ids):
    """Continue numbering after the highest `<prefix>-<n>` already listed."""
    used = []
    for entry_id in ids:
        match = re.fullmatch(re.escape(prefix) + r"-(\d+)", entry_id)
        if match:
            used.append(int(match.group(1)))
    return (max(used) + 1) if used else 1


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def derive_alt(filename):
    """A filename is rarely a sentence; this is a starting point, not the answer."""
    stem = pathlib.Path(filename).stem
    stem = re.sub(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "", stem, flags=re.I)
    stem = re.sub(r"\b(unsplash|pexels|gettyimages|img|dsc|image|copy)\b", "", stem, flags=re.I)
    stem = re.sub(r"[_\-.]+", " ", stem)
    words = [w for w in stem.split() if not re.fullmatch(r"[0-9]+", w)]
    return " ".join(words).strip().capitalize()


def load_alts(path):
    """`filename<TAB>alt` lines; keys are matched on the bare filename."""
    alts = {}
    for number, line in enumerate(pathlib.Path(path).expanduser().read_text().splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if "\t" not in line:
            sys.exit(f"{path}:{number}: expected `<filename><TAB><alt text>`")
        name, alt = line.split("\t", 1)
        alts[name.strip()] = alt.strip()
    return alts


def sources(root):
    root = pathlib.Path(root).expanduser()
    if not root.exists():
        sys.exit(f"No such file or folder: {root}")
    files = [root] if root.is_file() else sorted(p for p in root.iterdir() if p.is_file())
    return [f for f in files if f.suffix.lower() in IMAGE_SUFFIXES and not f.name.startswith(".")]


def normalise(path, destination, long_edge, quality):
    """EXIF-correct, downscale-only, metadata-free JPEG. Returns (before, after) sizes."""
    before = path.stat().st_size
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode in ("RGBA", "LA", "P"):
            image = image.convert("RGBA")
            canvas = Image.new("RGB", image.size, (255, 255, 255))
            canvas.paste(image, mask=image.split()[-1])
            image = canvas
        elif image.mode != "RGB":
            image = image.convert("RGB")
        width, height = image.size
        if max(width, height) > long_edge:
            scale = long_edge / max(width, height)
            image = image.resize((round(width * scale), round(height * scale)), Image.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "JPEG", quality=quality, optimize=True, progressive=True)
    return before, destination.stat().st_size


def quote(value):
    return value.replace("\\", "\\\\").replace('"', '\\"')


def main():
    parser = argparse.ArgumentParser(description="Import photos into the curated gallery.")
    parser.add_argument("--category", required=True, help="A tab name from src/utils/galleryCategories.js")
    parser.add_argument("--source", required=True, help="File or folder of images")
    parser.add_argument("--prefix", help="Id prefix, e.g. g-wigs (default: derived from the category)")
    parser.add_argument("--alts-file", help="<filename><TAB><alt text> per line")
    parser.add_argument("--long-edge", type=int, default=1400)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--dry-run", action="store_true", help="Print the plan; write nothing")
    args = parser.parse_args()

    valid = categories()
    if args.category not in valid:
        sys.exit(
            f'"{args.category}" is not a gallery tab, so the photos would be unreachable '
            f"(no tab filters to it).\nValid categories: {', '.join(valid)}"
        )

    entries = sources(args.source)
    if not entries:
        sys.exit(f"No images found in {args.source}")

    prefix = args.prefix or f"g-{slug(args.category)}"
    ids = existing_ids()
    start = next_index(prefix, ids)
    alts = load_alts(args.alts_file) if args.alts_file else {}

    # A filename like "b65bdcd1-5901-4f9b-..." carries no description, so there is
    # nothing honest to put in the alt text. Report every such file at once rather
    # than failing on the first, so one alts file covers the drop.
    undescribed = [path.name for path in entries if not (alts.get(path.name) or derive_alt(path.name))]
    if undescribed:
        sys.exit(
            "These files are named like IDs, not photos, so there is no alt text to\n"
            "derive (alt text is what the gallery search matches). Write a\n"
            "`<filename><TAB><alt text>` file and pass it with --alts-file:\n  "
            + "\n  ".join(undescribed)
        )

    planned, derived = [], []
    for offset, path in enumerate(entries):
        entry_id = f"{prefix}-{start + offset}"
        if entry_id in ids:
            sys.exit(f"{entry_id} already exists — bump --prefix or clear the folder")
        alt = alts.get(path.name) or derive_alt(path.name)
        if path.name not in alts:
            derived.append((entry_id, alt))
        planned.append((path, entry_id, alt))

    print(f"category : {args.category}")
    print(f"prefix   : {prefix} (continuing at {start})")
    print(f"images   : {len(planned)}")
    for path, entry_id, alt in planned:
        print(f"  {path.name}  ->  {entry_id}.jpg   alt: {alt}")

    if derived:
        print("\nWARNING: these alt texts came from filenames and are the search index —")
        print("         rewrite them to describe the photo before you commit:")
        for entry_id, alt in derived:
            print(f"  {entry_id}: {alt}")

    if args.dry_run:
        print("\ndry run: nothing written")
        return

    for path, entry_id, _ in planned:
        destination = GALLERY_DIR / f"{entry_id}.jpg"
        before, after = normalise(path, destination, args.long_edge, args.quality)
        print(f"wrote {destination.relative_to(REPO)}  {before // 1024}KB -> {after // 1024}KB")

    text = LIST_PATH.read_text()
    lines = "".join(
        f'  {{ id: "{entry_id}", alt: "{quote(alt)}", category: "{args.category}" }},\n'
        for _, entry_id, alt in planned
    )
    if FEATURE and BATCH_MARKER not in text:
        lines = f"\n  {BATCH_MARKER}\n" + lines
    anchor = "\n];\n"
    if anchor not in text:
        sys.exit(f"Could not find the end of the CURATED array in {LIST_PATH.relative_to(REPO)}")
    LIST_PATH.write_text(text.replace(anchor, f"\n{lines}];\n", 1))

    print(f"\nlisted {len(planned)} photo(s) in {LIST_PATH.relative_to(REPO)}")
    print("now: npx vitest run src/utils/curatedGallery.test.js")


if __name__ == "__main__":
    main()

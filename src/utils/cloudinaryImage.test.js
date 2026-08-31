import {
  cloudinaryImage,
  cloudinaryCard,
  cloudinarySquare,
  cloudinaryAvatar,
  cloudinaryBlog
} from "./cloudinaryImage";

describe("cloudinaryImage", () => {
  const CLOUD =
    "https://res.cloudinary.com/acme/image/upload/v1610000001/portfolio/x.jpg";

  test("injects a fill/smart-gravity transform at the correct aspect for a card", () => {
    const out = cloudinaryCard(CLOUD);
    expect(out).toContain("/image/upload/c_fill,g_auto,ar_16:9,w_640,q_auto,f_auto/v1610000001/portfolio/x.jpg");
  });

  test("square preset uses a 1:1 crop", () => {
    expect(cloudinarySquare(CLOUD)).toContain("ar_1:1");
  });

  test("avatar preset is face-focused on a 1:1 square", () => {
    const out = cloudinaryAvatar(CLOUD);
    expect(out).toContain("c_fill,g_face");
    expect(out).toContain("ar_1:1");
    expect(out).toContain("w_160");
  });

  test("blog preset uses 16:9", () => {
    expect(cloudinaryBlog(CLOUD)).toContain("ar_16:9");
  });

  test("non-Cloudinary URLs pass through untouched", () => {
    const local = "/static/local-preview.jpg";
    const external = "https://cdn.example.com/pic.png";
    expect(cloudinaryImage(local, "card")).toBe(local);
    expect(cloudinaryImage(external, "card")).toBe(external);
  });

  test("empty or missing URL stays empty", () => {
    expect(cloudinaryImage("", "card")).toBe("");
    expect(cloudinaryImage(null, "card")).toBe("");
    expect(cloudinaryImage(undefined, "card")).toBe("");
  });
});
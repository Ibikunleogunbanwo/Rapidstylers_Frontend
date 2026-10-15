import { BLOG_FALLBACK_IMAGE, blogImageSrc, isFreepikUrl, safeBlogImage } from "./blogImage";

describe("blog images", () => {
  test("recognises freepik hosts, and only those", () => {
    expect(isFreepikUrl("https://img.freepik.com/free-photo/x.jpg?w=826")).toBe(true);
    expect(isFreepikUrl("https://www.freepik.com/photo/x.jpg")).toBe(true);
    expect(isFreepikUrl("https://IMG.FREEPIK.COM/a.jpg")).toBe(true);
    expect(isFreepikUrl("https://res.cloudinary.com/demo/image/upload/v1/a.jpg")).toBe(false);
    expect(isFreepikUrl("https://notfreepik.com/a.jpg")).toBe(false);
    expect(isFreepikUrl("/images/gallery/g-braids-2.jpg")).toBe(false);
    expect(isFreepikUrl("")).toBe(false);
  });

  test("a freepik or missing image renders the local fallback", () => {
    expect(safeBlogImage("https://img.freepik.com/free-photo/x.jpg")).toBe(BLOG_FALLBACK_IMAGE);
    expect(blogImageSrc("https://img.freepik.com/free-photo/x.jpg")).toBe(BLOG_FALLBACK_IMAGE);
    expect(blogImageSrc("")).toBe(BLOG_FALLBACK_IMAGE);
    expect(BLOG_FALLBACK_IMAGE.startsWith("/")).toBe(true);
  });

  test("other images pass through, Cloudinary ones cropped for the blog", () => {
    expect(safeBlogImage("/images/gallery/g-nails-1.jpg")).toBe("/images/gallery/g-nails-1.jpg");
    expect(blogImageSrc("https://res.cloudinary.com/demo/image/upload/v1/a.jpg")).toContain("/image/upload/c_fill,");
  });
});

 test("seeded article titles get distinct images, while custom images stay intact", async () => {
  const { ARTICLE_IMAGES, articleImageFallback } = await import("./blogImage");
  expect(new Set(Object.values(ARTICLE_IMAGES)).size).toBe(4);
  for (const [title, image] of Object.entries(ARTICLE_IMAGES)) {
    expect(blogImageSrc("", articleImageFallback(title))).toBe(image);
    expect(blogImageSrc("https://img.freepik.com/old.jpg", articleImageFallback(title))).toBe(image);
    expect(blogImageSrc("https://cdn.example/custom.jpg", articleImageFallback(title))).toBe("https://cdn.example/custom.jpg");
  }
 });

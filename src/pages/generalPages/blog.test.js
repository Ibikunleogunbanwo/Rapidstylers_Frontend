import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Blog from "./blog";
import BlogPost from "./blogPost";
import { APIService } from "../../hooks/remote/apiService";
import { fetchBlogPost } from "../../hooks/remote/publicContentApi";
import { BLOG_FALLBACK_IMAGE } from "../../utils/blogImage";

vi.mock("../../components/publicHeader", () => ({ default: () => null }));
vi.mock("../../components/footer", () => ({ default: () => null }));
vi.mock("../../components/adSlot", () => ({ default: () => null }));
vi.mock("../../hooks/remote/apiService", () => ({ APIService: { listBlog: vi.fn() } }));
vi.mock("../../hooks/remote/publicContentApi", () => ({
  fetchBlogPost: vi.fn(),
  isServerAnswer: (error) => Boolean(error?.response),
}));

const FREEPIK = "https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?w=826";

/**
 * The offline fallbacks used to hotlink watermarked freepik images, and seeded
 * posts from the API still carry them. Neither may reach the page.
 */
describe("blog images never hotlink freepik", () => {
  test("the offline list renders topic-specific editorial photos", async () => {
    APIService.listBlog.mockRejectedValue(new Error("offline"));
    const { container } = render(<MemoryRouter><Blog /></MemoryRouter>);
    await screen.findByText("Quick and Easy Hairstyles for Busy Mornings");
    const srcs = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"));
    expect(srcs).toHaveLength(4);
    srcs.forEach((src) => expect(src).toMatch(/^\/images\/blog\/[a-z-]+\.jpg$/));
  });

  test("a freepik image from the API shows the local fallback", async () => {
    APIService.listBlog.mockResolvedValue({ data: { data: [{ id: 9, title: "Seeded", imageUrl: FREEPIK }] } });
    const { container } = render(<MemoryRouter><Blog /></MemoryRouter>);
    await screen.findByText("Seeded");
    expect(container.querySelector("img").getAttribute("src")).toBe(BLOG_FALLBACK_IMAGE);
  });

  test("an article with a freepik image shows the local fallback", async () => {
    fetchBlogPost.mockResolvedValue({ data: { data: { id: 9, title: "Seeded", content: "Body", imageUrl: FREEPIK } } });
    render(
      <MemoryRouter initialEntries={["/blog/9"]}>
        <Routes><Route path="/blog/:id" element={<BlogPost />} /></Routes>
      </MemoryRouter>
    );
    expect(await screen.findByRole("img", { name: "Seeded" })).toHaveAttribute("src", BLOG_FALLBACK_IMAGE);
  });

  test("the offline article uses a local photo", async () => {
    fetchBlogPost.mockRejectedValue(new Error("offline"));
    render(
      <MemoryRouter initialEntries={["/blog/1"]}>
        <Routes><Route path="/blog/:id" element={<BlogPost />} /></Routes>
      </MemoryRouter>
    );
    const img = await screen.findByRole("img", { name: /Ultimate Guide to Braiding/ });
    expect(img.getAttribute("src")).toBe("/images/blog/braiding.jpg");
  });

  test("no blog source file hotlinks freepik", () => {
    ["blog.js", "blogPost.js", "landing.js"].forEach((file) => {
      const source = readFileSync(resolve(__dirname, file), "utf8");
      expect(source).not.toMatch(/https?:\/\/[^"'\s]*freepik/);
    });
  });
});

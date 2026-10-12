import { PageHeading } from "./pageSections";
import { blogImageSrc } from "../utils/blogImage";

/**
 * An article as readers see it: category eyebrow, title, byline, cover image
 * and the paragraphs (one per line of content). The public article page and
 * the admin preview both render it, so a preview cannot drift from the page.
 */
const BlogArticle = ({ post }) => {
  const paragraphs = String(post.content || "").split("\n").filter((p) => p.trim());
  return (
    <>
      <PageHeading
        eyebrow={post.category}
        title={post.title}
        lead={`By ${post.author || "RapidStylers Team"} · ${post.dateCreated || ""}`}
      />
      {post.imageUrl && (
        <img
          src={blogImageSrc(post.imageUrl)}
          alt={post.title || ""}
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      )}
      <article className="mt-12 max-w-[680px] space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[14px] leading-[1.75] text-black/70">
            {p}
          </p>
        ))}
      </article>
    </>
  );
};

export default BlogArticle;

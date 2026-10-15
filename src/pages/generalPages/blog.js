import { useEffect, useState } from "react";
import PublicHeader from "../../components/publicHeader";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";
import { Section, PageHeading, BackHome } from "../../components/pageSections";
import { APIService } from "../../hooks/remote/apiService";
import { blogImageSrc, articleImageFallback } from "../../utils/blogImage";

// Fallback used only when the backend is unreachable — mirrors the seeded posts.
// Generated editorial images illustrate these topics; they are not stylist portfolio work.
const FALLBACK_POSTS = [
  {
    id: 1,
    img: "/images/blog/braiding.jpg",
    cat: "Braiding",
    title: "The Ultimate Guide to Braiding: From Basic to Intricate Styles",
    date: "May 29, 2024",
  },
  {
    id: 2,
    img: "/images/blog/morning-styles.jpg",
    cat: "Styling",
    title: "Quick and Easy Hairstyles for Busy Mornings",
    date: "May 29, 2024",
  },
  {
    id: 3,
    img: "/images/blog/healthy-hair.jpg",
    cat: "Hair Care",
    title: "Healthy Hair Tips: Essential Care and Maintenance Guide",
    date: "May 29, 2024",
  },
  {
    id: 4,
    img: "/images/blog/short-hair.jpg",
    cat: "Trends",
    title: "Short and Chic: Modern Hairstyles for Short Haircuts",
    date: "May 29, 2024",
  },
];

const normalize = (post) => ({
  id: post.id,
  img: post.imageUrl || post.img || "",
  cat: post.category || post.cat || "Article",
  title: post.title || "Untitled",
  date: post.dateCreated || post.date || "",
});

const Blog = () => {
  document.title = "Blog | RapidStylers";
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    let mounted = true;
    APIService.listBlog()
      .then((res) => {
        if (mounted && Array.isArray(res.data?.data)) {
          setPosts(res.data.data.map(normalize));
        }
      })
      .catch(() => {
        /* fall back to static posts */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const visiblePosts = posts === null ? FALLBACK_POSTS : posts;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader spacer />
      <Section pad="pt-10 md:pt-14 pb-2">
        <BackHome />
        <PageHeading
          eyebrow="From the blog"
          title="Get inspired with RapidStylers"
          lead="Helpful articles written by beauty professionals."
        />
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {visiblePosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.id}`}
              className="group"
            >
              <div className="aspect-[4/5] overflow-hidden bg-neutral">
                <img
                  src={blogImageSrc(post.img, articleImageFallback(post.title))}
                  alt={post.title || ""}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="pt-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{post.cat}</span>
                <p className="mt-2 text-[15px] leading-snug text-onSurface">{post.title}</p>
                <p className="mt-2 text-[12px] text-black/45">{post.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default Blog;

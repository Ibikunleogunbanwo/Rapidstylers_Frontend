import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";
import { Section, PageHeading, BackHome } from "../../components/pageSections";
import { APIService } from "../../hooks/remote/apiService";
import { cloudinaryBlog } from "../../utils/cloudinaryImage";

// Fallback used only when the backend is unreachable — mirrors the seeded posts.
const FALLBACK_POSTS = [
  {
    id: 1,
    img: "https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649874.jpg?w=826",
    cat: "Braiding",
    title: "The Ultimate Guide to Braiding: From Basic to Intricate Styles",
    date: "May 29, 2024",
  },
  {
    id: 2,
    img: "https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?t=st=1708868604~exp=1708872204~hmac=a724d6651959e05a587b791dba7dbab024b8dc529d20566c14741d134583e345&w=826",
    cat: "Styling",
    title: "Quick and Easy Hairstyles for Busy Mornings",
    date: "May 29, 2024",
  },
  {
    id: 3,
    img: "https://img.freepik.com/free-photo/medium-shot-woman-arranging-hair_23-2149634993.jpg?t=st=1708868767~exp=1708872367~hmac=44c9b42f97f98a74588368862e364a6e2f7938b61e1563dcc8fd3ef51b42be57&w=826",
    cat: "Hair Care",
    title: "Healthy Hair Tips: Essential Care and Maintenance Guide",
    date: "May 29, 2024",
  },
  {
    id: 4,
    img: "https://img.freepik.com/free-photo/cool-girl-with-short-hair-looking-into-camera-background-white-backdrop-brunette-lady-with-glass-beige-outside-posing-backdrop-wall_197531-29357.jpg?t=st=1708868867~exp=1708872467~hmac=8acc269316521de8d8e9ca7cf302d3ef600de561bee3350a281a67bd7644845a&w=826",
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
      <Section pad="pt-32 pb-2">
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
                  src={cloudinaryBlog(post.img)}
                  alt=""
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

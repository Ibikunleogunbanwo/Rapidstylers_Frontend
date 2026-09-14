import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../../components/footer";
import AdSlot from "../../components/adSlot";
import { Section, PageHeading, BackHome } from "../../components/pageSections";
import { APIService } from "../../hooks/remote/apiService";
import { cloudinaryBlog } from "../../utils/cloudinaryImage";

// Fallback used only when the backend is unreachable — mirrors the seeded posts.
const FALLBACK_POSTS = [
  {
    id: 1,
    title: "The Ultimate Guide to Braiding: From Basic to Intricate Styles",
    category: "Braiding",
    dateCreated: "May 29, 2024",
    imageUrl: "https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649874.jpg?w=826",
    author: "RapidStylers Team",
    content:
      "Braids are one of the most versatile protective styles you can wear. Whether you are new to braiding or have been doing it for years, there is always something new to learn about technique, maintenance and styling.\n\nStart with the basics: box braids, cornrows and plaits form the foundation of most intricate looks. Each style starts the same way, with clean, detangled hair and a light leave-in conditioner. Section the hair into even parts and keep tension consistent from root to tip so the braid lies flat and lasts longer.\n\nFor intricate styles like feed-in braids, knotless braids or braided updos, patience is everything. Work in small sections, use a good edge control for a clean hairline, and seal the ends with hot water or a product of your choice.\n\nMaintenance matters just as much as the braiding itself. Sleep with a satin scarf or bonnet, oil your scalp every few days, and wash your braids with a diluted shampoo every couple of weeks. With the right care, a great set of braids can last four to eight weeks and keep your natural hair protected underneath.",
  },
  {
    id: 2,
    title: "Quick and Easy Hairstyles for Busy Mornings",
    category: "Styling",
    dateCreated: "May 29, 2024",
    imageUrl: "https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?t=st=1708868604~exp=1708872204~hmac=a724d6651959e05a587b791dba7dbab024b8dc529d20566c14741d134583e345&w=826",
    author: "RapidStylers Team",
    content:
      "Mornings are short and your hair should not be the reason you run late. With a few simple styles in your back pocket, you can look polished in five minutes flat.\n\nA sleek low bun never fails. Brush the hair back, smooth it down with a little oil or gel, and twist it into a bun at the nape of your neck. Secure with a scrunchie and you are done.\n\nThe claw clip is your best friend for busy days. Gather your hair loosely, twist it upward and clip it in place. Leave a few face-framing pieces out for a relaxed, effortless look.\n\nHalf up, half down is another quick win. Take the top half of your hair, secure it with a clip or band, and let the rest fall naturally. It works on almost every hair length and texture.\n\nThe secret to all of these styles is preparation. Keep a few dry shampoos, oils and accessories on hand, and give your hair a quick detangle the night before. Ten minutes of prep saves you twenty in the morning.",
  },
  {
    id: 3,
    title: "Healthy Hair Tips: Essential Care and Maintenance Guide",
    category: "Hair Care",
    dateCreated: "May 29, 2024",
    imageUrl: "https://img.freepik.com/free-photo/medium-shot-woman-arranging-hair_23-2149634993.jpg?t=st=1708868767~exp=1708872367~hmac=44c9b42f97f98a74588368862e364a6e2f7938b61e1563dcc8fd3ef51b42be57&w=826",
    author: "RapidStylers Team",
    content:
      "Healthy hair starts with a healthy routine, and the basics matter more than expensive products. Hydration, gentle handling and consistency will take your hair further than any miracle bottle.\n\nWash according to your hair type, not a fixed schedule. Oily scalps may need washing every few days, while dry or curly textures often do better every one to two weeks. Always follow with a conditioner and let your hair air dry when you can.\n\nMoisture is the foundation of elasticity. Use a leave-in conditioner or light oil on damp hair, and seal it in with a cream or butter if your hair is particularly dry. Deep conditioning once a month keeps strands strong and soft.\n\nTrim regularly. Even if you are growing your hair out, a trim every eight to twelve weeks removes split ends before they travel up the strand.\n\nFinally, protect your hair while you sleep. A satin pillowcase or bonnet reduces friction and prevents breakage, and it is the single easiest change you can make for healthier hair.",
  },
  {
    id: 4,
    title: "Short and Chic: Modern Hairstyles for Short Haircuts",
    category: "Trends",
    dateCreated: "May 29, 2024",
    imageUrl: "https://img.freepik.com/free-photo/cool-girl-with-short-hair-looking-into-camera-background-white-backdrop-brunette-lady-with-glass-beige-outside-posing-backdrop-wall_197531-29357.jpg?t=st=1708868867~exp=1708872467~hmac=8acc269316521de8d8e9ca7cf302d3ef600de561bee3350a281a67bd7644845a&w=826",
    author: "RapidStylers Team",
    content:
      "Short hair is having a moment, and it is easier to style than most people think. From sleek bobs to bold pixies, there is a short cut for every face shape and personality.\n\nThe classic bob sits anywhere from the chin to the shoulders and frames the face beautifully. Ask your stylist for a cut that suits your texture, whether that is blunt, layered or angled.\n\nThe pixie is the ultimate statement cut. It is low maintenance, dries in minutes, and pairs well with bold accessories. A little texturizing spray gives it that effortless, piecey finish.\n\nThe shag works on short and medium lengths alike. Layers and soft fringe add movement, making thin hair look fuller and thick hair easier to manage.\n\nShort hair needs regular trims every four to six weeks to hold its shape, but the styling time you save is worth it. Talk to your stylist about what works for your hair type and lifestyle, and do not be afraid to try something new.",
  },
];

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setPost(null);
    setNotFound(false);
    APIService.singleBlog(id)
      .then((res) => {
        if (!mounted) return;
        if (res.data?.data && res.data.data.id) {
          setPost(res.data.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
        const fallback = FALLBACK_POSTS.find((p) => String(p.id) === String(id));
        if (fallback) setPost(fallback);
        else setNotFound(true);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  document.title = post ? `${post.title} | RapidStylers` : "Blog | RapidStylers";

  if (notFound) {
    return (
      <div className="min-h-screen bg-white">
        <Section pad="pt-24 pb-24" className="text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted">404</p>
          <h1 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
            Article not found
          </h1>
          <p className="mt-4 text-[13px] leading-[1.55] text-black/55">
            This article may have been removed.
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Back to the blog
          </Link>
        </Section>
      </div>
    );
  }

  if (!post) {
    return <div className="min-h-screen bg-white" />;
  }

  const paragraphs = String(post.content || "").split("\n").filter((p) => p.trim());

  return (
    <div className="min-h-screen bg-white">
      <Section pad="pt-32 pb-6">
        <BackHome label="All articles" to="/blog" />
        <PageHeading
          eyebrow={post.category}
          title={post.title}
          lead={`By ${post.author || "RapidStylers Team"} \u00b7 ${post.dateCreated || ""}`}
        />
        {post.imageUrl && (
          <img
            src={cloudinaryBlog(post.imageUrl)}
            alt=""
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
        <AdSlot slot="blog_in_article" style={{ marginTop: "1.5rem" }} />
        <div className="mt-12 border-t border-black/10 pt-8">
          <Link
            to="/blog"
            className="text-[13px] underline underline-offset-4 transition-colors hover:text-brand"
          >
            Back to all articles
          </Link>
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default BlogPost;

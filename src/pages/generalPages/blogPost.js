import { useEffect, useState } from "react";
import PublicHeader from "../../components/publicHeader";
import { Link, useParams } from "react-router-dom";
import Footer from "../../components/footer";
import AdSlot from "../../components/adSlot";
import { Section, BackHome } from "../../components/pageSections";
import BlogArticle from "../../components/blogArticle";
import { fetchBlogPost, isServerAnswer } from "../../hooks/remote/publicContentApi";
import { useNoIndex } from "./notFound";

// Fallback used only when the backend is unreachable — mirrors the seeded posts.
// Generated editorial images illustrate these topics; they are not stylist portfolio work.
const FALLBACK_POSTS = [
  {
    id: 1,
    title: "The Ultimate Guide to Braiding: From Basic to Intricate Styles",
    category: "Braiding",
    dateCreated: "May 29, 2024",
    imageUrl: "/images/blog/braiding.jpg",
    author: "RapidStylers Team",
    content:
      "Before choosing a braid style, think about how you wear your hair each day. Do you need to tie it back for work? Would you rather have fewer, larger braids or a smaller pattern? Bring a few reference photos to your appointment and ask your braider what is realistic for your current length and texture.\n\nBox braids have separate sections and can be worn loose or gathered up. Cornrows sit close to the scalp and follow a planned pattern. A braided bun or another detailed design takes more planning, so ask how long the appointment will take and whether extensions are included in the price.\n\nCheck the preparation instructions before appointment day. Your braider may ask you to arrive with your hair washed, dry and detangled, or may include that preparation in the service. Confirm this before you start styling at home. Tell them about any products that have irritated your scalp or any areas you want handled gently.\n\nThe finished style should feel comfortable. Speak up during the appointment if a section pulls or feels too tight. A neat finish does not need to come at the expense of comfort, and it is easier to adjust a section while your braider is still working.\n\nBefore you leave, ask how to wash and dry the style, what products to use and how to protect it while sleeping. Advice can vary with the braid pattern, your own hair and the extension material. Avoid adding several new products at once just because they are recommended online.\n\nPlan the removal as carefully as the appointment. Ask when your braider recommends taking the style down and whether they offer removal. Give yourself enough time to undo the braids without rushing. If the style becomes uncomfortable, contact your braider rather than waiting for the planned removal date.",
  },
  {
    id: 2,
    title: "Quick and Easy Hairstyles for Busy Mornings",
    category: "Styling",
    dateCreated: "May 29, 2024",
    imageUrl: "/images/blog/morning-styles.jpg",
    author: "RapidStylers Team",
    content:
      "A useful morning hairstyle is one you can do with the hair you have today. Keep a soft hair tie, a few pins and a clip where you get ready. Choose one familiar style for rushed mornings rather than trying a new technique when you are already watching the clock.\n\nFor a loose low bun, gather your hair at the nape of your neck, secure it gently and tuck the ends around the base. Add a pin where it needs support. If you like a softer finish, leave the front slightly loose instead of brushing everything tightly back.\n\nA clip can hold a simple twist without needing a perfect part. Gather the hair, twist it loosely and secure the section the clip can comfortably hold. Choose a clip that suits the amount of hair you have. If it keeps slipping or feels heavy, try a smaller section rather than forcing it shut.\n\nFor a half up style, gather a small section from each side and secure it behind your head. Leave the rest as it is. Start with less hair than you think you need, then adjust the shape in the mirror. A small clip or a few pins may be enough.\n\nWith short hair, focus on one detail. Tidy your part, pin back the front or use a little of a styling product you already know works for you. You do not need to restyle the entire cut to make it feel ready for the day.\n\nTry your preferred style once when you are not in a rush. Notice which accessory holds it and which steps you can skip. If you are booking a haircut, tell your stylist how much time you actually want to spend getting ready and ask them to show you a simple routine before you leave.",
  },
  {
    id: 3,
    title: "Healthy Hair Tips: Essential Care and Maintenance Guide",
    category: "Hair Care",
    dateCreated: "May 29, 2024",
    imageUrl: "/images/blog/healthy-hair.jpg",
    author: "RapidStylers Team",
    content:
      "A workable hair routine should answer a few simple questions: how does your scalp feel, how easy is your hair to manage and which products are you actually using? Start with what you notice rather than buying a complete new routine at once.\n\nPay attention to your scalp when deciding when to wash. Sweat, styling products and your own preferences all affect what feels comfortable. If your current routine leaves buildup or feels too drying, adjust one part of it and see how your hair responds. There is no single wash schedule that suits everyone.\n\nChoose a conditioner you find easy to use and follow its instructions. Detangle patiently, working in manageable sections rather than pulling through a large knot. Ask your stylist to demonstrate a method that suits your hair if detangling is consistently difficult.\n\nKeep styling simple enough to repeat. Before using a heat tool, check its instructions and the directions on any styling product. Tell your stylist how often you use heat, colour your hair or wear extensions so their advice reflects your actual routine.\n\nUse a trim appointment to talk about the shape and condition of your ends. Explain whether you want to keep your length, change your cut or make daily styling easier. Agree on how much will be removed before the haircut begins instead of relying on a fixed schedule from an article.\n\nIf your scalp is persistently sore, irritated or changing in a way that concerns you, speak with a qualified healthcare professional. A blog post or a styling appointment cannot diagnose a scalp condition. For everyday care, keep notes on what works so you can make changes with a clear reason.",
  },
  {
    id: 4,
    title: "Short and Chic: Modern Hairstyles for Short Haircuts",
    category: "Trends",
    dateCreated: "May 29, 2024",
    imageUrl: "/images/blog/short-hair.jpg",
    author: "RapidStylers Team",
    content:
      "A short haircut can change how you get ready in the morning, but it is worth asking what the cut needs between appointments. Bring photos of styles you like and explain what appeals to you: the outline, the fringe, the texture or the amount of hair left around the ears.\n\nA bob gives you several choices without needing a completely different cut. You might prefer a clear, even outline or a softer shape with layers. Ask how the length will sit with your usual texture and whether you will still be able to tuck it behind your ears or tie part of it back.\n\nA pixie brings more attention to the shape around the hairline and the length on top. Decide whether you want a close finish at the sides or enough length to move the front in different directions. Ask your stylist to show you how it looks without a full salon finish as well.\n\nA short layered cut can leave room for movement and texture. Talk about how you like the fringe to sit and whether you are comfortable styling it separately. A reference photo is a starting point, so discuss which details will translate to your own hair.\n\nBe honest about maintenance before you commit. Some people enjoy a frequent tidy up, while others would rather let the shape grow out for longer. Ask what the cut is likely to look like between visits and which details will need attention first.\n\nBefore leaving the appointment, try one part of the styling routine yourself. Ask how much product to use, where to put it and what to do on a day when you want to skip heat styling. The best advice is something you can repeat at home with the tools you already have.",
  },
];

const ArticleNotFound = () => {
  useNoIndex();
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader spacer />
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
};

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setPost(null);
    setNotFound(false);
    // Fetched without the shared error toast: an unknown id shows the page's
    // own "Article not found", not the server's raw message on top of it.
    fetchBlogPost(id)
      .then((res) => {
        if (!mounted) return;
        if (res.data?.data && res.data.data.id) {
          setPost(res.data.data);
        } else {
          setNotFound(true);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        // The server answered: the article does not exist. Only an unreachable
        // server falls back to the bundled copies.
        if (isServerAnswer(error)) {
          setNotFound(true);
          return;
        }
        const fallback = FALLBACK_POSTS.find((p) => String(p.id) === String(id));
        if (fallback) setPost(fallback);
        else setNotFound(true);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    document.title = notFound
      ? "Article not found | RapidStylers"
      : post
      ? `${post.title} | RapidStylers`
      : "Blog | RapidStylers";
    // Each article describes itself in search results and link previews.
    const summary = post ? String(post.content || "").replace(/\s+/g, " ").trim().slice(0, 155) : "";
    const tags = summary
      ? [document.head.querySelector('meta[name="description"]'), document.head.querySelector('meta[property="og:description"]')].filter(Boolean)
      : [];
    const previous = tags.map((tag) => tag.getAttribute("content"));
    tags.forEach((tag) => tag.setAttribute("content", summary));
    return () => tags.forEach((tag, i) => tag.setAttribute("content", previous[i] || ""));
  }, [post, notFound]);

  if (notFound) {
    return <ArticleNotFound />;
  }

  if (!post) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader spacer />
      <Section pad="pt-10 md:pt-14 pb-6">
        <BackHome label="All articles" to="/blog" />
        <BlogArticle post={post} />
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

import fs from "node:fs";
import path from "node:path";

/**
 * Pins the content-security-policy decisions in vercel.json.
 *
 * The reason this is a test rather than a comment: `script-src` without
 * 'unsafe-eval' is what stops an injected script from executing arbitrary code,
 * and the only thing in this bundle that needs eval is lottie-web's After
 * Effects expression evaluator — which is dead code unless an animation
 * actually carries expressions. That coupling is invisible (the build only
 * warns in the lottie-web source), so both halves are asserted here.
 */
const root = process.cwd();
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

const headerValue = (key) => {
  const header = vercelConfig.headers[0].headers.find((h) => h.key === key);
  return header?.value;
};

const scriptSrcOf = (policy) =>
  policy
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith("script-src")) || "";

const enforcing = headerValue("Content-Security-Policy");
const reportOnly = headerValue("Content-Security-Policy-Report-Only");

describe("content security policy", () => {
  test("the enforcing policy forbids eval", () => {
    expect(enforcing).toBeDefined();
    expect(scriptSrcOf(enforcing)).not.toContain("'unsafe-eval'");
  });

  test("the enforcing policy still allows every origin the app loads", () => {
    // Stripe (payments), Cloudflare (the Turnstile challenge), AdSense (ads) and
    // Google Sign-In all fail closed if their origin is missing, so a future
    // tightening edit must not take one of them out silently.
    [
      "https://js.stripe.com",
      "https://challenges.cloudflare.com",
      "https://pagead2.googlesyndication.com",
      "https://accounts.google.com",
    ].forEach((origin) => expect(enforcing).toContain(origin));
  });

  test("a strict report-only policy is kept alongside it", () => {
    // Dropping 'unsafe-inline' from script-src would break whichever third party
    // injects an inline snippet; report-only makes that measurable instead of
    // guesswork, so the policy must stay in place.
    expect(reportOnly).toBeDefined();
    expect(scriptSrcOf(reportOnly)).not.toContain("'unsafe-inline'");
    expect(scriptSrcOf(reportOnly)).not.toContain("'unsafe-eval'");
    expect(scriptSrcOf(reportOnly)).toContain("'self'");
  });

  test("no bundled Lottie animation uses expressions", () => {
    // Lottie stores an After Effects expression as the STRING value of an "x"
    // key, and compiles it with eval() — so such an animation would silently stop
    // animating under the policy above. The value must be a string: a numeric or
    // array "x" is a keyframe's bezier easing handle ("i":{"x":[0.833]}), which
    // every exported animation contains and which has nothing to do with eval.
    const dir = path.join(root, "src", "assets", "svg-icons");
    const expression = /"x"\s*:\s*"/;
    const withExpressions = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .filter((name) => expression.test(fs.readFileSync(path.join(dir, name), "utf8")));

    expect(
      withExpressions,
      "These Lottie files contain After Effects expressions, which are evaluated with eval() "
        + "and are blocked by the CSP. Either re-export the animation without expressions, or "
        + "re-add 'unsafe-eval' to script-src in vercel.json and record why."
    ).toEqual([]);
  });
});

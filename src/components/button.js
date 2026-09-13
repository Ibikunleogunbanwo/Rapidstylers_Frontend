/**
 * The one button in the app. Pages used to carry their own inline button markup,
 * which is how the product ended up with a different radius, colour and hover on
 * nearly every screen; every call site now goes through here so the shape stays
 * the same (design brief, rule 6: consistent buttons).
 *
 * The contract, and the reasons it is what it is:
 *
 *  - `variant` — `primary` (default), `light` for use on dark backgrounds, and
 *    `ghost` for low-emphasis actions. An unrecognised or missing variant falls
 *    back to the base styling. The previous version mapped anything that was not
 *    `primary`/`light` to an empty string, which is what silently produced blank,
 *    unlabelled buttons: forty call sites were still passing the old prop names
 *    when the props were renamed here.
 *  - `size` — `sm | md | lg`, default `md`.
 *  - the label comes from `children` (idiomatic) or from `text`, for the call
 *    sites that hold the label in an expression such as a loading string. If both
 *    are present, `children` wins.
 *  - `type` is forwarded and never defaulted. A <button> inside a form submits by
 *    default, and every sign-up step and the sign-in form rely on that; quietly
 *    changing the default to "button" would make those forms stop submitting, so
 *    the platform default is preserved and call sites that must not submit pass
 *    type="button" explicitly.
 *  - `onClick`, `disabled` and any other prop (aria-*, data-*) are spread onto the
 *    element, and `className` is appended so a call site can adjust spacing
 *    without forking the component.
 *
 * Colours come from the `brand` token plus Tailwind's default palette, so this
 * component does not depend on the extra design tokens being added to
 * tailwind.config.js elsewhere.
 */
const Button = ({
  variant = "primary",
  size = "md",
  type,
  text,
  children,
  onClick,
  disabled,
  className = "",
  // The pre-rename names, still accepted so the rename can land a page at a
  // time. This is what makes the failure above non-fatal: a call site that has
  // not been migrated yet keeps its label instead of rendering an empty button.
  // Remove these once no call site passes them.
  btnType,
  btnText,
  ...rest
}) => {
  const resolvedVariant = btnType || variant;
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses =
    {
      primary: "bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/85",
      // For dark surfaces, where a brand-coloured button would not stand out.
      light: "bg-white text-gray-900 hover:bg-gray-100",
      ghost: "border border-brand/30 bg-transparent text-brand hover:bg-brand/10",
    }[resolvedVariant] || "";

  const sizeClasses =
    {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    }[size] || "";

  const classes = [baseClasses, variantClasses, sizeClasses, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children ?? text ?? btnText}
    </button>
  );
};

export default Button;

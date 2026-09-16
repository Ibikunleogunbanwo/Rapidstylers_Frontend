import { passwordRequirements } from "../utils/passwordRule";

/**
 * The password rule, as the hairline rows the rest of the site uses for lists.
 *
 * Four screens set a password and each used to describe the rule its own way: a
 * sentence of prose here, an italic grey footnote there, a row list somewhere
 * else. They now render this, and it reads the rule from `utils/passwordRule`, so
 * the list a person watches turn as they type cannot describe a different rule
 * from the one that will reject them.
 *
 * A satisfied row turns near-black rather than green: the list keeps one accent
 * instead of introducing a second, which is the same choice the professional
 * signup step made.
 *
 * `spacing` trims the top margin for the screens that already space their form.
 */
const PasswordRequirements = ({ value = "", className = "", spacing = "mt-6" }) => (
  <div className={className}>
    <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Password must contain</p>
    <ul className={`${spacing} border-t border-black/10`} aria-label="Password requirements">
      {passwordRequirements(value).map((requirement) => (
        <li
          key={requirement.key}
          className={`border-b border-black/10 py-2 text-[13px] transition-colors ${
            requirement.met ? "text-onSurface" : "text-black/45"
          }`}
        >
          {requirement.label}
          {/* The row is already legible as met or unmet; this is the same fact
              for anyone who cannot see the colour change. */}
          <span className="sr-only">{requirement.met ? " met" : " not met yet"}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default PasswordRequirements;

/**
 * The one password rule, taken from what the server actually enforces.
 *
 * Four screens set a password (customer signup, customer change, professional
 * signup, password reset) and they used to state it four ways: signup required
 * eight characters and any non-alphanumeric, change-password required six and its
 * own list of symbols, and the professional form required a third. Two of those
 * were looser than the server, so a password could satisfy the field it was typed
 * into and then be rejected on submit with a rule the page had never mentioned.
 * The worst of it was `%`: both customer screens accepted it as the special
 * character and the server does not.
 *
 * The rule below is not a guess at the server's intent. It was measured against
 * the running backend pattern (`AppConstants.PASSWORD_PATTERN`) with Java 21:
 *
 *   - 8 to 30 characters
 *   - at least one lowercase letter, one uppercase letter and one digit
 *   - at least one of: ! # $ & ' ( ) * + - . / : ; < = > ? @ ^ { } ~
 *   - NOT accepted as that special character: " % , [ \ ] _ ` |  (and space)
 *
 * So `Abcdefg1` is rejected for having no special character, `Abcdefg1%` is
 * rejected for using a symbol outside the set, and `Abcdefg1!` is accepted.
 *
 * Anyone changing this must re-measure rather than reason about it: the backend
 * pattern's character class reads far more permissively than it behaves, and the
 * tests alongside this file pin the measured verdicts for that reason.
 */

/** The inclusive length bounds the server enforces. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

/**
 * Every character the server accepts in place of the "special character".
 *
 * `&` and `'` are here and `%` is not, which is exactly the kind of detail a
 * hand-written list gets wrong: `%` looks safe and is refused.
 */
export const PASSWORD_SPECIAL_CHARACTERS = "!#$&'()*+-./:;<=>?@^{}~";

/** The same characters as a character class, escaped for whatever is in it. */
const SPECIAL_CLASS = `[${PASSWORD_SPECIAL_CHARACTERS.replace(/[\\\]^-]/g, "\\$&")}]`;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SPECIAL = new RegExp(SPECIAL_CLASS);

/** The one line the screens print under a password field. */
export const PASSWORD_RULE_MESSAGE =
  `Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters with at least one uppercase letter, ` +
  `one lowercase letter, one digit and one special character (${PASSWORD_SPECIAL_CHARACTERS})`;

/**
 * The rule as a list, in the order a person reads it, each entry knowing whether
 * the value in hand satisfies it. The screens render this rather than restating
 * the rule, so the list a professional watches turn one row at a time as they
 * type cannot describe a different rule from the one that rejects them.
 */
export const passwordRequirements = (value = "") => {
  const password = String(value ?? "");
  return [
    {
      key: "length",
      label: `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`,
      met:
        password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    { key: "uppercase", label: "One uppercase letter", met: HAS_UPPERCASE.test(password) },
    { key: "lowercase", label: "One lowercase letter", met: HAS_LOWERCASE.test(password) },
    { key: "digit", label: "One digit", met: HAS_DIGIT.test(password) },
    {
      key: "special",
      label: `One special character (${PASSWORD_SPECIAL_CHARACTERS})`,
      met: HAS_SPECIAL.test(password),
    },
  ];
};

/** The failure messages, one per requirement, so a field says what is missing. */
const PROBLEMS = {
  length: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
  uppercase: "Password must contain at least one uppercase letter",
  lowercase: "Password must contain at least one lowercase letter",
  digit: "Password must contain at least one digit",
  special: `Password must contain at least one special character from ${PASSWORD_SPECIAL_CHARACTERS}`,
};

/**
 * What is wrong with this password, or null when the server will take it.
 *
 * The first failing requirement is the one reported, so an eight-character
 * password with no capital hears about the capital rather than a list of
 * everything it is missing.
 */
export const passwordProblem = (value = "") => {
  const password = String(value ?? "");
  if (password === "") return "Password is required";
  const unmet = passwordRequirements(password).find((requirement) => !requirement.met);
  return unmet ? PROBLEMS[unmet.key] : null;
};

/** Whether the server will accept this password. */
export const passwordIsStrong = (value) => passwordProblem(value) === null;

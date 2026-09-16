/**
 * The password rule is a copy of the server's, so the thing worth testing is
 * whether the copy is faithful.
 *
 * Every verdict here was measured by running the backend's own pattern
 * (`AppConstants.PASSWORD_PATTERN`) through Java 21, not read off it. That
 * distinction matters more than usual: the pattern's character class looks far
 * more permissive than it behaves (`%` sits among symbols that look equivalent
 * and is refused), and both customer screens used to accept `%`. So the tests
 * below carry the measured verdicts, and one of them asserts the property that
 * actually protects a user: anything this rule accepts, the server accepts.
 *
 * `serverAccepts` is written from the measurement rather than transcribed from
 * the pattern, because the pattern is the thing being measured.
 */
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_MESSAGE,
  PASSWORD_SPECIAL_CHARACTERS,
  passwordIsStrong,
  passwordProblem,
  passwordRequirements,
} from "./passwordRule";

/** The server's rule as measured, used as the reference the client must agree with. */
const serverAccepts = (value) => {
  const password = String(value ?? "");
  if (password.length < 8 || password.length > 30) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return [...PASSWORD_SPECIAL_CHARACTERS].some((character) => password.includes(character));
};

describe("the password rule the server enforces", () => {
  it("takes a password straight from the measurement", () => {
    // Measured: "Abcdefg1!" true, "Abcdefg1" false, "Abcdefg1%" false.
    expect(passwordIsStrong("Abcdefg1!")).toBe(true);
    expect(passwordIsStrong("Abcdefg1")).toBe(false);
    expect(passwordIsStrong("Abcdefg1%")).toBe(false);
    expect(passwordIsStrong("Ab1!aaaa")).toBe(true);
  });

  it("keeps the length bounds inclusive, at 8 and at 30", () => {
    const seven = "Abcdef1";
    const eight = "Abcdefg1";
    const thirty = `Abcdefg1!${"a".repeat(21)}`;
    const thirtyOne = `Abcdefg1!${"a".repeat(22)}`;

    expect(seven.length).toBe(7);
    expect(eight.length).toBe(PASSWORD_MIN_LENGTH);
    expect(thirty.length).toBe(PASSWORD_MAX_LENGTH);
    expect(thirtyOne.length).toBe(PASSWORD_MAX_LENGTH + 1);

    // The eight- and thirty-character versions need a special character to be
    // otherwise valid, so they are tested through the rule with one added.
    expect(passwordIsStrong(`${seven}!`)).toBe(true);
    expect(passwordIsStrong("Abcdefgh")).toBe(false);
    expect(passwordIsStrong(thirty)).toBe(true);
    expect(passwordIsStrong(thirtyOne)).toBe(false);
  });

  it("names each missing requirement instead of listing them all", () => {
    // Every one of these is a valid password but for a single missing piece, so
    // the message a person reads names that piece.
    expect(passwordProblem("Abcdefg1")).toMatch(/special character/);
    expect(passwordProblem("abcdefg1!")).toMatch(/uppercase/);
    expect(passwordProblem("ABCDEFG1!")).toMatch(/lowercase/);
    expect(passwordProblem("Abcdefgh!")).toMatch(/digit/);
    expect(passwordProblem("Ab1!")).toMatch(/between 8 and 30/);
    expect(passwordProblem("")).toMatch(/required/);
    expect(passwordProblem("Abcdefg1!")).toBeNull();
  });

  it("reads as the list the screens render, and tracks the value as it is typed", () => {
    const labels = passwordRequirements("").map((requirement) => requirement.label);
    expect(passwordRequirements("").every((requirement) => !requirement.met)).toBe(true);

    const met = passwordRequirements("Ab1!aaaa");
    expect(met.every((requirement) => requirement.met)).toBe(true);

    // The rows cannot describe a different rule from the validator: both come
    // from this one module.
    expect(labels).toHaveLength(5);
    expect(passwordRequirements("Abcdefg1").find((r) => r.key === "special").met).toBe(false);
    expect(passwordRequirements("Abcdefg1%").find((r) => r.key === "special").met).toBe(false);
    // A row is satisfied if and only if the rule agrees, for every value.
    ["", "Ab1!", "Abcdefg1", "Abcdefg1!", "abcdefg1%"].forEach((value) => {
      const allMet = passwordRequirements(value).every((requirement) => requirement.met);
      expect(allMet).toBe(passwordIsStrong(value));
    });
  });

  it("tells the truth about which symbols count", () => {
    // The set is spelled out in the guidance because a person cannot guess it:
    // `&` works, `%` does not, and both look equally special.
    expect(passwordProblem("Abcdefg1%")).toContain(PASSWORD_SPECIAL_CHARACTERS);
    // `%` is the symbol both customer screens used to accept, so the guidance must
    // not quietly offer it as one of the working ones.
    expect(PASSWORD_SPECIAL_CHARACTERS).not.toContain("%");
    expect(passwordProblem("Abcdefg1%")).not.toContain("%");
    expect(PASSWORD_RULE_MESSAGE).toContain(PASSWORD_SPECIAL_CHARACTERS);
    expect(PASSWORD_RULE_MESSAGE).not.toMatch(/[—–]/);
  });

  it("accepts nothing the server would refuse", () => {
    // The property that protects a user: no field can agree with a password and
    // then have the server reject it. Anything the client passes must pass the
    // measured server rule too, which is what the two now disagreeing symbol
    // lists used to break.
    const values = [
      "Ab1!",
      "Abcdefg1",
      "Abcdefg1!",
      "Abcdefg1%",
      "Abcdefg1,",
      "Abcdefg1[",
      "Abcdefg1]",
      "Abcdefg1_",
      "Abcdefg1 ",
      "Abcdefg1|",
      "Abcdef1!",
      "abcdefg1!",
      "ABCDEFG1!",
      "Abcdefgh!",
      "Abcdefg1!aaaaaaaaaaaaaaaaaaaaaa",
      "Ab1!aaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "Abcdefg1\u00e9!",
      "",
    ];

    const acceptedByClient = values.filter(passwordIsStrong);
    // The corpus is only meaningful if it exercises both verdicts.
    expect(acceptedByClient.length).toBeGreaterThan(0);
    expect(values.length - acceptedByClient.length).toBeGreaterThan(0);

    acceptedByClient.forEach((value) => {
      expect(serverAccepts(value)).toBe(true);
    });
    // And the agreement runs both ways, so the rule is neither looser nor
    // needlessly stricter than the server.
    values.forEach((value) => {
      expect(passwordIsStrong(value)).toBe(serverAccepts(value));
    });
  });
});

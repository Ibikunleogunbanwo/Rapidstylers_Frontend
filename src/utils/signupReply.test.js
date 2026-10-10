import { isAccountAlreadyExists } from "./signupReply";

describe("isAccountAlreadyExists", () => {
  it("recognises the customer sign-up wording", () => {
    expect(isAccountAlreadyExists("Email Address already exists, Kindly choose another email address")).toBe(true);
  });

  it("recognises the professional sign-up wording", () => {
    expect(isAccountAlreadyExists("Email Address already exists, Kindly choose another email")).toBe(true);
  });

  it("recognises an 'already registered' phrasing", () => {
    expect(isAccountAlreadyExists("Email address is already registered")).toBe(true);
  });

  it("does not fire on unrelated sign-up failures", () => {
    expect(isAccountAlreadyExists("Email Address is yet to be verified")).toBe(false);
    expect(isAccountAlreadyExists("Phone number already registered")).toBe(false);
    expect(isAccountAlreadyExists("Too many failed attempts. Please try again later.")).toBe(false);
  });

  it("is safe on missing or non-string input", () => {
    expect(isAccountAlreadyExists(undefined)).toBe(false);
    expect(isAccountAlreadyExists(null)).toBe(false);
    expect(isAccountAlreadyExists({ message: "already exists" })).toBe(false);
  });
});

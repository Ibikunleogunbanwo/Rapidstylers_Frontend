import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "index.css"), "utf8");

describe("Toast styles", () => {
  test("keeps the close button above the toast body and clickable", () => {
    expect(css).toMatch(/\.rapid-toast \.Toastify__close-button\s*\{[^}]*position:\s*absolute;/s);
    expect(css).toMatch(/\.rapid-toast \.Toastify__close-button\s*\{[^}]*z-index:\s*1;/s);
    expect(css).toMatch(/\.rapid-toast-body\s*\{[^}]*padding:\s*14px 48px 14px 16px !important;/s);
  });
});

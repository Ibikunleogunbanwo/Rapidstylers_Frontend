import { describe, expect, it, vi } from "vitest";
import {
  isProductionApiUrl,
  LOCAL_API_BASE_URL,
  resolveApiBaseUrl,
} from "./apiBaseUrl";

const PRODUCTION_URL = "https://api.rapidstylers.ca/rapid_stylers";

describe("isProductionApiUrl", () => {
  it("matches the production host and nothing else", () => {
    expect(isProductionApiUrl(PRODUCTION_URL)).toBe(true);
    expect(isProductionApiUrl("http://localhost:9095/rapid_stylers")).toBe(false);
    // A lookalike host or a bare string must not be mistaken for production.
    expect(isProductionApiUrl("https://api.rapidstylers.ca.evil.test/rapid_stylers")).toBe(false);
    expect(isProductionApiUrl("api.rapidstylers.ca/rapid_stylers")).toBe(false);
    expect(isProductionApiUrl("")).toBe(false);
    expect(isProductionApiUrl(undefined)).toBe(false);
  });
});

describe("resolveApiBaseUrl", () => {
  it("keeps an explicit non-production URL in every run", () => {
    const remote = "https://staging.example.test/rapid_stylers";
    expect(resolveApiBaseUrl(remote, { dev: true })).toBe(remote);
    expect(resolveApiBaseUrl(remote, { dev: false })).toBe(remote);
  });

  it("falls back to the local backend when nothing is configured", () => {
    expect(resolveApiBaseUrl("", { dev: true })).toBe(LOCAL_API_BASE_URL);
    expect(resolveApiBaseUrl(undefined, { dev: false })).toBe(LOCAL_API_BASE_URL);
    expect(resolveApiBaseUrl("   ", { dev: false })).toBe(LOCAL_API_BASE_URL);
  });

  it("refuses a production URL during local development and warns loudly", () => {
    const warn = vi.fn();
    expect(resolveApiBaseUrl(PRODUCTION_URL, { dev: true, warn })).toBe(LOCAL_API_BASE_URL);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/production/i);
    expect(warn.mock.calls[0][0]).toContain(PRODUCTION_URL);
  });

  it("allows the production URL outside local development (build and preview)", () => {
    const warn = vi.fn();
    expect(resolveApiBaseUrl(PRODUCTION_URL, { dev: false, warn })).toBe(PRODUCTION_URL);
    expect(warn).not.toHaveBeenCalled();
  });
});

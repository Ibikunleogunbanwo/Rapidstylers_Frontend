import { handleProxy, upstreamUrl, upstreamHeaders, visitorIp } from "./apiProxy.mjs";
import { previewApiBase } from "../seo/linkPreview.mjs";

const ENV = {
  API_UPSTREAM_URL: "https://api.example.test",
  API_KEY: "server-key",
  FRONTEND_PROXY_SECRET: "s".repeat(40),
};

describe("API proxy", () => {
  test("maps the site path onto the API, keeping the query", () => {
    expect(upstreamUrl("https://rapidstylers.ca/api/proxy?__path=search_by_service&serviceTypeId=4", ENV.API_UPSTREAM_URL))
      .toBe("https://api.example.test/rapid_stylers/search_by_service?serviceTypeId=4");
    expect(upstreamUrl("https://rapidstylers.ca/api/proxy?__path=auth/refresh", ENV.API_UPSTREAM_URL))
      .toBe("https://api.example.test/rapid_stylers/auth/refresh");
  });

  test("refuses paths that try to leave the API", () => {
    expect(upstreamUrl("https://x/api/proxy?__path=../admin", ENV.API_UPSTREAM_URL)).toBeNull();
    expect(upstreamUrl("https://x/api/proxy?__path=a%20b", ENV.API_UPSTREAM_URL)).toBeNull();
    expect(upstreamUrl("https://x/api/proxy?__path=list", "")).toBeNull();
  });

  test("adds the server-side key and replaces any key the browser sent", () => {
    const headers = upstreamHeaders(new Headers({ "x-api-key": "from-browser", authorization: "Bearer t", "content-type": "application/json" }), ENV);
    expect(headers.get("x-api-key")).toBe("server-key");
    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("content-type")).toBe("application/json");
  });

  test("signs the visitor IP and location, and drops anything spoofed", () => {
    const headers = upstreamHeaders(new Headers({
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
      "x-vercel-ip-city": "Calgary",
      "x-vercel-ip-latitude": "51.04",
      "x-rs-client-ip": "6.6.6.6",
      "cf-connecting-ip": "6.6.6.6",
    }), ENV);
    expect(headers.get("x-rs-proxy-secret")).toBe(ENV.FRONTEND_PROXY_SECRET);
    expect(headers.get("x-rs-client-ip")).toBe("203.0.113.9");
    expect(headers.get("x-rs-geo-city")).toBe("Calgary");
    expect(headers.get("x-rs-geo-latitude")).toBe("51.04");
    expect(headers.get("cf-connecting-ip")).toBeNull();
    expect(visitorIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  test("relays the method, body and status, and never exposes the upstream host", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 201, headers: { "content-type": "application/json" } }));
    const request = new Request("https://rapidstylers.ca/api/proxy?__path=book_appointment", { method: "POST", body: '{"a":1}', headers: { "content-type": "application/json" } });
    const response = await handleProxy(request, { env: ENV, fetchImpl });
    expect(response.status).toBe(201);
    expect(await response.text()).toBe('{"ok":true}');
    const [target, init] = fetchImpl.mock.calls[0];
    expect(target).toBe("https://api.example.test/rapid_stylers/book_appointment");
    expect(init.method).toBe("POST");
  });

  test("answers 503 when the proxy is not configured, and 502 when the API is down", async () => {
    expect((await handleProxy(new Request("https://x/api/proxy?__path=a"), { env: {} })).status).toBe(503);
    const down = vi.fn().mockRejectedValue(new Error("boom"));
    expect((await handleProxy(new Request("https://x/api/proxy?__path=a"), { env: ENV, fetchImpl: down })).status).toBe(502);
  });

  test("link previews still reach the API when the site uses the relative proxy path", () => {
    expect(previewApiBase({ REACT_APP_API_BASE_URL: "/rapid_stylers", API_UPSTREAM_URL: "https://api.example.test/" }))
      .toBe("https://api.example.test/rapid_stylers");
    expect(previewApiBase({ REACT_APP_API_BASE_URL: "https://api.example.test/rapid_stylers" }))
      .toBe("https://api.example.test/rapid_stylers");
  });
});

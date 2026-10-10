import Axios from "axios";
import { ApiClient, ApiFormDataClient } from "./apiClient";
import { clearAllSessionTokens, setAuthToken, setRefreshToken, getAuthToken } from "../../utils/constant";

const ok = (config, data = {}) => ({ config, data, status: 200, statusText: "OK", headers: {} });
const denied = (config, status = 401) => Promise.reject(new Axios.AxiosError("Denied", "ERR_BAD_RESPONSE", config, null, { status, data: {} }));
let defaultAdapter;
beforeEach(() => { defaultAdapter = Axios.defaults.adapter; clearAllSessionTokens(); setAuthToken("old"); setRefreshToken("refresh-old"); });
afterEach(() => { Axios.defaults.adapter = defaultAdapter; sessionStorage.clear(); });

it("bounds JSON, multipart and refresh requests", async () => {
  expect(ApiClient.defaults.timeout).toBeGreaterThan(0);
  expect(ApiFormDataClient.defaults.timeout).toBeGreaterThan(0);
  let refreshTimeout;
  Axios.defaults.adapter = async config => { refreshTimeout = config.timeout; return ok(config, { statusCode: 200, token: "new" }); };
  await ApiClient.get("/protected", { adapter: config => config._retry ? Promise.resolve(ok(config)) : denied(config) });
  expect(refreshTimeout).toBeGreaterThan(0);
});

it("shares refresh across both real clients and replays each only once", async () => {
  let finishRefresh;
  let refreshCalls = 0;
  Axios.defaults.adapter = config => { refreshCalls++; return new Promise(resolve => { finishRefresh = () => resolve(ok(config, { statusCode: 200, token: "new" })); }); };
  const json = vi.fn(config => denied(config));
  const multipart = vi.fn(config => config._retry ? Promise.resolve(ok(config)) : denied(config));
  const requests = Promise.allSettled([ApiClient.get("/one", { adapter: json }), ApiFormDataClient.post("/two", new FormData(), { adapter: multipart })]);
  await vi.waitFor(() => expect(refreshCalls).toBe(1));
  finishRefresh();
  const results = await requests;
  expect(results.map(result => result.status)).toEqual(["rejected", "fulfilled"]);
  expect(json).toHaveBeenCalledTimes(2);
  expect(multipart).toHaveBeenCalledTimes(2);
  expect(refreshCalls).toBe(1);
});

it.each([["logout", "200"], ["switch", 200], ["same-token-login", "200"]])("does not commit a refresh after %s", async (action, statusCode) => {
  let finishRefresh;
  Axios.defaults.adapter = config => new Promise(resolve => { finishRefresh = () => resolve(ok(config, { statusCode: 200, token: "stale", statusCode })); });
  const adapter = vi.fn(config => config._retry ? Promise.resolve(ok(config)) : denied(config));
  const request = ApiClient.get("/protected", { adapter }).catch(error => error);
  await vi.waitFor(() => expect(finishRefresh).toBeTypeOf("function"));
  clearAllSessionTokens();
  if (action === "same-token-login") { setAuthToken("old"); setRefreshToken("refresh-old"); }
  if (action === "switch") { setAuthToken("other"); setRefreshToken("other-refresh"); }
  finishRefresh();
  await request;
  expect(getAuthToken()).toBe(action === "switch" ? "other" : action === "same-token-login" ? "old" : "");
  expect(adapter).toHaveBeenCalledTimes(1);
});

it.each([401, 403, 500])("clears session only for confirmed invalid refresh (%s)", async status => {
  Axios.defaults.adapter = config => denied(config, status);
  await ApiClient.get("/protected", { adapter: config => denied(config) }).catch(() => {});
  expect(getAuthToken()).toBe(status === 500 ? "old" : "");
});

it("never refreshes auth or logout calls", async () => {
  const refresh = vi.fn(config => Promise.resolve(ok(config)));
  Axios.defaults.adapter = refresh;
  await Promise.allSettled([ApiClient.post("/auth/refresh", {}, { adapter: denied }), ApiFormDataClient.post("/logout", {}, { adapter: denied })]);
  expect(refresh).not.toHaveBeenCalled();
});

it.each([200, "200"])("accepts refresh status %s and late 401 reuses its result", async statusCode => {
  const refresh = vi.fn(config => Promise.resolve(ok(config, { statusCode, token: "new", refreshToken: "refresh-new" })));
  Axios.defaults.adapter = refresh;
  let releaseLate;
  const lateAdapter = vi.fn(config => config._retry ? Promise.resolve(ok(config)) : new Promise((resolve, reject) => { releaseLate = () => denied(config).catch(reject); }));
  const late = ApiClient.get("/late", { adapter: lateAdapter });
  await vi.waitFor(() => expect(releaseLate).toBeTypeOf("function"));
  await ApiClient.get("/first", { adapter: config => config._retry ? Promise.resolve(ok(config)) : denied(config) });
  releaseLate();
  await late;
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(lateAdapter).toHaveBeenCalledTimes(2);
});

it("does not refresh an anonymous request that fails after sign-in", async () => {
  clearAllSessionTokens();
  let rejectRequest;
  const refresh = vi.fn();
  Axios.defaults.adapter = refresh;
  const request = ApiClient.get("/public", { adapter: config => new Promise((resolve, reject) => { rejectRequest = () => denied(config).catch(reject); }) }).catch(error => error);
  await vi.waitFor(() => expect(rejectRequest).toBeTypeOf("function"));
  setAuthToken("signed-in"); setRefreshToken("signed-in-refresh");
  rejectRequest();
  await request;
  expect(refresh).not.toHaveBeenCalled();
});

it("preserves explicitly captured logout token without refresh", async () => {
  const adapter = vi.fn(config => Promise.resolve(ok(config)));
  clearAllSessionTokens();
  await ApiClient.post("/styler/sign_out", {}, { skipAuthRefresh: true, headers: { Authorization: "Bearer captured" }, adapter });
  expect(adapter.mock.calls[0][0].headers.Authorization).toBe("Bearer captured");
});

it("keeps the session after network or malformed refresh responses", async () => {
  for (const refreshAdapter of [() => Promise.reject(new Axios.AxiosError("Offline", "ERR_NETWORK")), config => Promise.resolve(ok(config, { statusCode: 200 }))]) {
    Axios.defaults.adapter = refreshAdapter;
    await ApiClient.get("/protected", { adapter: config => denied(config) }).catch(() => {});
    expect(getAuthToken()).toBe("old");
  }
});

it("queued callers also stop after a failed replay", async () => {
  let release;
  const refresh = vi.fn(config => new Promise(resolve => { release = () => resolve(ok(config, { statusCode: "200", token: "new" })); }));
  Axios.defaults.adapter = refresh;
  const adapter = vi.fn(config => denied(config));
  const pending = Promise.allSettled([ApiClient.get("/one", { adapter }), ApiClient.get("/two", { adapter })]);
  await vi.waitFor(() => expect(release).toBeTypeOf("function"));
  release();
  expect((await pending).map(result => result.status)).toEqual(["rejected", "rejected"]);
  expect(adapter).toHaveBeenCalledTimes(4);
  expect(refresh).toHaveBeenCalledTimes(1);
});

it.each(["401", 403, "500"])("interprets refresh business failure %s without clearing transient sessions", async statusCode => {
  Axios.defaults.adapter = config => Promise.resolve(ok(config, { statusCode, message: "Refresh failed" }));
  await ApiClient.get("/protected", { adapter: config => denied(config) }).catch(() => {});
  expect(getAuthToken()).toBe(Number(statusCode) === 500 ? "old" : "");
});

it("an old refresh rejection cannot clear a switched session", async () => {
  let rejectRefresh;
  Axios.defaults.adapter = config => new Promise((resolve, reject) => { rejectRefresh = () => denied(config).catch(reject); });
  const request = ApiClient.get("/protected", { adapter: config => denied(config) }).catch(error => error);
  await vi.waitFor(() => expect(rejectRefresh).toBeTypeOf("function"));
  clearAllSessionTokens(); setAuthToken("other"); setRefreshToken("other-refresh");
  rejectRefresh();
  await request;
  expect(getAuthToken()).toBe("other");
});

vi.mock("axios", () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    post: vi.fn(),
  },
}));

import { attachAuthToken, rejectApplicationFailure } from "./apiClient";

test("attaches the current JWT to API requests", () => {
  sessionStorage.setItem("rapidstylers_auth_token", "customer-jwt");
  const config = { headers: {} };

  expect(attachAuthToken(config)).toEqual({
    headers: { Authorization: "Bearer customer-jwt" },
  });

  sessionStorage.clear();
});

// ── Application-level failures (HTTP 200 + body statusCode) ────────────────
// The interceptor is the single place that turns a business failure into a
// rejected promise, so pages never have to hand-roll `statusCode === "400"`.

test("passes a successful response through untouched", () => {
  const response = { data: { statusCode: "200", data: {} }, config: {} };
  expect(rejectApplicationFailure(response)).toBe(response);
});

test("treats a numeric 200 statusCode as success", () => {
  const response = { data: { statusCode: 200 }, config: {} };
  expect(rejectApplicationFailure(response)).toBe(response);
});

test("rejects a business failure with an axios-shaped error", async () => {
  const response = {
    data: { statusCode: "400", message: "Card was declined" },
    config: { url: "/book_appointment" },
  };

  const error = await rejectApplicationFailure(response).catch((e) => e);

  expect(error.message).toBe("Card was declined");
  expect(error.isAxiosError).toBe(true); // extractError() expects this shape
  expect(error.appStatusCode).toBe("400");
  expect(error.response).toBe(response); // pages read error.response.data.*
  expect(error.config.url).toBe("/book_appointment");
});

test("carries the inline payment reason and falls back to a generic message", async () => {
  const withReason = {
    data: { statusCode: "400", message: "Payment failed", data: { paymentError: "CARD_DECLINED" } },
    config: {},
  };
  const reasonError = await rejectApplicationFailure(withReason).catch((e) => e);
  expect(reasonError.paymentError).toBe("CARD_DECLINED");

  const noMessage = { data: { statusCode: "400" }, config: {} };
  const genericError = await rejectApplicationFailure(noMessage).catch((e) => e);
  expect(genericError.message).toBe("Request failed. Please try again.");
  expect(genericError.paymentError).toBeNull();
});

test("ignores bodies without a statusCode (arrays, blobs, plain payloads)", () => {
  const plain = { data: { some: "payload" }, config: {} };
  expect(rejectApplicationFailure(plain)).toBe(plain);

  const array = { data: [1, 2, 3], config: {} };
  expect(rejectApplicationFailure(array)).toBe(array);

  const blob = { data: new Blob(["x"]), config: {} };
  expect(rejectApplicationFailure(blob)).toBe(blob);
});

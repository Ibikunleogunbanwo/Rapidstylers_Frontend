jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: { request: { use: jest.fn() } },
    })),
  },
}));

import { attachAuthToken } from "./apiClient";

test("attaches the current JWT to API requests", () => {
  sessionStorage.setItem("rapidstylers_auth_token", "customer-jwt");
  const config = { headers: {} };

  expect(attachAuthToken(config)).toEqual({
    headers: { Authorization: "Bearer customer-jwt" },
  });

  sessionStorage.clear();
});

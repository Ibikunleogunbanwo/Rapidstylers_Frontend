import { configureStore } from "@reduxjs/toolkit";
import { APIService } from "../remote/apiService";
import { createUserAccount, userAuthenticate, userReducer } from "./userReducer";
import { getAuthToken, getRefreshToken, getUserRole } from "../../utils/constant";

vi.mock("../remote/apiService", () => ({
  APIService: { signIn: vi.fn(), createUserAccount: vi.fn() },
}));

const account = { userId: "A1234B", firstname: "Ada" };
const session = (role) => ({
  data: { statusCode: "200", token: "jwt", refreshToken: "refresh", data: { role, account } },
});
const store = () => configureStore({ reducer: { user: userReducer } });

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("userAuthenticate", () => {
  /** /user_sign_in had no bot check; the customer forms now go through /sign_in, which does. */
  test("signs a customer in through /sign_in, carrying the challenge token", async () => {
    APIService.signIn.mockResolvedValue(session("CUSTOMER"));
    const s = store();

    const { payload } = await s.dispatch(userAuthenticate({ emailAddress: "a@x.com", password: "p", captchaToken: "cf" }));

    expect(APIService.signIn).toHaveBeenCalledWith({ emailAddress: "a@x.com", password: "p", captchaToken: "cf" });
    expect(payload.data).toEqual(account);
    expect(s.getState().user.userSessionData).toEqual(account);
    expect(getAuthToken()).toBe("jwt");
    expect(getRefreshToken()).toBe("refresh");
    expect(getUserRole()).toBe("CUSTOMER");
  });

  test("turns a stylist away instead of leaving them half signed in as a customer", async () => {
    APIService.signIn.mockResolvedValue(session("STYLER"));
    const s = store();

    const { payload } = await s.dispatch(userAuthenticate({ emailAddress: "s@x.com", password: "p", captchaToken: "cf" }));

    expect(payload.statusCode).not.toBe("200");
    expect(getAuthToken()).toBe("");
    expect(s.getState().user.isAuthenticated).toBeFalsy();
  });
});

describe("createUserAccount", () => {
  /** Sign-up answers with a session, so no second sign-in call follows it. */
  test("keeps the session that sign-up hands back", async () => {
    APIService.createUserAccount.mockResolvedValue(session("CUSTOMER"));
    const s = store();

    const { payload } = await s.dispatch(createUserAccount({ emailAddress: "a@x.com", password: "p" }));

    expect(payload.token).toBe("jwt");
    expect(payload.data).toEqual(account);
    expect(s.getState().user.isAuthenticated).toBe(true);
    expect(getAuthToken()).toBe("jwt");
    expect(JSON.parse(localStorage.getItem("userSessionData"))).toEqual(account);
  });

  test("an older backend that sends no session leaves the visitor signed out", async () => {
    APIService.createUserAccount.mockResolvedValue({ data: { statusCode: "200", data: {} } });
    const s = store();

    await s.dispatch(createUserAccount({ emailAddress: "a@x.com", password: "p" }));

    expect(getAuthToken()).toBe("");
    expect(s.getState().user.isAuthenticated).toBeFalsy();
  });
});

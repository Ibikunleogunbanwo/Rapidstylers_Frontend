import { configureStore } from "@reduxjs/toolkit";
import { APIService } from "../remote/apiService";
import { changeUserPassword, createUserAccount, userAuthenticate, userReducer, userLogOut, setUserSession, getUserDetails } from "./userReducer";
import { getAuthToken, getRefreshToken, getUserRole, setAuthToken, setRefreshToken } from "../../utils/constant";

vi.mock("../remote/apiService", () => ({
  APIService: { signIn: vi.fn(), createUserAccount: vi.fn(), updateUserPassword: vi.fn(), logout: vi.fn(), getUserDetails: vi.fn() },
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

describe("changeUserPassword", () => {
  test("keeps this device signed in with the fresh tokens the server sends", async () => {
    setAuthToken("old-jwt");
    setRefreshToken("old-refresh");
    APIService.updateUserPassword.mockResolvedValue({
      data: { statusCode: "200", token: "new-jwt", refreshToken: "new-refresh" },
    });

    await store().dispatch(changeUserPassword({ oldPassword: "a", newPassword: "b" }));

    expect(getAuthToken()).toBe("new-jwt");
    expect(getRefreshToken()).toBe("new-refresh");
  });

  test("a refused change leaves the current tokens alone", async () => {
    setAuthToken("old-jwt");
    setRefreshToken("old-refresh");
    APIService.updateUserPassword.mockResolvedValue({ data: { statusCode: "400", message: "Wrong password" } });

    await store().dispatch(changeUserPassword({ oldPassword: "a", newPassword: "b" }));

    expect(getAuthToken()).toBe("old-jwt");
    expect(getRefreshToken()).toBe("old-refresh");
  });
});

 test("logout immediately clears browser and Redux session while revocation is pending", async () => {
    const pending = new Promise(() => {});
    APIService.logout.mockReturnValue(pending);
    setAuthToken("old-jwt"); setRefreshToken("old-refresh");
    localStorage.setItem("theme", "dark");
    const s = store(); s.dispatch(setUserSession({data: account}));
    const result = s.dispatch(userLogOut());
    expect(getAuthToken()).toBe("");
    expect(getRefreshToken()).toBe("");
    expect(localStorage.getItem("userSessionData")).toBeNull();
    expect(s.getState().user.userSessionData).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
    await result;
    expect(APIService.logout).toHaveBeenCalledWith("old-refresh");
 });

 describe("profile completion belongs to the requesting session", () => {
 const beginProfile = (s) => {
   let complete;
   APIService.getUserDetails.mockReturnValue(new Promise(resolve => { complete = resolve; }));
   const request = s.dispatch(getUserDetails());
   return { request, complete: () => complete({data: {statusCode: "200", data: {...account, firstname: "Old profile"}}}) };
 };
 const signIn = (s, user = account) => { setAuthToken("jwt"); s.dispatch(setUserSession({data: user})); };
 test("a deferred profile cannot repopulate account data after logout", async () => {
   const s = store(); signIn(s); const profile = beginProfile(s);
   await s.dispatch(userLogOut()); profile.complete(); await profile.request;
   expect(localStorage.getItem("userDetailsData")).toBeNull();
   expect(s.getState().user.userDetailsData).toBeNull();
   expect(s.getState().user.users).toBeNull();
 });
 test("an old account profile cannot overwrite the next signed-in account", async () => {
   const s = store(); signIn(s); const profile = beginProfile(s);
   const next = {userId: "NEW123", firstname: "New account"};
   signIn(s, next); profile.complete(); await profile.request;
   expect(localStorage.getItem("userDetailsData")).toBeNull();
   expect(s.getState().user.userSessionData).toEqual(next);
   expect(s.getState().user.users).toEqual({data: next});
   expect(s.getState().user.userDetailsData).toBeFalsy();
 });
 test("access token rotation keeps a valid account profile response", async () => {
   const s = store(); signIn(s); const profile = beginProfile(s);
   setAuthToken("rotated-jwt"); profile.complete(); await profile.request;
   expect(s.getState().user.userDetailsData.firstname).toBe("Old profile");
   expect(JSON.parse(localStorage.getItem("userDetailsData")).firstname).toBe("Old profile");
 });
 });

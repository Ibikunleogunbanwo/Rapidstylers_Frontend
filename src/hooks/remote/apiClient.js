import Axios from "axios";
import { API_BASE_URL, API_HEADER, FORM_DATA_HEADER, getAuthToken, setAuthToken, getRefreshToken, setRefreshToken, clearAllSessionTokens, getSessionRevision } from "../../utils/constant";
import { rejectApplicationFailure } from "./appFailure";

export { rejectApplicationFailure };
export const JSON_REQUEST_TIMEOUT_MS = 30_000;
export const MULTIPART_REQUEST_TIMEOUT_MS = 60_000;
export const REFRESH_TIMEOUT_MS = 15_000;

const sessionSnapshot = () => ({ token: getAuthToken(), refreshToken: getRefreshToken(), revision: getSessionRevision() });
const sameSession = (a, b) => Boolean(a && b && a.token === b.token && a.refreshToken === b.refreshToken && a.revision === b.revision);

export const attachAuthToken = (config) => {
    config.headers ||= {};
    config._authSession = sessionSnapshot();
    // Sign-out notifications may carry the explicitly captured token after
    // local teardown. They must neither attach another account nor refresh.
    if (!config.skipAuthRefresh) {
        if (config._authSession.token) config.headers.Authorization = `Bearer ${config._authSession.token}`;
        else delete config.headers.Authorization;
    }
    return config;
};

export const ApiClient = Axios.create({ baseURL: API_BASE_URL, headers: API_HEADER, timeout: JSON_REQUEST_TIMEOUT_MS });
export const ApiFormDataClient = Axios.create({ baseURL: API_BASE_URL, headers: FORM_DATA_HEADER, timeout: MULTIPART_REQUEST_TIMEOUT_MS });

let refreshFlight = null;
let lastSuccessfulRefresh = null;
const staleSessionError = () => new Axios.AxiosError("Session changed while refreshing. Please sign in again.", "ERR_SESSION_CHANGED");

const refreshSession = async (snapshot) => {
    try {
        const response = await Axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: snapshot.refreshToken }, { headers: API_HEADER, timeout: REFRESH_TIMEOUT_MS });
        if (!sameSession(snapshot, sessionSnapshot())) throw staleSessionError();
        const status = Number(response.data?.statusCode);
        if (status !== 200 || !response.data?.token) {
            if (status === 401 || status === 403) clearAllSessionTokens();
            return rejectApplicationFailure(response).then(() => { throw new Axios.AxiosError("Invalid refresh response", "ERR_BAD_RESPONSE", response.config, null, response); });
        }
        setAuthToken(response.data.token);
        if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
        const refreshed = sessionSnapshot();
        lastSuccessfulRefresh = { previous: snapshot, current: refreshed };
        return refreshed;
    } catch (error) {
        if ([401, 403].includes(error.response?.status) && sameSession(snapshot, sessionSnapshot())) clearAllSessionTokens();
        throw error;
    }
};

const handle401 = async (error, client) => {
    const request = error.config;
    if (!request || request._retry || request.skipAuthRefresh || /(?:^|\/)auth(?:\/|$)|(?:^|\/)logout(?:[/?]|$)/.test(request.url || "")) throw error;
    // Mark every caller before joining a flight so a replay can never refresh.
    request._retry = true;
    const snapshot = request._authSession;
    const current = sessionSnapshot();
    if (!snapshot?.token || !snapshot.refreshToken) throw error;
    let refreshed;
    if (!sameSession(snapshot, current)) {
        // A late response from the previous access token can use a refresh
        // already completed by a peer, but never another account's session.
        if (!sameSession(snapshot, lastSuccessfulRefresh?.previous) || !sameSession(current, lastSuccessfulRefresh?.current)) throw error;
        refreshed = current;
    } else {
        if (!refreshFlight || !sameSession(snapshot, refreshFlight.snapshot)) {
            const flight = { snapshot };
            flight.promise = refreshSession(snapshot).finally(() => { if (refreshFlight === flight) refreshFlight = null; });
            refreshFlight = flight;
        }
        refreshed = await refreshFlight.promise;
    }
    if (!sameSession(refreshed, sessionSnapshot())) throw staleSessionError();
    request.headers.Authorization = `Bearer ${refreshed.token}`;
    return client(request);
};

for (const client of [ApiClient, ApiFormDataClient]) {
    client.interceptors.request.use(attachAuthToken);
    client.interceptors.response.use(rejectApplicationFailure, error => error?.response?.status === 401 ? handle401(error, client) : Promise.reject(error));
}

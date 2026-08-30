import Axios from "axios";
import { API_BASE_URL, API_HEADER, FORM_DATA_HEADER, getAuthToken, setAuthToken, getRefreshToken, setRefreshToken, clearSavedUserLocation, clearAllSessionTokens } from "../../utils/constant";

// Attach the signed-in user's JWT to every request. Role-protected endpoints
// (create_service, book_appointment, …) reject requests without a valid token;
// public endpoints simply ignore the header.
export const attachAuthToken = (config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

export const ApiClient = Axios.create(
    {
        baseURL: API_BASE_URL,
        headers: API_HEADER
    }
);
ApiClient.interceptors.request.use(attachAuthToken);

export const ApiFormDataClient = Axios.create(
    {
        baseURL: API_BASE_URL,
        headers: FORM_DATA_HEADER
    }
);
ApiFormDataClient.interceptors.request.use(attachAuthToken);

// ── Auto-refresh on 401 ─────────────────────────────────────────────────────
// When the backend rejects a request because the access token expired, try to
// refresh silently.  The first caller gets the new token; concurrent 401s are
// queued and replayed once the refresh succeeds.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

const handle401 = async (error) => {
    const originalRequest = error.config;

    // If this request already retried, give up.
    if (originalRequest._retry) {
        return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return Promise.reject(error);
    }

    if (isRefreshing) {
        // Queue this request until the current refresh completes.
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return ApiClient(originalRequest);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
        const { data } = await Axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { headers: API_HEADER }
        );

        if (data?.statusCode === "200" && data?.token) {
            setAuthToken(data.token);
            if (data.refreshToken) {
                setRefreshToken(data.refreshToken);
            }
            processQueue(null, data.token);
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return ApiClient(originalRequest);
        }

        // Refresh failed — the server rejected the refresh token (revoked or
        // expired session). Tear the whole session down so the UI drops the
        // stale token/role and a 401 loop can't silently resurrect it.
        clearAllSessionTokens();
        processQueue(error, null);
        return Promise.reject(error);
    } catch (refreshError) {
        if (refreshError?.response) {
            // Server answered non-2xx — the refresh token is dead, clear it all.
            clearAllSessionTokens();
        } else {
            // Network-level failure: keep the tokens so a transient blip does
            // not log the user out, but drop the stale saved location.
            clearSavedUserLocation();
        }
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
    } finally {
        isRefreshing = false;
    }
};

ApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401 && !error.config?.url?.includes("/auth/")) {
            return handle401(error);
        }
        return Promise.reject(error);
    }
);

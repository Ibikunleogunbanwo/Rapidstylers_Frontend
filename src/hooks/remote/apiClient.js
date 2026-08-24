import Axios  from "axios";
import { API_BASE_URL, API_HEADER, FORM_DATA_HEADER, getAuthToken } from "../../utils/constant";

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
        baseURL : API_BASE_URL,
        headers : API_HEADER
    }
)
ApiClient.interceptors.request.use(attachAuthToken);

export const ApiFormDataClient = Axios.create(
    {
        baseURL : API_BASE_URL,
        headers : FORM_DATA_HEADER
    }
)
ApiFormDataClient.interceptors.request.use(attachAuthToken);

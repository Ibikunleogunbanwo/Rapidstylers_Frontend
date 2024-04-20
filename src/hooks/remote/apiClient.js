import Axios  from "axios";
import { API_BASE_URL, API_HEADER, FORM_DATA_HEADER } from "../../utils/constant";

export const ApiClient = Axios.create(
    {
        baseURL : API_BASE_URL,
        headers : API_HEADER
    }
)

export const ApiFormDataClient = Axios.create(
    {
        baseURL : API_BASE_URL,
        headers : FORM_DATA_HEADER
    }
)
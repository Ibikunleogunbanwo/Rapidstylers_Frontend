import { Axios } from "axios";
import { API_BASE_URL, API_HEADER, FORM_DATA_HEADER } from "../../utils/constant";

export const ApiCLient = Axios.create(
    {
        baseURL : API_BASE_URL,
        Headers : API_HEADER
    }
)

export const ApiFormDataClient = Axios.create(
    {
        baseURL : API_BASE_URL,
        Headers : FORM_DATA_HEADER
    }
)
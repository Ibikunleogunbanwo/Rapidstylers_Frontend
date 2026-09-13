/**
 * Application-level failure normalization (dependency-free, shared by both
 * API clients).
 *
 * The backend answers business failures as HTTP 200 with a body `statusCode` of
 * "400" (see Rapidstylers_Backend AppConstants.ERROR_STATUS_CODE) rather than a
 * 4xx status. Pages used to hand-roll `data.statusCode === "400"` checks, so any
 * place that forgot one treated a failure as a success — the failure mode the
 * frontend README warns about ("Login fails without a useful message").
 *
 * This converts such a response into a rejected promise shaped like an axios
 * error, so `APIService.extractError()` and every existing
 * `error?.response?.data?.message` handler keep working unchanged, and callers
 * can simply `catch`.
 *
 * Lives in its own module (no axios import) so both the axios client and unit
 * tests can use the exact same implementation without pulling in axios.
 */
export const rejectApplicationFailure = (response) => {
    const body = response?.data;
    const failed = body && typeof body === "object" && !Array.isArray(body)
        && body.statusCode !== undefined && body.statusCode !== null
        && String(body.statusCode) !== "200";
    if (!failed) {
        return response;
    }
    const error = new Error(body.message || "Request failed. Please try again.");
    error.isAxiosError = true;               // the shape extractError() expects
    error.response = response;               // pages read error.response.data.*
    error.config = response.config;
    error.appStatusCode = String(body.statusCode);
    // Inline reason for the booking modal (card declined, no payment method…).
    error.paymentError = body.data?.paymentError || null;
    return Promise.reject(error);
};

export default rejectApplicationFailure;

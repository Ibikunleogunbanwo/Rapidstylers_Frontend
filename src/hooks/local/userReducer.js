import { logoutSession } from "../../utils/sessionLogout";
import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { retrieveFromLocalStorage, showErrorToastMessage, showSuccessToastMessage, setAuthToken, setRefreshToken, setUserRole, getAuthToken, getUserRole, getSessionRevision } from "../../utils/constant";
import { APIService } from "../remote/apiService";

const initialState = {
    users : null,
    loading : false,
    error : null,
    isActionEnabled : false,
    ...retrieveFromLocalStorage([
        "userSessionData",
        "userDetailsData"
    ])
}

const saveToLocalStorage = (key,data)=>{
    localStorage.setItem(key, data);
}

export const verifySignUpEmailAddress = createAsyncThunk(
    "user/verifySignUpEmailAddress",
    async(data)=>{
        const apiVerifySignUpEmailAddress = await APIService.generateSignUpOtpCode(data);
        const response = await apiVerifySignUpEmailAddress.data;
        return response;
    }
)

export const verifyOtpCode = createAsyncThunk(
    "user/verifyOtpCode",
    async(data)=>{
        const apiVerifyOtpCode = await APIService.verifyOtpCode(data);
        const response = await apiVerifyOtpCode.data; 
        return response;
    }
)

/**
 * Keeps the tokens of a customer session, from sign-up or sign-in alike.
 * Both answer in the shape /sign_in uses: { token, refreshToken, data: { role, account } }.
 */
const startCustomerSession = (response) => {
    setAuthToken(response.token);
    if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
    }
    setUserRole("CUSTOMER");
    saveToLocalStorage("userSessionData", JSON.stringify(response.data.account));
};

/**
 * Creating an account also signs the customer in: the answer carries the
 * session, so no second, unchallenged sign-in call is needed. The reply's
 * `data` becomes the account, which is what every caller reads.
 */
export const createUserAccount = createAsyncThunk(
    "user/createUserAccount",
    async(data, { rejectWithValue })=>{
        try {
            const apiCreateUserAccount = await APIService.createUserAccount(data);
            const response = await apiCreateUserAccount.data;
            if (response.token && response.data?.account) {
                startCustomerSession(response);
                return { ...response, data: response.data.account };
            }
            return response;
        } catch (error) {
            // A server rejection (email already used, validation, lock-out) is a
            // real HTTP error, so the client throws before the body is seen. The
            // inline message on the signup screens lives in that body: carry its
            // statusCode and message as the rejected payload, otherwise the
            // caller would only ever see a request-level failure and could not
            // tell "this email already has an account" from a network error.
            const body = error?.response?.data;
            return rejectWithValue({
                statusCode: body?.statusCode ?? String(error?.response?.status ?? "400"),
                message: body?.message || "We couldn't create your account right now. Please try again.",
            });
        }
    }
)

/**
 * Customer sign-in for the hero and booking forms. It goes through /sign_in,
 * which carries the bot check, so `userData` must include the form's
 * captchaToken. A stylist or admin who signs in here is turned away rather than
 * left half signed in as a customer: those accounts sign in on /login.
 */
export const userAuthenticate = createAsyncThunk(
    "user/userLogin",
    async(userData) =>{
        const apiUserLogin = await APIService.signIn(userData);
        const response = await apiUserLogin.data;
        if (response.data?.role !== "CUSTOMER" || !response.data?.account) {
            return { statusCode: "400", message: "This sign-in is for customers. Stylists sign in on the main sign-in page." };
        }
        startCustomerSession(response);
        return { ...response, data: response.data.account };
    }
)

export const getStylerTypeList = createAsyncThunk(
    "user/stylerList",
    async()=>{
        const stylerListApi = await APIService.getStylerType();
        const response = await stylerListApi.data;
        return response;
    }
)
export const stylerByService = createAsyncThunk(
    "user/StylerByService",
    async(serviceId)=>{
        const apiStylerCategoryAPI = await APIService.stylersBaseOnCategory(serviceId);
        const response = await apiStylerCategoryAPI.data; 
        return response;
    }
)
export const singleStylerProfile = createAsyncThunk(
    "user/StylerProfile",
    async(stylerId)=>{
        const apiStylerProfileAPI = await APIService.singleStylerData(stylerId);
        const response = await apiStylerProfileAPI.data; 
        return response;
    }
)

export const searchStyler = createAsyncThunk(
    "user/SearchStyler",
    async(businessName)=>{
        const apiSearchStylerAPI = await APIService.searchForStyler(businessName);
        const response = await apiSearchStylerAPI.data; 
        return response;
    }
)

export const userPendingAppointments = createAsyncThunk(
    "user/PendingAppointment",
    async(userId)=>{
        const userPendingAppointmentAPI = await APIService.userPendingAppointment(userId);
        const response = await userPendingAppointmentAPI.data;
        return response;
    }
)

export const allUserAppointments = createAsyncThunk(
    "user/AllAppointment",
    async(userId)=>{
        const allUserAppointmentAPI = await APIService.allUserAppointment(userId);
        const response = await allUserAppointmentAPI.data;
        return response;
    }
)
const profileSessionMatches = (session, user) => Boolean(
    getAuthToken() && session.accountId &&
    getSessionRevision() === session.sessionRevision &&
    getUserRole() === session.userRole &&
    user?.userSessionData?.userId === session.accountId
);

export const getUserDetails = createAsyncThunk(
    "user/Details",
    async(userId, { getState, fulfillWithValue })=>{
        const session = {
            sessionRevision: getSessionRevision(),
            accountId: getState().user?.userSessionData?.userId,
            userRole: getUserRole(),
        };
        try {
            const userDetailsAPI = await APIService.getUserDetails(userId);
            if (!profileSessionMatches(session, getState().user)) {
                return fulfillWithValue(null, { staleSession: true });
            }
            const response = userDetailsAPI.data;
            saveToLocalStorage("userDetailsData", JSON.stringify(response.data));
            return fulfillWithValue(response, session);
        } catch (error) {
            if (!profileSessionMatches(session, getState().user)) {
                return fulfillWithValue(null, { staleSession: true });
            }
            throw error;
        }
    }
)

export const updateUserDetails = createAsyncThunk(
    "user/updateUserDetails",
    async(data)=>{
        const updateUserDetailsAPI = await APIService.updateUserDetails(data);
        const response = await updateUserDetailsAPI.data;
        return response;
    }
)
/**
 * Changing the password signs out every other device. The server hands this
 * device a fresh pair of tokens, so it stays signed in.
 */
export const changeUserPassword = createAsyncThunk(
    "user/updateUserPassword",
    async(data)=>{
        const updateUserPasswordApi = await APIService.updateUserPassword(data);
        const response = await updateUserPasswordApi.data;
        if (response.statusCode === "200" && response.token) {
            setAuthToken(response.token);
            if (response.refreshToken) {
                setRefreshToken(response.refreshToken);
            }
        }
        return response;
    }
)

export const addUserFeedBack = createAsyncThunk(
    "user/Feedback",
    async(data)=>{
        const addFeedBackAPI = await APIService.submitUserFeedBack(data);
        const response = await addFeedBackAPI.data;
        return response;
    }
)

export const userLogOut = createAsyncThunk(
    "user/LogOut",
    async()=>{
        logoutSession();
    }
)

const userSlice = createSlice({
    name : "user",
    reducers : {
        // Used by the unified /login page (APIService.signIn) to persist the
        // customer session exactly like userAuthenticate does, so the dashboard
        // guard (userSessionData) passes without a reload.
        setUserSession : (state, action) => {
            const payload = action.payload;
            state.isAuthenticated = true;
            state.users = payload;
            state.userSessionData = payload?.data?.account || payload?.data || null;
            if (state.userSessionData) {
                saveToLocalStorage("userSessionData", JSON.stringify(state.userSessionData));
            }
        },
    },
    initialState : initialState,
    extraReducers : (builder) => {
        builder.addCase(createUserAccount.fulfilled, (state,action)=>{
            if(action.payload.statusCode === "200" && action.payload.token){
                state.isAuthenticated = true;
                state.userSessionData = action.payload.data;
            }
        })
        .addCase(userAuthenticate.fulfilled, (state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                state.isAuthenticated = true;
                state.userSessionData = action.payload.data;
            }
            else{
                state.error = action.payload.message;
                showErrorToastMessage(action.payload.message);
            }
            state.loading= false;
        })
        .addCase(userAuthenticate.rejected, (state)=>{
            // No toast here: APIService.extractError already showed the reason
            // (wrong password, failed challenge, server down).
            state.loading = false;
            state.isAuthenticated = false;
        })
        .addCase(getUserDetails.fulfilled, (state,action)=>{
            if (action.meta.staleSession || !profileSessionMatches(action.meta, state)) return;
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                state.userDetailsData = action.payload.data;
            }
            state.loading = false;
        })
        .addCase(userLogOut.pending, (state)=>{
            state.isAuthenticated = false;
            state.loading = false;
            state.users = null;
            // Clear the in-memory session too — otherwise the layout guard
            // (which checks userSessionData) shows the previous account's
            // dashboard until a reload.
            state.userSessionData = null;
            state.userDetailsData = null;
        })

        //Fulfilled with notification message
        .addMatcher(isAnyOf(
            createUserAccount.fulfilled,
            verifyOtpCode.fulfilled,
            verifySignUpEmailAddress.fulfilled,
            updateUserDetails.fulfilled,
            changeUserPassword.fulfilled,
            addUserFeedBack.fulfilled
        ),(state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                showSuccessToastMessage(action.payload.message)
            }
            else{
                showErrorToastMessage(action.payload.message);
            }
            state.loading = false;
        })


        //Fulfilled without notification message
        .addMatcher(isAnyOf(
            getStylerTypeList.fulfilled,
            stylerByService.fulfilled,
            singleStylerProfile.fulfilled,
            searchStyler.fulfilled,
            userPendingAppointments.fulfilled,
            allUserAppointments.fulfilled,
        ),(state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
            }
            state.loading = false;
        })

        //General Pending matcher
        .addMatcher(isAnyOf(
            verifySignUpEmailAddress.pending,
            verifyOtpCode.pending,
            createUserAccount.pending,
            userAuthenticate.pending,
            getStylerTypeList.pending,
            stylerByService.pending,
            singleStylerProfile.pending,
            searchStyler.pending,
            userPendingAppointments.pending,
            allUserAppointments.pending,
            getUserDetails.pending,
            updateUserDetails.pending,
            changeUserPassword.pending,
            addUserFeedBack.pending,
        ), (state)=>{
            state.loading = true;
            state.users = null;
            state.error = null;
        })

        //General rejected matcher
        .addMatcher(isAnyOf(
            verifySignUpEmailAddress.rejected,
            verifyOtpCode.rejected,
            createUserAccount.rejected,
            getStylerTypeList.rejected,
            stylerByService.rejected,
            singleStylerProfile.rejected,
            searchStyler.rejected,
            userPendingAppointments.rejected,
            allUserAppointments.rejected,
            getUserDetails.rejected,
            updateUserDetails.rejected,
            changeUserPassword.rejected,
            addUserFeedBack.rejected
        ), (state,action)=>{
            state.loading = false;
            state.users = null;
            // No toast here: APIService.extractError already surfaced the error
            // before the thunk rejected — toasting again duplicates the message.
            // A thunk that rejects with a value carries the server's own message
            // in `payload`; fall back to the transport error for the rest.
            state.error = action.payload?.message || action.error?.message || "An error occurred";
        })
    },
})
export const { setUserSession } = userSlice.actions;
export const userReducer = userSlice.reducer;
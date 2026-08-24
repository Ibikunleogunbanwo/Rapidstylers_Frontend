import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { retrieveFromLocalStorage, showErrorToastMessage, showSuccessToastMessage, setAuthToken, clearAuthToken } from "../../utils/constant";
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

export const createUserAccount = createAsyncThunk(
    "user/createUserAccount",
    async(data)=>{
        const apiCreateUserAccount = await APIService.createUserAccount(data);
        const response = await apiCreateUserAccount.data;
        return response;
    }
)

export const userAuthenticate = createAsyncThunk(
    "user/userLogin",
    async(userData) =>{
        const apiUserLogin = await APIService.userSignIn(userData);
        const response = await apiUserLogin.data;
        saveToLocalStorage("userSessionData", JSON.stringify(response.data));
        if (response.token) {
            setAuthToken(response.token);
        }
        return response;
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
export const getUserDetails = createAsyncThunk(
    "user/Details",
    async(userId)=>{
        const userDetailsAPI = await APIService.getUserDetails(userId);
        const response = await userDetailsAPI.data;
        saveToLocalStorage("userDetailsData", JSON.stringify(response.data));
        return response;
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
export const changeUserPassword = createAsyncThunk(
    "user/updateUserPassword",
    async(data)=>{
        const updateUserPasswordApi = await APIService.updateUserPassword(data);
        const response = await updateUserPasswordApi.data;
        return response;
    }
)

export const updateCardDetail = createAsyncThunk(
    "user/updateCardDetail",
    async(data)=>{
        const updateCardDetailAPI = await APIService.updateUserCardDetails(data);
        const response = await updateCardDetailAPI.data;
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

const logOutSession = () =>{
    localStorage.removeItem("user");
    localStorage.removeItem("userSessionData"); 
    localStorage.removeItem("userDetailsData");
    clearAuthToken();
}

export const userLogOut = createAsyncThunk(
    "user/LogOut",
    async()=>{
        logOutSession();
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
        builder.addCase(userAuthenticate.fulfilled, (state,action)=>{
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
        .addCase(userAuthenticate.rejected, (state,action)=>{
            state.loading = false;
            state.isAuthenticated = false;
            state.error = showErrorToastMessage("Server Down, Contact Admin");
        })
        .addCase(getUserDetails.fulfilled, (state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                state.userDetailsData = action.payload.data;
            }
            state.loading = false;
        })
        .addCase(userLogOut.fulfilled, (state,action)=>{
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
            updateCardDetail.fulfilled,
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
            updateCardDetail.pending,
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
            updateCardDetail.rejected,
            addUserFeedBack.rejected
        ), (state,action)=>{
            state.loading = false;
            state.users = null;
            // No toast here: APIService.extractError already surfaced the error
            // before the thunk rejected — toasting again duplicates the message.
            state.error = action.error?.message || "An error occurred";
        })
    },
})
export const { setUserSession } = userSlice.actions;
export const userReducer = userSlice.reducer;
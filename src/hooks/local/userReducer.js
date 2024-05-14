import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { retrieveFromLocalStorage, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
import { APIService } from "../remote/apiService";
import { getPeriodOfDay } from "../../utils/utility";

const initialState = {
    users : null,
    loading : false,
    error : null,
    isActionEnabled : false,
    ...retrieveFromLocalStorage([
        "userSessionData"
    ])
}

const saveToLocalStorage = (key,data)=>{
    sessionStorage.setItem(key, data);
}
const periodOfTheDay = getPeriodOfDay();

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
    async(serviceId)=>{
        const apiStylerProfileAPI = await APIService.singleStylerData(serviceId);
        const response = await apiStylerProfileAPI.data; 
        return response;
    }
)

const logOutSession = () =>{
    sessionStorage.removeItem("userSessionData"); 
}

export const userLogOut = createAsyncThunk(
    "user/LogOut",
    async()=>{
        logOutSession();
    }
)

const userSlice = createSlice({
    name : "user",
    reducers : {},
    initialState : initialState,
    extraReducers : (builder) => {
        builder.addCase(verifySignUpEmailAddress.fulfilled, (state,action) =>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                showSuccessToastMessage(action.payload.message)
            } 
            else{
                showErrorToastMessage(action.payload.message);
            }
            state.loading = false;
        })
        .addCase(verifyOtpCode.fulfilled, (state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                showSuccessToastMessage(action.payload.message)
            }
            else{
                showErrorToastMessage(action.payload.message);
            }
            state.loading = false;
        })  
        .addCase(createUserAccount.fulfilled, (state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                showSuccessToastMessage(action.payload.message)
            }
            else{
                showErrorToastMessage(action.payload.message);
            }
            state.loading = false;
        })
        .addCase(userAuthenticate.fulfilled, (state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
                state.isAuthenticated = true;
                state.userSessionData = action.payload.data;
                showSuccessToastMessage(`Good ${periodOfTheDay} `+action.payload.data.firstname);
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
        .addMatcher(isAnyOf(
            getStylerTypeList.fulfilled,
            stylerByService.fulfilled,
            singleStylerProfile.fulfilled
        ),(state,action)=>{
            if(action.payload.statusCode === "200"){
                state.users = action.payload;
            }
            state.loading = false;
        })
        .addMatcher(isAnyOf(
            verifySignUpEmailAddress.pending,
            verifyOtpCode.pending,
            createUserAccount.pending,
            userAuthenticate.pending,
            getStylerTypeList.pending,
            stylerByService.pending,
            singleStylerProfile.pending
        ), (state)=>{
            state.loading = true;
            state.users = null;
            state.error = null;
        })
        .addMatcher(isAnyOf(
            verifySignUpEmailAddress.rejected,
            verifyOtpCode.rejected,
            createUserAccount.rejected,
            getStylerTypeList.rejected,
            stylerByService.rejected,
            singleStylerProfile.rejected
        ), (state,action)=>{
            state.loading = false;
            state.users = null;
            state.error = showErrorToastMessage(action.error.message);
        })
    },
})
export const userReducer = userSlice.reducer;
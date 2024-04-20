import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { retrieveFromLocalStorage, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
import { APIService } from "../remote/apiService";

const initialState = {
    users : null,
    loading : false,
    error : null,
    isActionEnabled : false,
    ...retrieveFromLocalStorage([

    ])
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
        .addMatcher(isAnyOf(
            verifySignUpEmailAddress.pending,
            verifyOtpCode.pending
        ), (state)=>{
            state.loading = true;
            state.users = null;
            state.error = null;
        })
        .addMatcher(isAnyOf(
            verifySignUpEmailAddress.rejected,
            verifyOtpCode.rejected
        ), (state,action)=>{
            state.loading = false;
            state.users = null;
            state.error = showErrorToastMessage(action.error.message);
        })
    },
})
export const userReducer = userSlice.reducer;
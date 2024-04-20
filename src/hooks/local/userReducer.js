import { createSlice } from "@reduxjs/toolkit";
import { retrieveFromLocalStorage } from "../../utils/constant";

const initialState = {
    users : null,
    loading : false,
    error : null,
    isActionEnabled : false,
    ...retrieveFromLocalStorage([

    ])
}

const userSlice = createSlice({
    name : "user",
    reducers : {},
    initialState : initialState,
    extraReducers : (builder) => {
    
    },
})
export const userReducer = userSlice.reducer;
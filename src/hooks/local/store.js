import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "./userReducer";

const store = configureStore({
    reducer: {
        user: userReducer,
    },
    devTools: true
});
export default store;
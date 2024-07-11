import { showErrorToastMessage } from "../../utils/constant";
import { ApiClient } from "./apiClient";

export class APIService {
    static extractError(error){
        let extracted;
        if(error.isAxiosError){
            if(error.request){
                extracted = ["Network Error Occurred"];
            }
            else if(error.response){
                extracted = [error.response.message];
            }
            else{
                extracted = ["An Unexpected Error occurred"];
            }
        }
        else{
            extracted = [error.response.message || "An Unexpected Error occurred"];
        }
        extracted.forEach((error)=>showErrorToastMessage(error));
    }

    static async  generateSignUpOtpCode(userData){
        try{
            return ApiClient.post("/generate_sign_up_otp_code", userData)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async verifyOtpCode(otpCode){
        try{
            return ApiClient.get(`/verify_otp_code?otpCode=${otpCode}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createUserAccount(data){
        try{
            return ApiClient.post("/create_user_account", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async userSignIn(data){
        try{
            return ApiClient.post("/user_sign_in", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getStylerType(){
        try{
            return ApiClient.get(`/list_service`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async stylersBaseOnCategory(categoryId){
        try{
            return ApiClient.get(`/search_by_service?serviceTypeId=${categoryId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async singleStylerData(stylerId){
        try{
            return ApiClient.get(`/single_styler?stylerId=${stylerId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async searchForStyler(businessName){
        try{
            return ApiClient.get(`/search_styler?businessName=${businessName}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async userPendingAppointment(userId){
        try{
            return ApiClient.get(`/user_pending_appointments?userId=${userId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async allUserAppointment(userId){
        try{
            return ApiClient.get(`/user_appointments?userId=${userId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getUserDetails(userId){
        try{
            return ApiClient.get(`/user_data?userId=${userId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateUserDetails(data){
        try{
            return ApiClient.post("/update_user_data", data)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateUserPassword(data){
        try{
            return ApiClient.post("/update_user_password", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
}
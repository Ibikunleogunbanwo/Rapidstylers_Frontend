import { showErrorToastMessage } from "../../utils/constant";
import { ApiClient } from "./apiClient";

export class APIService {
    static extractError(error){
        let extracted;
        if(error.isAxiosError){
            if(error.response){
                const data = error.response.data;
                // Validation errors: backend returns { data: { field: "message" } }
                if(data?.data && typeof data.data === "object" && !Array.isArray(data.data)){
                    const fieldErrors = Object.values(data.data).filter(v => typeof v === "string");
                    if(fieldErrors.length > 0){
                        extracted = fieldErrors;
                    } else {
                        extracted = [data?.message || `Request failed (${error.response.status})`];
                    }
                } else {
                    extracted = [data?.message || `Request failed (${error.response.status})`];
                }
            }
            else if(error.request){
                extracted = ["Unable to reach the server. Please check your connection and try again."];
            }
            else{
                extracted = ["Something went wrong. Please try again."];
            }
        }
        else{
            extracted = [error.message || "Something went wrong. Please try again."];
        }
        extracted.forEach((err)=>showErrorToastMessage(err));
    }

    static async stylerGenerateOtp(data){
        try{
            return ApiClient.post("/styler_generate_otp", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async stylerVerifyOtp(otpCode){
        try{
            return ApiClient.get(`/styler_verify_otp?otpCode=${otpCode}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createStyler(data){
        try{
            return ApiClient.post("/create_styler", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
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
    /** Unified sign-in for customers, stylists and admins — routes by the role in the response. */
    static async signIn(data){
        try{
            return ApiClient.post("/sign_in", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async listIdentificationTypes(){
        try{
            return ApiClient.get(`/list_identification`)
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

    // ── Admin-only endpoints (require an ADMIN-role JWT via the interceptor) ─
    static async adminSignIn(data){
        try{
            return ApiClient.post("/admin_sign_in", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminCreateService(data){
        try{
            return ApiClient.post("/create_service", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateService(data){
        try{
            return ApiClient.post("/update_service", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminDeleteService(id){
        try{
            return ApiClient.get(`/delete_service?id=${id}`);
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
    static async searchByProvince(province){
        try{
            return ApiClient.get(`/search_by_province?province=${encodeURIComponent(province)}`)
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

    
    static async updateUserCardDetails(data){
        try{
            return ApiClient.post("/update_card_details", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async submitUserFeedBack(data){
        try{
            return ApiClient.post("/add_feedback", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Location ─────────────────────────────────────────────────────────
    static async detectLocation(){
        try{
            return ApiClient.get(`/detect-location`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async reverseGeocode(lat, lng){
        try{
            return ApiClient.get(`/reverse-geocode?lat=${lat}&lng=${lng}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async searchNearby(lat, lng, radius = 25, serviceTypeId = "", city = ""){
        try{
            let url = `/search_nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
        if(serviceTypeId) url += `&serviceTypeId=${serviceTypeId}`;
        if(city) url += `&city=${encodeURIComponent(city)}`;
            return ApiClient.get(url);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Gallery (Pexels proxy) ────────────────────────────────────────────
    static async searchGallery(category, perPage = 12){
        try{
            return ApiClient.get(`/gallery?category=${encodeURIComponent(category)}&per_page=${perPage}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Blog ─────────────────────────────────────────────────────────────
    // list_blog / single_blog are public; create/update/delete require ADMIN.
    static async listBlog(){
        try{
            return ApiClient.get(`/list_blog`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async singleBlog(id){
        try{
            return ApiClient.get(`/single_blog?id=${id}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminCreateBlog(data){
        try{
            return ApiClient.post("/create_blog", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateBlog(data){
        try{
            return ApiClient.post("/update_blog", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminDeleteBlog(id){
        try{
            return ApiClient.get(`/delete_blog?id=${id}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
}
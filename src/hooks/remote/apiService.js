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
            return await ApiClient.post("/styler_generate_otp", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async stylerVerifyOtp(otpCode){
        try{
            return await ApiClient.get(`/styler_verify_otp?otpCode=${otpCode}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createStyler(data){
        try{
            return await ApiClient.post("/create_styler", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async  generateSignUpOtpCode(userData){
        try{
            return await ApiClient.post("/generate_sign_up_otp_code", userData)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async verifyOtpCode(otpCode){
        try{
            return await ApiClient.get(`/verify_otp_code?otpCode=${otpCode}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createUserAccount(data){
        try{
            return await ApiClient.post("/create_user_account", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async userSignIn(data){
        try{
            return await ApiClient.post("/user_sign_in", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    /** Unified sign-in for customers, stylists and admins — routes by the role in the response. */
    static async signIn(data){
        try{
            const response = await ApiClient.post("/sign_in", data);
            if(response.data?.statusCode && response.data.statusCode !== "200"){
                const error = new Error(response.data?.message || "Sign in failed");
                error.handledByApiService = true;
                APIService.extractError(error);
                throw error;
            }
            return response;
        }
        catch(error){
            if(!error.handledByApiService){
                APIService.extractError(error);
            }
            throw(error);
        }
    }
    static async listIdentificationTypes(){
        try{
            return await ApiClient.get(`/list_identification`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getStylerType(){
        try{
            return await ApiClient.get(`/list_service`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Admin-only endpoints (require an ADMIN-role JWT via the interceptor) ─
    static async adminSignIn(data){
        try{
            const response = await ApiClient.post("/admin_sign_in", data);
            if(response.data?.statusCode && response.data.statusCode !== "200"){
                const error = new Error(response.data?.message || "Admin sign in failed");
                error.handledByApiService = true;
                APIService.extractError(error);
                throw error;
            }
            return response;
        }
        catch(error){
            if(!error.handledByApiService){
                APIService.extractError(error);
            }
            throw(error);
        }
    }
    static async adminCreateService(data){
        try{
            return await ApiClient.post("/create_service", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateService(data){
        try{
            return await ApiClient.post("/update_service", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminDeleteService(id){
        try{
            return await ApiClient.get(`/delete_service?id=${id}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getStylerVerificationQueue(){
        try{
            return await ApiClient.get("/admin/styler_verification_queue");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateStylerVerification(data){
        try{
            return await ApiClient.post("/admin/update_styler_verification", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getAllPortfolios(){
        try{
            return await ApiClient.get("/admin/all_portfolios");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminDeletePortfolioImage(portfolioId){
        try{
            return await ApiClient.post("/admin/delete_portfolio_image", { portfolioId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createReview(data){
        try{
            return await ApiClient.post("/create_review", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getOwnPortfolio(){
        try{
            return await ApiClient.get("/styler_own_portfolio");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createSubService(data){
        try{
            return await ApiClient.post("/create_sub_service", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async listSubServices(stylerId){
        try{
            return stylerId === "self"
                ? await ApiClient.get("/styler_own_sub_services")
                : await ApiClient.get(`/list_sub_service?stylerId=${encodeURIComponent(stylerId)}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createPortfolio(data){
        try{
            return await ApiClient.post("/create_portfolio", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async stylersBaseOnCategory(categoryId){
        try{
            return await ApiClient.get(`/search_by_service?serviceTypeId=${categoryId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async singleStylerData(stylerId){
        try{
            return await ApiClient.get(`/single_styler?stylerId=${stylerId}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async searchForStyler(businessName){
        try{
            return await ApiClient.get(`/search_styler?businessName=${businessName}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async searchByProvince(province){
        try{
            return await ApiClient.get(`/search_by_province?province=${encodeURIComponent(province)}`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // Account-owned reads: identity comes from the Bearer token (JWT subject), not a query param.
    static async userPendingAppointment(){
        try{
            return await ApiClient.get(`/user_pending_appointments`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async allUserAppointment(){
        try{
            return await ApiClient.get(`/user_appointments`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getUserDetails(){
        try{
            return await ApiClient.get(`/user_data`)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async listSavedStylists(){
        try{
            return await ApiClient.get(`/saved_stylists`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async saveStylist(stylerId){
        try{
            return await ApiClient.post(`/save_stylist?stylerId=${encodeURIComponent(stylerId)}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async removeSavedStylist(stylerId){
        try{
            return await ApiClient.post(`/remove_saved_stylist?stylerId=${encodeURIComponent(stylerId)}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async listNotifications(){
        try{
            return await ApiClient.get("/notifications");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async markNotificationRead(notificationId){
        try{
            return await ApiClient.post("/notifications/read", { notificationId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async markAllNotificationsRead(){
        try{
            return await ApiClient.post("/notifications/read_all");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async getNotificationPreferences(){
        try{
            return await ApiClient.get("/notification_preferences");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateNotificationPreferences(data){
        try{
            return await ApiClient.post("/notification_preferences", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateSubService(data){
        try{
            return await ApiClient.post("/update_sub_service", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateUserDetails(data){
        try{
            return await ApiClient.post("/update_user_data", data)
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateUserPassword(data){
        try{
            return await ApiClient.post("/update_user_password", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    
    static async updateUserCardDetails(data){
        try{
            return await ApiClient.post("/update_card_details", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    /** Stripe Connect Express onboarding — creates/reuses the stylist account and returns the hosted link. */
    static async createStylerConnectAccount(data){
        try{
            return await ApiClient.post("/styler/connect_account", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    /** Earnings + commission breakdown + live Stripe balances for the stylist. */
    /** Admin: read/update the platform commission percent (runtime, no restart). */
    static async getCommissionSetting(){
        try{
            return await ApiClient.get("/admin/settings/commission");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async updateCommissionSetting(commissionPercent){
        try{
            return await ApiClient.post("/admin/settings/commission", { commissionPercent });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async getStylerPayouts(){
        try{
            return await ApiClient.get("/styler/payouts");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async getStylerBusinessSummary(){
        try{
            return await ApiClient.get("/styler/business_summary");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    /** Admin view: per-stylist business stats (appointments, revenue, popular services). */
    static async adminStylerBusinessSummaries(){
        try{
            return await ApiClient.get("/admin/styler_business_summaries");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    /** Admin support view: every stylist's Connect payout status, problems first. */
    static async adminStylerConnectStatuses(){
        try{
            return await ApiClient.get("/admin/styler_connect_statuses");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    static async getStylerConnectStatus(){
        try{
            return await ApiClient.get("/styler/connect_status");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    /** Returns a Stripe SetupIntent clientSecret for saving a card in Elements. */
    static async getCardSetupIntent(){
        try{
            return await ApiClient.get("/card_setup_intent");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Marketplace booking (identity comes from the Bearer token) ────────
    static async estimateBooking(data){
        try{
            return await ApiClient.post("/booking_estimate", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async bookAppointment(data){
        try{
            const response = await ApiClient.post("/book_appointment", data);
            // Business errors come back as HTTP 200 with a non-200 statusCode —
            // surface them so the booking modal can show the reason inline.
            if(response.data?.statusCode && response.data.statusCode !== "200"){
                const error = new Error(response.data.message || "Booking failed. Please try again.");
                error.paymentError = response.data.data?.paymentError || null;
                error.handledByApiService = true;
                throw error;
            }
            return response;
        }
        catch(error){
            if(!error.handledByApiService){
                APIService.extractError(error);
            }
            throw(error);
        }
    }
    static async stylerAppointments(){
        try{
            return await ApiClient.get(`/styler_appointments`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async stylerAvailability(){
        try{
            return await ApiClient.get(`/styler_availability`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async updateStylerAvailability(slots){
        try{
            return await ApiClient.post("/update_styler_availability", { slots });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async stylerAvailabilityExceptions(){
        try{
            return await ApiClient.get(`/styler_availability_exceptions`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async addAvailabilityException(data){
        try{
            return await ApiClient.post("/add_availability_exception", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async deleteAvailabilityException(exceptionId){
        try{
            return await ApiClient.post("/delete_availability_exception", { exceptionId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async stylerSignOut(){
        try{
            return await ApiClient.get(`/styler_sign_out`);
        }
        catch(error){
            // Best-effort — local sign-out must succeed even if the call fails.
        }
    }
    static async acceptAppointment(appointmentId){
        try{
            return await ApiClient.post("/accept_appointment", { appointmentId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async declineAppointment(appointmentId){
        try{
            return await ApiClient.post("/decline_appointment", { appointmentId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async completeAppointment(appointmentId){
        try{
            return await ApiClient.post("/complete_appointment", { appointmentId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async retryAppointmentPayment(appointmentId){
        try{
            return await ApiClient.post("/retry_appointment_payment", { appointmentId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async cancelAppointment(appointmentId){
        try{
            return await ApiClient.post("/cancel_appointment", { appointmentId });
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async createSupportTicket(data){
        try{
            return await ApiClient.post("/support_tickets", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async listSupportTickets(){
        try{
            return await ApiClient.get("/support_tickets");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminSupportTickets(){
        try{
            return await ApiClient.get("/admin/support_tickets");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateSupportTicket(data){
        try{
            return await ApiClient.post("/admin/update_support_ticket", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminKpis(){
        try{
            return await ApiClient.get("/admin/kpis");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminAuditLogs(){
        try{
            return await ApiClient.get("/admin/audit_logs");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminReviewQueue(){
        try{
            return await ApiClient.get("/admin/review_moderation_queue");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateReviewModeration(data){
        try{
            return await ApiClient.post("/admin/update_review_moderation", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async getLoyaltyAccount(){
        try{
            return await ApiClient.get("/loyalty_account");
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async applyReferral(referralCode){
        try{
            return await ApiClient.post(`/apply_referral?referralCode=${encodeURIComponent(referralCode)}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async submitUserFeedBack(data){
        try{
            return await ApiClient.post("/add_feedback", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Places (proxied through the backend so the Google key stays server-side) ──
    static async placeAutocomplete(input){
        try{
            return await ApiClient.get(`/place_autocomplete?input=${encodeURIComponent(input)}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async placeDetails(placeId){
        try{
            return await ApiClient.get(`/place_details?placeId=${encodeURIComponent(placeId)}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Location ─────────────────────────────────────────────────────────
    static async detectLocation(){
        try{
            return await ApiClient.get(`/detect-location`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async reverseGeocode(lat, lng){
        try{
            return await ApiClient.get(`/reverse-geocode?lat=${lat}&lng=${lng}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async searchNearby(lat, lng, radius = 25, serviceTypeId = "", city = "", filters = {}){
        try{
            let url = `/search_nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
        if(serviceTypeId) url += `&serviceTypeId=${serviceTypeId}`;
        if(city) url += `&city=${encodeURIComponent(city)}`;
        if(filters.requestedDate) url += `&requestedDate=${encodeURIComponent(filters.requestedDate)}`;
        if(filters.requestedTime) url += `&requestedTime=${encodeURIComponent(filters.requestedTime)}`;
        if(filters.durationMinutes) url += `&durationMinutes=${encodeURIComponent(filters.durationMinutes)}`;
        if(filters.openNow) url += `&openNow=true`;
            return await ApiClient.get(url);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }

    // ── Gallery (Pexels proxy) ────────────────────────────────────────────
    static async searchGallery(category, perPage = 12, page = 1, query = ""){
        try{
            let url = `/gallery?category=${encodeURIComponent(category)}&per_page=${perPage}&page=${page}`;
            if(query && query.trim()) url += `&query=${encodeURIComponent(query.trim())}`;
            return await ApiClient.get(url);
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
            return await ApiClient.get(`/list_blog`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async singleBlog(id){
        try{
            return await ApiClient.get(`/single_blog?id=${id}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminCreateBlog(data){
        try{
            return await ApiClient.post("/create_blog", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminUpdateBlog(data){
        try{
            return await ApiClient.post("/update_blog", data);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
    static async adminDeleteBlog(id){
        try{
            return await ApiClient.get(`/delete_blog?id=${id}`);
        }
        catch(error){
            APIService.extractError(error);
            throw(error);
        }
    }
}

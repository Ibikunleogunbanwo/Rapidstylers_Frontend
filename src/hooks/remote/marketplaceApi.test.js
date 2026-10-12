import { APIService } from './apiService';
import { ApiClient } from './apiClient';
vi.mock('./apiClient',()=>({ApiClient:{post:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();ApiClient.post.mockResolvedValue({data:{statusCode:'200'}});});
test('legacy travel-settings API keeps two-argument body unchanged',async()=>{await APIService.updateStylerTravelSettings(8,'12.00');expect(ApiClient.post).toHaveBeenCalledWith('/update_styler_travel_settings',{includedTravelKm:8,baseTravelFee:'12.00'});});
test('travel settings whitelist location options and preserve explicit false and null',async()=>{await APIService.updateStylerTravelSettings(8,'12.00',{offersSalonVisits:false,offersHomeVisits:true,maxTravelKm:null,baseTravelFee:'999',unknown:true});expect(ApiClient.post).toHaveBeenCalledWith('/update_styler_travel_settings',{includedTravelKm:8,baseTravelFee:'12.00',offersSalonVisits:false,offersHomeVisits:true,maxTravelKm:null});});

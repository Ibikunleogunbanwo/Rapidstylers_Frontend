import { ApiClient } from './apiClient';
export const responseData = response => {
  if (String(response?.data?.statusCode) !== '200') throw new Error(response?.data?.message || 'The request could not be completed.');
  return response.data.data;
};
export const requestError = error => error?.response?.data?.message || error?.message || 'Unable to reach the server. Try again.';
export const MarketplaceAPI = {
  serviceAreas: () => ApiClient.get('/admin/service_areas').then(responseData),
  publicServiceAreas: () => ApiClient.get('/service_areas').then(responseData),
  saveServiceArea: body => ApiClient.post('/admin/save_service_area', body).then(responseData),
  deleteServiceArea: id => ApiClient.post('/admin/delete_service_area', {id}).then(responseData),
  promotions: () => ApiClient.get('/admin/promo_codes').then(responseData),
  savePromotion: body => ApiClient.post('/admin/save_promo_code', body).then(responseData),
  redemptions: promoId => ApiClient.get('/admin/promo_redemptions', {params: {promoId}}).then(responseData),
  checkPromotion: body => ApiClient.post('/check_promo_code', body).then(responseData),
  signupFunnel: params => ApiClient.get('/admin/signup_funnel', {params}).then(responseData),
  travelSettings: () => ApiClient.get('/styler/travel_settings').then(responseData),
  saveTravelSettings: body => ApiClient.post('/update_styler_travel_settings', body).then(responseData),
};

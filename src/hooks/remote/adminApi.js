import { ApiClient } from './apiClient';
import { responseData } from './marketplaceApi';

/**
 * Admin reads and writes added after the original APIService class: gallery
 * moderation, the review lists, bookings and revenue, refund context, the saved
 * reconciliation report, announcement history and customer feedback. Every call
 * resolves to the response's `data` and rejects with the backend's message, so
 * pages can show `error.message` (or requestError(error)) as is.
 */
const get = (path, params) => ApiClient.get(path, { params }).then(responseData);
const post = (path, body) => ApiClient.post(path, body).then(responseData);
/** Admin-account changes re-prove the acting owner's password in a header, never the body. */
const postWithStepUp = (path, body, stepUpPassword) =>
  ApiClient.post(path, body, { headers: { 'X-Step-Up-Password': stepUpPassword } }).then(responseData);

/** A CSV download: the body is the file, unless the backend answered with a JSON error. */
const download = async (path, params, fallbackName) => {
  const response = await ApiClient.get(path, { params, responseType: 'blob' });
  const blob = response.data;
  if (blob && /json/i.test(blob.type || '')) {
    const body = JSON.parse(await blob.text());
    throw new Error(body?.message || 'The export could not be created.');
  }
  const match = /filename="?([^";]+)"?/i.exec(response.headers?.['content-disposition'] || '');
  return { blob, filename: match ? match[1] : fallbackName };
};

export const AdminAPI = {
  identificationImage: stylerId => get('/admin/identification_image', { stylerId }),
  galleryModeration: params => get('/admin/gallery_moderation', params),
  galleryImageHistory: portfolioId => get('/admin/gallery_image_history', { portfolioId }),
  approveGalleryImage: (portfolioId, note) => post('/admin/approve_gallery_image', { portfolioId, note: note || null }),
  rejectGalleryImage: (portfolioId, note) => post('/admin/reject_gallery_image', { portfolioId, note }),
  reviews: params => get('/admin/reviews', params),
  reviewQueue: () => get('/admin/review_moderation_queue'),
  moderateReview: (reviewId, action) => post('/admin/update_review_moderation', { reviewId, action }),
  bookings: params => get('/admin/bookings', params),
  bookingDetail: appointmentId => get('/admin/booking_detail', { appointmentId }),
  bookingsExport: params => download('/admin/bookings_export', params, 'rapidstylers-bookings.csv'),
  revenue: params => get('/admin/revenue', params),
  refundContext: appointmentId => get('/admin/refund_context', { appointmentId }),
  reconciliationLatest: () => get('/admin/payment_reconciliation_latest'),
  announcements: () => get('/admin/announcements'),
  /** {count} of active customers, or of stylists when audience is STYLISTS. */
  announcementAudienceCount: audience => get('/admin/announcement_audience_count', audience ? { audience } : undefined),
  /**
   * One page of the legacy ID-photo move (owner only): {dryRun, afterId, limit}.
   * Resolves the page's totals and nextAfterId (null when the last page is done).
   */
  migrateIdentificationImages: ({ dryRun = true, afterId, limit } = {}) => post('/admin/migrate_identification_images', {
    dryRun,
    ...(afterId !== undefined && afterId !== null ? { afterId } : {}),
    ...(limit ? { limit } : {}),
  }),
  auditLogs: params => get('/admin/audit_logs', params),
  feedback: () => get('/list_feedback'),
  me: () => get('/admin/me'),
  accounts: () => get('/admin/accounts'),
  createAccount: (account, stepUpPassword) => postWithStepUp('/admin/accounts', account, stepUpPassword),
  changeAccountRole: (id, role, stepUpPassword) => postWithStepUp(`/admin/accounts/${id}/role`, { role }, stepUpPassword),
  changeAccountPassword: (id, password, stepUpPassword) => postWithStepUp(`/admin/accounts/${id}/password`, { password }, stepUpPassword),
};

/** Hands a downloaded file to the browser. */
export const saveFile = ({ blob, filename }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

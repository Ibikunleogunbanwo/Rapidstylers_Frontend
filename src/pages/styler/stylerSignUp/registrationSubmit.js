/** Keep completed uploads visible even when a sibling fails. Never delete photos
 * after an ambiguous account response: the server may already have attached them. */
export async function submitRegistration({ files, payload, upload, remove, create }) {
  const results = await Promise.allSettled([
    upload(files.profileImageFile, 'profile'),
    upload(files.identificationImageFile, 'id'),
  ]);
  const uploaded = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  const cleanup = () => Promise.allSettled(uploaded.map(result => result?.publicId && remove(result.publicId)));
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    await cleanup();
    if (failed.reason?.code === "SIGNUP_PASS_EXPIRED") {
      throw Object.assign(
        new Error("Your email confirmation has expired. Verify your email again with a new code to finish. Everything you entered is saved."),
        { stage: "upload", code: "SIGNUP_PASS_EXPIRED" }
      );
    }
    const message = failed.reason?.code === "UPLOAD_AUTHORIZATION"
      ? "Photo uploads are temporarily unavailable. Please try again later or contact support."
      : "Photo upload failed. Check your connection and try again.";
    throw Object.assign(new Error(message), { stage: "upload" });
  }
  if (uploaded.some(result => !result?.url)) {
    await cleanup();
    throw Object.assign(new Error('Photo upload failed. Check your connection and try again.'), { stage: 'upload' });
  }
  const uncertain = () => Object.assign(new Error('We could not confirm whether your account was created. Try signing in before registering again.'), { uncertain: true });
  let response;
  try {
    response = await create({ ...payload, profileImageUrl: uploaded[0].url, identificationImageUrl: uploaded[1].url });
  } catch (error) {
    // Only explicit client rejections establish that creation did not succeed.
    const status = Number(error.response?.data?.statusCode ?? error.response?.status);
    if (status >= 400 && status < 500 && status !== 408) {
      await cleanup();
      throw error;
    }
    throw uncertain();
  }
  const status = Number(response.data?.statusCode);
  if (status === 200) return response;
  if (status >= 400 && status < 500 && status !== 408) {
    await cleanup();
    return response;
  }
  throw uncertain();
}

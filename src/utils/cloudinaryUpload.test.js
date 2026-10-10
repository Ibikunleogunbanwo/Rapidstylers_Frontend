import { buildSignedUploadFormData, assertUploadAllowed, cloudinaryUploadUrl, signatureRequestConfig } from "./cloudinaryUpload";
import { AUTH_TOKEN_STORAGE_KEY } from "./constant";
import { saveSignupUploadPass } from "./signupUploadPass";

/** The shape the backend returns today: cloudName + the exact signed parameter set. */
const SIGNED = {
  cloudName: "rapid",
  params: {
    api_key: "api-key",
    timestamp: "1700000000",
    folder: "rapid_stylers/profile",
    allowed_formats: "jpg,jpeg,png,webp,gif",
    max_file_size: "5242880",
    signature: "abc123",
  },
  allowedFormats: "jpg,jpeg,png,webp,gif",
  maxFileSize: "5242880",
};

const entries = (formData) => Object.fromEntries(formData.entries());
const jpeg = (name = "photo.jpg") => new File([new Uint8Array(8)], name, { type: "image/jpeg" });

describe("buildSignedUploadFormData", () => {
  /**
   * Cloudinary rejects any upload whose parameters differ from the signed set,
   * so the constraints must travel with the file rather than being named by hand.
   */
  test("forwards the signed parameter set verbatim, constraints included", () => {
    const body = buildSignedUploadFormData(jpeg(), SIGNED);

    expect(entries(body)).toEqual({
      file: expect.anything(),
      api_key: "api-key",
      timestamp: "1700000000",
      folder: "rapid_stylers/profile",
      allowed_formats: "jpg,jpeg,png,webp,gif",
      max_file_size: "5242880",
      signature: "abc123",
    });
  });

  /** Keeps a frontend deploy safe while the previously deployed backend answers. */
  test("falls back to the flat legacy fields when params is absent", () => {
    const legacy = {
      cloudName: "rapid",
      apiKey: "api-key",
      timestamp: "1700000000",
      folder: "rapid_stylers",
      signature: "abc123",
    };

    expect(entries(buildSignedUploadFormData(jpeg(), legacy))).toEqual({
      file: expect.anything(),
      api_key: "api-key",
      timestamp: "1700000000",
      folder: "rapid_stylers",
      signature: "abc123",
    });
  });

  test("skips parameters with no value instead of sending empty fields", () => {
    const signed = { cloudName: "rapid", params: { api_key: "k", folder: null, signature: "s" } };

    const body = entries(buildSignedUploadFormData(jpeg(), signed));

    expect(body).not.toHaveProperty("folder");
    expect(body.signature).toBe("s");
  });

  test("uses an explicit filename for a camera Blob that has none", () => {
    const blob = new Blob([new Uint8Array(4)], { type: "image/png" });

    const formData = buildSignedUploadFormData(blob, SIGNED, "profile.png");
    const sent = formData.get("file");

    expect(sent.name).toBe("profile.png");
  });

  test("keeps the uploaded file's own name when none is given", () => {
    const formData = buildSignedUploadFormData(jpeg("stylist-photo.jpg"), SIGNED);

    expect(formData.get("file").name).toBe("stylist-photo.jpg");
  });
});

describe("assertUploadAllowed", () => {
  test("rejects a file over the signed size ceiling", () => {
    const signed = { allowedFormats: "jpg", maxFileSize: "4" };

    expect(() => assertUploadAllowed(jpeg(), signed)).toThrow(/too large/i);
  });

  test("rejects a type outside the signed format list", () => {
    const pdf = new File([new Uint8Array(4)], "cv.pdf", { type: "application/pdf" });

    expect(() => assertUploadAllowed(pdf, SIGNED)).toThrow(/only .* images/i);
  });

  test("accepts a format by MIME type and by extension", () => {
    // Browsers sometimes report an empty type for files dragged in from an OS
    // file manager, so the extension is accepted as a second signal.
    const noType = new File([new Uint8Array(4)], "photo.PNG", { type: "" });

    expect(() => assertUploadAllowed(jpeg(), SIGNED)).not.toThrow();
    expect(() => assertUploadAllowed(noType, SIGNED)).not.toThrow();
  });

  test("does not block when the backend signed no constraints", () => {
    const anything = new File([new Uint8Array(4)], "anything.bmp", { type: "image/bmp" });

    expect(() => assertUploadAllowed(anything, { cloudName: "rapid" })).not.toThrow();
  });
});

describe("cloudinaryUploadUrl", () => {
  test("targets the configured cloud", () => {
    expect(cloudinaryUploadUrl(SIGNED)).toBe("https://api.cloudinary.com/v1_1/rapid/image/upload");
  });
});

describe("signatureRequestConfig", () => {
  afterEach(() => sessionStorage.clear());

  /** A stylist still signing up has no account token, only the pass their email code earned. */
  test("shows the sign-up upload pass when nobody is signed in", () => {
    saveSignupUploadPass("upload-pass");
    expect(signatureRequestConfig()).toEqual({ headers: { Authorization: "Bearer upload-pass" }, skipAuthRefresh: true });
  });

  test("leaves a signed-in stylist's own token to ApiClient", () => {
    saveSignupUploadPass("upload-pass");
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "stylist-token");
    expect(signatureRequestConfig()).toBeUndefined();
  });

  test("adds nothing when there is no pass", () => {
    expect(signatureRequestConfig()).toBeUndefined();
  });
});

test('preserves signup upload authorization through the actual request interceptor', async()=>{
 const {attachAuthToken}=await import('../hooks/remote/apiClient');
 saveSignupUploadPass('upload-pass');
 expect(attachAuthToken(signatureRequestConfig()).headers.Authorization).toBe('Bearer upload-pass');
 sessionStorage.clear();
});

test('classifies provider authorization failures without exposing signature details',async()=>{
 const {ApiClient}=await import('../hooks/remote/apiClient');const {uploadToCloudinary}=await import('./cloudinaryUpload');
 const get=vi.spyOn(ApiClient,'get').mockResolvedValue({data:{data:SIGNED}});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401,json:async()=>({error:{message:'Invalid Signature private-value'}})}));
 try {await expect(uploadToCloudinary(jpeg(),'profile')).rejects.toMatchObject({code:'UPLOAD_AUTHORIZATION',message:'Photo upload failed'});} finally {get.mockRestore();vi.unstubAllGlobals();}
});

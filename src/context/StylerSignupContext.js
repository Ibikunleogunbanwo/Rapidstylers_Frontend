import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  clearSignupDraft,
  clearSignupPhotos,
  readSignupDraft,
  readSignupPhotos,
  saveSignupPhotos,
  writeSignupDraft,
} from "../utils/signupDraft";

const StylerSignupContext = createContext(null);

/**
 * Every answer the flow collects, before anyone has answered anything. The draft
 * is merged over this, so a stored draft adds to the shape rather than defining
 * it and a renamed field cannot arrive as undefined.
 */
const EMPTY_FORM_DATA = {
  // Step 1 — personal details
  firstname: "",
  lastname: "",
  emailAddress: "",
  phoneNumber: "",
  agreeToTerms: false,

  // Step 2 — business details
  serviceTypeId: "",
  serviceTypeName: "",
  businessName: "",
  address: "",         // full formatted address from Places autocomplete
  businessAddress: "", // same as address — backend requires this field
  country: "Canada",
  state: "Alberta",     // backend @NotEmpty — defaults to province
  businessProvince: "", // backend expects this name, not "province"
  streetAddress: "",
  unit: "",
  city: "",
  postalCode: "",
  latitude: null,
  longitude: null,

  // Step 3 — password
  password: "",

  // Identification fields
  identificationTypeId: "",
  identificationImageUrl: "",
  profileImageUrl: "",
};

/**
 * The answers that differ from the flow's own defaults, which is to say the ones a
 * professional actually gave.
 *
 * Two reasons this is a subtraction rather than a copy. It is what lets an
 * untouched form leave no draft behind, since the flow's own starting values
 * (`country: "Canada"`, `state: "Alberta"`) would otherwise read as answers to
 * every question. And a draft storing only entered values cannot freeze a default
 * into place: change `EMPTY_FORM_DATA` tomorrow and a draft written today still
 * takes the new one, because it never carried the old one.
 */
const enteredOnly = (formData) => {
  const kept = {};
  Object.keys(formData).forEach((key) => {
    if (!Object.is(formData[key], EMPTY_FORM_DATA[key])) kept[key] = formData[key];
  });
  return kept;
};

/**
 * Wraps the 5-step styler signup wizard.
 * Accumulates values from each step into a single flat object
 * so the final step can POST everything to /create_styler.
 *
 * Everything it accumulates is also written to storage as it changes, so a reload
 * continues the signup instead of restarting it. The typed answers are read back
 * synchronously here, which is what lets the guard in the shell decide where a
 * visitor belongs before it paints; the two photos are binary, so they are read
 * from IndexedDB a moment later and `restoringPhotos` says whether that read is
 * still outstanding.
 */
export function StylerSignupProvider({ children }) {
  // Read once, so the first render is decided on the answers this tab already
  // holds rather than on empty fields that would bounce the professional back.
  const [storedDraft] = useState(readSignupDraft);

  // Image files picked on the photos step. Kept OUT of formData (which is
  // the create_styler payload) so File objects never get JSON-serialized.
  // Uploads to Cloudinary are deferred until the final submit so abandoned
  // signups don't leave orphaned images.
  const [imageFiles, setImageFiles] = useState({
    profileImageFile: null,
    identificationImageFile: null,
  });

  // Set once the emailed code has been accepted. It is separate from
  // `formData.emailAddress`, which is written as soon as step 1 is submitted: the
  // address alone cannot tell a verified email from one that is still pending, and
  // the flow uses this to decide whether the business step is reachable yet.
  const [emailVerified, setEmailVerified] = useState(storedDraft?.emailVerified === true);

  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM_DATA,
    ...(storedDraft?.formData || {}),
  }));

  // The photos are the only part of the draft that cannot be read synchronously,
  // so the flow has to know while they are still on their way.
  const [restoringPhotos, setRestoringPhotos] = useState(true);

  useEffect(() => {
    let cancelled = false;
    readSignupPhotos()
      .then((photos) => {
        if (cancelled) return;
        if (photos.profileImageFile || photos.identificationImageFile) {
          setImageFiles((prev) => ({ ...prev, ...photos }));
        }
      })
      .finally(() => {
        if (!cancelled) setRestoringPhotos(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Answers are written as they change, so a reload a moment later finds them.
  // This runs on the mount render as well, which is what removes a draft that no
  // longer holds anything rather than leaving it to be read back later.
  useEffect(() => {
    writeSignupDraft({ formData: enteredOnly(formData), emailVerified });
  }, [formData, emailVerified]);

  // Photos are written whenever the picked set changes, but not before the stored
  // ones have been read back: this effect runs on the mount render too, and
  // persisting the empty initial state then would delete the photos it is about
  // to restore.
  useEffect(() => {
    if (restoringPhotos) return;
    saveSignupPhotos(imageFiles);
  }, [imageFiles, restoringPhotos]);

  /** Merge partial data from the current step */
  const updateData = useCallback((partial) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  /** Merge picked image files (photos step) */
  const updateImageFiles = useCallback((partial) => {
    setImageFiles((prev) => ({ ...prev, ...partial }));
  }, []);

  /** The emailed code was accepted, so the verification step is behind us. */
  const markEmailVerified = useCallback(() => setEmailVerified(true), []);

  /**
   * The account exists, so the remembered answers have done their job. Leaving
   * them would hand the next professional signing up in this tab a form filled in
   * with someone else's details.
   */
  const forgetSignupDraft = useCallback(() => {
    clearSignupDraft();
    clearSignupPhotos();
  }, []);

  return (
    <StylerSignupContext.Provider
      value={{
        formData,
        updateData,
        imageFiles,
        updateImageFiles,
        emailVerified,
        markEmailVerified,
        restoringPhotos,
        forgetSignupDraft,
      }}
    >
      {children}
    </StylerSignupContext.Provider>
  );
}

export function useStylerSignup() {
  const ctx = useContext(StylerSignupContext);
  if (!ctx) throw new Error("useStylerSignup must be used within StylerSignupProvider");
  return ctx;
}

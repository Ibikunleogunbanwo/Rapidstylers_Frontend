import { Formik, Form } from "formik";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Buttons from "../../../components/button";
import ImageUpload from "../../../components/ImageUpload";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { APIService } from "../../../hooks/remote/apiService";

/* ── Zod schema ─────────────────────────────────────────────────────── */
// Files are required, not URLs — images are only uploaded to Cloudinary at
// the final submit, so an abandoned signup never leaves orphaned images.
const imagesSchema = z.object({
  profileImageFile: z.any().refine((f) => f instanceof File, "Profile photo is required"),
  identificationTypeId: z.string().min(1, "Select an ID type"),
  identificationImageFile: z.any().refine((f) => f instanceof File, "ID photo is required"),
});

function toFormikErrors(zodError) {
  const out = {};
  zodError.issues.forEach((issue) => {
    const field = issue.path[0];
    if (field && !out[field]) out[field] = issue.message;
  });
  return out;
}

/* ── Component ──────────────────────────────────────────────────────── */
const ImagesStep = () => {
  const navigate = useNavigate();
  const { formData, updateData, imageFiles, updateImageFiles } = useStylerSignup();
  const [idTypes, setIdTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    APIService.listIdentificationTypes()
      .then((res) => {
        const items = res.data?.data || [];
        setIdTypes(items.map((t) => ({
          id: t.id || t.identificationId,
          name: t.identificationName || t.name,
        })));
      })
      .catch(() => setIdTypes([]))
      .finally(() => setLoadingTypes(false));
  }, []);

  const initialValues = {
    profileImageFile: imageFiles.profileImageFile || null,
    identificationTypeId: formData.identificationTypeId || "",
    identificationImageFile: imageFiles.identificationImageFile || null,
  };

  const validate = (values) => {
    const result = imagesSchema.safeParse(values);
    if (result.success) return {};
    return toFormikErrors(result.error);
  };

  const handleSubmit = (values) => {
    updateData({ identificationTypeId: values.identificationTypeId });
    // Files already live in context (updateImageFiles on pick) — nothing
    // is uploaded here, so there is nothing to clean up if the user leaves.
    navigate("/styler-signup/secure-account");
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={validate}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form>
          <p className="my-4 font-bold">Upload your photos:</p>

          {/* Profile image */}
          <div className="mb-5">
            <ImageUpload
              label="Profile photo"
              deferUpload
              file={values.profileImageFile}
              onFileSelected={(file) => {
                setFieldValue("profileImageFile", file);
                updateImageFiles({ profileImageFile: file });
              }}
            />
            {touched.profileImageFile && errors.profileImageFile && (
              <p className="text-red-500 text-xs mt-1">{errors.profileImageFile}</p>
            )}
          </div>

          {/* ID type selector */}
          <div className="mb-4">
            <span className="font-medium text-sm pb-1 block">Valid ID type:</span>
            {loadingTypes ? (
              <p className="text-sm text-gray-500">Loading ID types…</p>
            ) : idTypes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {idTypes.map((t) => (
                  <label
                    key={t.id}
                    className={`text-sm text-center rounded p-3 cursor-pointer border transition-colors ${
                      values.identificationTypeId === t.id
                        ? "bg-brand text-white border-brand"
                        : "bg-[#c4c4c416] border-[#c4c4c440] hover:border-brand/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="identificationTypeId"
                      value={t.id}
                      checked={values.identificationTypeId === t.id}
                      onChange={() => setFieldValue("identificationTypeId", t.id)}
                      className="sr-only"
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            ) : (
              // The backend stores ID types as numeric ids and rejects
              // anything else, so a hardcoded label list would 500 on
              // submit. Block the step until an admin adds ID types.
              <div className="p-4 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-700">
                ID types haven't been set up yet. Ask an admin to add them
                (e.g. Driver's license, Passport) before completing this step.
              </div>
            )}
            {touched.identificationTypeId && errors.identificationTypeId && (
              <p className="text-red-500 text-xs mt-1">{errors.identificationTypeId}</p>
            )}
          </div>

          {/* ID image */}
          <div className="mb-5">
            <ImageUpload
              label="Upload ID photo"
              deferUpload
              file={values.identificationImageFile}
              onFileSelected={(file) => {
                setFieldValue("identificationImageFile", file);
                updateImageFiles({ identificationImageFile: file });
              }}
            />
            {touched.identificationImageFile && errors.identificationImageFile && (
              <p className="text-red-500 text-xs mt-1">{errors.identificationImageFile}</p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/styler-signup/business-details")}
              className="py-3 px-5 text-sm text-gray-600 font-medium border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <Buttons
              btnText="Continue"
              btnType="primary"
              type="submit"
              disabled={isSubmitting}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ImagesStep;

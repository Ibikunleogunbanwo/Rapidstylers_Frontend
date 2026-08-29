import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import Input from "../../../components/input";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import { useFormik } from "formik";
import * as Yup from "yup";
import Buttons from "../../../components/button";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../components/spinner";
import { getUserDetails, updateUserDetails } from "../../../hooks/local/userReducer";

/**
 * Best-effort parse of a stored Canadian address line like
 * "123 Main St, Unit 4, Toronto, ON M5V 2T6, Canada" back into
 * its components so the form can pre-fill the structured fields.
 */
const parseCanadianAddress = (full) => {
  if (!full) return {};
  const parts = full
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 3) return {};
  // The token carrying the postal code ("AB T2P 1B5" or just "T2P 1B5")
  let postalIdx = -1;
  parts.forEach((p, i) => {
    if (postalIdx === -1 && /[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/.test(p)) postalIdx = i;
  });
  if (postalIdx === -1) return {};
  const provPostal = parts[postalIdx];
  const pIdx = provPostal.search(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/);
  return {
    street: parts.slice(0, postalIdx - 1).join(", "),
    city: postalIdx - 1 >= 0 ? parts[postalIdx - 1] : "",
    province: provPostal.slice(0, pIdx).trim(),
    postalCode: provPostal.slice(pIdx).toUpperCase().trim(),
    country: parts[postalIdx + 1] || "Canada",
  };
};

/** Canadian convention: "123 Main St, Unit 4, Toronto, ON M5V 2T6, Canada" */
const composeCanadianAddress = (v) =>
  [
    v.street,
    v.unit ? (/^(apt|unit|suite|#)/i.test(v.unit) ? v.unit : `Unit ${v.unit}`) : "",
    v.city,
    [v.province, v.postalCode].filter(Boolean).join(" "),
    v.country,
  ]
    .filter(Boolean)
    .join(", ");

const UpdateInformation = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Update personal information | RapidStylers";
  }));

  const dispatch = useDispatch();
  // userDetailsData can be null (fresh reload with a persisted session, or a
  // failed fetch) — never assume another page has loaded it first.
  const userDetails = useSelector((state) => state.user.userDetailsData)?.userData || null;
  const [fetching, setFetching] = useState(!userDetails);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (userDetails) return;
    let cancelled = false;
    setFetching(true);
    setFetchFailed(false);
    // Identity comes from the Bearer token — no arg needed.
    dispatch(getUserDetails())
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Update personal information</h1>
            <p className="mt-0.5 text-xs text-gray-500">Update your contact and address details</p>
          </div>
        </div>
      </div>

      {!userDetails && fetching && (
        <div className="p-10 text-center text-sm text-black/50">Loading your details...</div>
      )}
      {!userDetails && !fetching && fetchFailed && (
        <div className="p-10 text-center text-sm text-red-500">
          Could not load your details.{" "}
          <button
            type="button"
            className="text-brand underline"
            onClick={() => { setFetching(true); setFetchFailed(false); dispatch(getUserDetails()).catch(() => setFetchFailed(true)).finally(() => setFetching(false)); }}
          >
            Retry
          </button>
        </div>
      )}
      {userDetails && <UpdatePersonalForm userDetails={userDetails} />}
    </div>
  );
};

// Rendered only once user details are present, so formik's initialValues are
// computed with real data (mounting the form later would freeze empty values).
const UpdatePersonalForm = ({ userDetails }) => {
  const dispatch = useDispatch();
  const parsed = parseCanadianAddress(userDetails.address || "");
  const updatePersonalInformation = useFormik({
    initialValues: {
      emailAddress: userDetails.emailAddress || "",
      firstname: userDetails.firstname || "",
      lastname: userDetails.lastname || "",
      phoneNumber: userDetails.phoneNumber || "",
      street: parsed.street || userDetails.address || "",
      unit: parsed.unit || "",
      city: parsed.city || "",
      province: parsed.province || userDetails.state || "",
      postalCode: parsed.postalCode || "",
      country: parsed.country || userDetails.country || "Canada",
    },
    validationSchema: Yup.object({
      firstname: Yup.string().matches(/^[A-Za-z]+$/, 'Firstname can only contain letters'),
      lastname: Yup.string()
        .matches(/^[A-Za-z]+$/, 'Lastname can only contain letters'),
      phoneNumber: Yup.string()
        .matches(/^[\d+]+$/, 'Phone number can only contain digits'),
      street: Yup.string().required('Street address is required'),
      city: Yup.string().required('City is required'),
      province: Yup.string().required('Province is required'),
      postalCode: Yup.string()
        .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Enter a valid Canadian postal code (e.g. T2P 1B5)')
        .required('Postal code is required'),
      country: Yup.string().required('Country is required'),
    }),
    onSubmit: async (values) => {
        const {emailAddress, phoneNumber, firstname,lastname,country} = values;
        // Persist the single-line address in Canadian convention — the backend
        // stores address + state (province) + country for user accounts.
        const address = composeCanadianAddress(values);
        let updateUserData = {emailAddress, phoneNumber,firstname,lastname,country,address,state: values.province};
        const { payload } = await(dispatch(updateUserDetails(updateUserData)));
        if(payload?.statusCode === "200") {
          dispatch(getUserDetails());
        }
    },
  });
  return (
    <form onSubmit={updatePersonalInformation.handleSubmit}>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={"Firstname:"}
          type={"text"}
          name={"firstname"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.firstname}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.firstname && updatePersonalInformation.touched.firstname ? updatePersonalInformation.errors.firstname : null} />
        <Input label={"Lastname:"}
          type={"text"}
          name={"lastname"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.lastname}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.lastname && updatePersonalInformation.touched.lastname ? updatePersonalInformation.errors.lastname : null} />
        <Input label={"Phone number:"}
          type={"tel"}
          name={"phoneNumber"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.phoneNumber}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.phoneNumber && updatePersonalInformation.touched.phoneNumber ? updatePersonalInformation.errors.phoneNumber : null} />

        {/* Google Places search — auto-computes every Canadian field below */}
        <div className="col-span-1 md:col-span-2">
          <AddressAutocomplete
            label="Find your address:"
            value={updatePersonalInformation.values.street}
            placeholder={"Start typing your address…"}
            onChange={(data) => {
              // Free-text edits carry only the raw line — update the street without
              // wiping the computed Canadian fields. A real Places selection carries
              // parsed components, so it recomputes everything.
              const isSelection = !!(data.city || data.province || data.postalCode);
              updatePersonalInformation.setFieldValue("street", data.streetAddress || data.formattedAddress || "");
              if (isSelection) {
                updatePersonalInformation.setFieldValue("unit", data.unit || "");
                updatePersonalInformation.setFieldValue("city", data.city || "");
                updatePersonalInformation.setFieldValue("province", data.province || "");
                updatePersonalInformation.setFieldValue("postalCode", (data.postalCode || "").toUpperCase());
                updatePersonalInformation.setFieldValue("country", data.country || "Canada");
                ["street", "city", "province", "postalCode", "country"].forEach((f) =>
                  updatePersonalInformation.setFieldTouched(f, true, false)
                );
              }
            }}
          />
        </div>

        <Input label={"Street address:"}
          type={"text"}
          name={"street"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.street}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.street && updatePersonalInformation.touched.street ? updatePersonalInformation.errors.street : null} />
        <Input label={"Unit / Apt / Suite:"}
          type={"text"}
          name={"unit"}
          placeholder={"Optional"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.unit}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.unit && updatePersonalInformation.touched.unit ? updatePersonalInformation.errors.unit : null} />
        <Input label={"City:"}
          type={"text"}
          name={"city"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.city}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.city && updatePersonalInformation.touched.city ? updatePersonalInformation.errors.city : null} />
        <Input label={"Province:"}
          type={"text"}
          name={"province"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.province}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.province && updatePersonalInformation.touched.province ? updatePersonalInformation.errors.province : null} />
        <Input label={"Postal code:"}
          type={"text"}
          name={"postalCode"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.postalCode}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.postalCode && updatePersonalInformation.touched.postalCode ? updatePersonalInformation.errors.postalCode : null} />
        <Input label={"Country:"}
          type={"text"}
          name={"country"}
          onBlur={updatePersonalInformation.handleBlur}
          value={updatePersonalInformation.values.country}
          onChange={updatePersonalInformation.handleChange}
          onError={updatePersonalInformation.errors.country && updatePersonalInformation.touched.country ? updatePersonalInformation.errors.country : null} />
        <div>
          <Buttons btnType={"light"} btnText={"Update Information"} type={"submit"} /></div>
      </div>
    </form>
  );
};

export default UpdateInformation;

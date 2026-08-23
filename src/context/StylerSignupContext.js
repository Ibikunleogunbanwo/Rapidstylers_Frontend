import { createContext, useContext, useState, useCallback } from "react";

const StylerSignupContext = createContext(null);

/**
 * Wraps the 3-step styler signup wizard.
 * Accumulates values from each step into a single flat object
 * so the final step can POST everything to /create_styler.
 */
export function StylerSignupProvider({ children }) {
  const [formData, setFormData] = useState({
    // Step 1 — personal details
    firstname: "",
    lastname: "",
    emailAddress: "",
    phoneNumber: "",

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
  });

  /** Merge partial data from the current step */
  const updateData = useCallback((partial) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <StylerSignupContext.Provider value={{ formData, updateData }}>
      {children}
    </StylerSignupContext.Provider>
  );
}

export function useStylerSignup() {
  const ctx = useContext(StylerSignupContext);
  if (!ctx) throw new Error("useStylerSignup must be used within StylerSignupProvider");
  return ctx;
}

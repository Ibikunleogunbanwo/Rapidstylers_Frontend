/**
 * Signup has to be honest about the business address.
 *
 * Visiting the professional is the default delivery, so an address-less profile
 * cannot be listed, approved or booked. The signup form is where that starts:
 * the address is required here, and the copy says who reads it, because a
 * professional who types a mailing address will silently never appear in search.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BusinessDetails from "./businessDetails";

const updateData = vi.fn();

vi.mock("../../../context/StylerSignupContext", () => ({
  useStylerSignup: () => ({ formData: {}, updateData }),
}));

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    getStylerType: vi.fn(() =>
      // Service ids arrive from the API as strings, which is what the form schema expects.
      Promise.resolve({ data: { data: [{ serviceTypeId: "1", serviceTypeName: "Barber" }] } })
    ),
  },
}));

// The real component is a Google Places input; what matters here is that it
// hands the form the same parsed shape a real selection produces.
vi.mock("../../../components/AddressAutocomplete", () => ({
  default: ({ onChange }) => (
    <input
      aria-label="Business address"
      onChange={(event) =>
        onChange({
          formattedAddress: event.target.value,
          streetAddress: event.target.value,
          city: "Calgary",
          province: "Alberta",
          postalCode: "T2P 1J9",
          country: "Canada",
        })
      }
    />
  ),
}));

const renderStep = () =>
  render(
    <MemoryRouter initialEntries={["/styler-signup/business-details"]}>
      <Routes>
        <Route path="/styler-signup/business-details" element={<BusinessDetails />} />
        <Route path="/styler-signup/photos" element={<div>photos step</div>} />
      </Routes>
    </MemoryRouter>
  );

// The shared InputWithLabel renders its caption as a span, not a <label>, so the
// fields are addressed by name rather than by accessible name.
const field = (name) => document.querySelector(`input[name="${name}"]`);

const fillEverythingButAddress = async () => {
  // Clicking the label does not toggle a Formik radio under jsdom; the input does.
  await userEvent.click(await screen.findByRole("radio", { name: /barber/i }));
  await userEvent.type(field("businessName"), "Ada Studio");
  await userEvent.type(field("city"), "Calgary");
  await userEvent.type(field("province"), "Alberta");
  await userEvent.type(field("postalCode"), "T2P 1J9");
};

describe("styler signup business details", () => {
  it("tells the professional that clients travel to the address", async () => {
    renderStep();

    expect(
      await screen.findByText(/clients travel here when they book a visit/i)
    ).toBeInTheDocument();
  });

  it("refuses to continue without an address", async () => {
    renderStep();
    await fillEverythingButAddress();

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/business address is required/i)).toBeInTheDocument();
    expect(screen.queryByText("photos step")).not.toBeInTheDocument();
    expect(updateData).not.toHaveBeenCalled();
  });

  it("carries the chosen address into the signup context", async () => {
    renderStep();
    await fillEverythingButAddress();

    await userEvent.type(screen.getByLabelText("Business address"), "700 2 St SW");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(updateData).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "700 2 St SW",
          businessAddress: "700 2 St SW",
          streetAddress: "700 2 St SW",
        })
      )
    );
    await waitFor(() => expect(screen.getByText("photos step")).toBeInTheDocument());
  });
});
